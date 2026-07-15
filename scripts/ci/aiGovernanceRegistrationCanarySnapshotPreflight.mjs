import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import { resolveHermeticGitExecutable } from './aiGovernanceHermeticGitInventory.mjs';
import {
  collectRegistrationCanaryPacketFailures,
  REGISTRATION_CANARY_PACKET,
} from './aiGovernanceRegistrationCanaryPacket.mjs';
import {
  readStableSnapshotFile,
  verifyEvolutionSealedWorktreeSnapshot,
} from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';
import { snapshotRegistrationCanaryBoundFiles } from './prepare-ai-registration-canary.mjs';
import { createMessageReader, request, serializeMessage } from './mcpLineDelimitedStdioClient.mjs';

export const REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT = Object.freeze({
  id: 'mcp-registration-canary-snapshot-preflight',
  version: '1.0.0',
});

const hashValue = (domain, value) => createHash('sha256').update(JSON.stringify({ domain, value })).digest('hex');
const stableValue = value => Array.isArray(value) ? value.map(stableValue)
  : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stableValue(value[key])]))
    : value;
const safeRuntimeEnvironment = (home, temporaryDirectory, gitExecutable) => ({
  PATH: [...new Set([path.dirname(process.execPath), path.dirname(gitExecutable)])].join(path.delimiter),
  HOME: home,
  CODEX_HOME: path.join(home, '.codex'),
  TMPDIR: temporaryDirectory,
  TMP: temporaryDirectory,
  TEMP: temporaryDirectory,
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: os.devNull,
  GIT_NO_LAZY_FETCH: '1',
  GIT_NO_REPLACE_OBJECTS: '1',
  GIT_OPTIONAL_LOCKS: '0',
  LANG: 'C',
  LC_ALL: 'C',
  ...(process.platform === 'win32' && process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
});

const readExpectedBindings = (snapshotRoot, fixtureRevision, environmentSha256) => {
  const corpus = readEvolutionEvalCorpus(path.join(snapshotRoot, 'evals/ai-governance/cases.json'));
  if (corpus.failures.length > 0) throw new Error(corpus.failures.join('; '));
  const casesById = new Map(corpus.cases.map(item => [item.id, item]));
  const experiments = readEvolutionExperiments(path.join(snapshotRoot, 'evals/ai-governance/experiments.json'), { casesById });
  if (experiments.failures.length > 0) throw new Error(experiments.failures.join('; '));
  const caseItem = casesById.get(REGISTRATION_CANARY_PACKET.caseId);
  const experiment = experiments.experiments.find(item => item.id === REGISTRATION_CANARY_PACKET.experimentId);
  return {
    fixtureRevision,
    environmentSha256,
    ...snapshotRegistrationCanaryBoundFiles(snapshotRoot, caseItem, experiment),
  };
};

const readMcpConfig = (snapshotRoot) => {
  const config = JSON.parse(readStableSnapshotFile(snapshotRoot, '.mcp.json', 1024 * 1024).bytes.toString('utf8'));
  const server = config.mcpServers?.['jsonutils-governance'];
  if (!server || server.command !== 'node'
    || JSON.stringify(server.args) !== JSON.stringify(['scripts/mcp/jsonutils-governance-server.mjs'])
    || Object.keys(server).some(field => !['command', 'args'].includes(field))) {
    throw new Error('snapshot preflight 只接受仓内固定 keyless stdio MCP 配置');
  }
  return server;
};

const assertJsonRpcResult = (response, label) => {
  if (!response || response.error || !Object.hasOwn(response, 'result')) {
    throw new Error(`${label} 返回 JSON-RPC error`);
  }
  return response.result;
};

const signalChildTree = (child, signal) => {
  try {
    if (process.platform !== 'win32' && Number.isInteger(child.pid) && child.pid > 0) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try { child.kill(signal); } catch {}
  }
};

const stopChild = child => new Promise((resolve) => {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    resolve();
  };
  child.once('close', finish);
  const timeout = setTimeout(() => {
    if (finished) return;
    if (child.exitCode === null && child.signalCode === null) signalChildTree(child, 'SIGKILL');
    child.stdout.destroy();
    child.stderr.destroy();
    finish();
  }, 1000);
  signalChildTree(child, 'SIGTERM');
  if ((child.exitCode !== null || child.signalCode !== null) && child.stdout.destroyed && child.stderr.destroyed) finish();
});

const runtimeHomeIdentity = (home) => {
  const stat = fs.lstatSync(home, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('snapshot runtime home 不是普通目录');
  return { dev: stat.dev, ino: stat.ino };
};

const verifyRetainedRuntimeHome = (home, expectedIdentity) => {
  const stat = fs.lstatSync(home, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.dev !== expectedIdentity.dev
    || stat.ino !== expectedIdentity.ino || Number(stat.mode & 0o777n) !== 0o700
    || JSON.stringify(fs.readdirSync(home).sort()) !== JSON.stringify(['.codex', 'tmp'])) {
    throw new Error('snapshot runtime home identity、mode 或 exact set 漂移');
  }
  ['.codex', 'tmp'].forEach((name) => {
    const child = fs.lstatSync(path.join(home, name), { bigint: true });
    if (!child.isDirectory() || child.isSymbolicLink() || Number(child.mode & 0o777n) !== 0o700
      || fs.readdirSync(path.join(home, name)).length !== 0) {
      throw new Error('snapshot runtime home 子目录发生持久写入或 mode 漂移');
    }
  });
  return Object.freeze({ stableObserved: true, retained: true, cleanupVerified: false });
};

const callSnapshotScorecard = async (snapshotRoot) => {
  const server = readMcpConfig(snapshotRoot);
  const gitExecutable = resolveHermeticGitExecutable(snapshotRoot);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-snapshot-preflight-home-'));
  fs.chmodSync(home, 0o700);
  fs.mkdirSync(path.join(home, '.codex'), { mode: 0o700 });
  const temporaryDirectory = path.join(home, 'tmp');
  fs.mkdirSync(temporaryDirectory, { mode: 0o700 });
  const expectedHomeIdentity = runtimeHomeIdentity(home);
  const child = spawn(process.execPath, server.args, {
    cwd: snapshotRoot,
    env: safeRuntimeEnvironment(home, temporaryDirectory, gitExecutable),
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
  });
  child.stdin.on('error', () => {});
  let stderrByteCount = 0;
  child.stderr.on('data', (chunk) => {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    stderrByteCount += bytes.length;
  });
  child.stderr.on('error', () => {});
  const readMessage = createMessageReader(child.stdout, undefined, {
    maxBufferedBytes: 256 * 1024,
    maxQueuedMessages: 16,
  });
  let result;
  let runtimeHome;
  try {
    const initialized = assertJsonRpcResult(await request(child, readMessage, 1, 'initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'jsonutils-snapshot-preflight', version: REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT.version },
    }, 30_000), 'snapshot MCP initialize');
    if (initialized.serverInfo?.name !== 'jsonutils-governance' || initialized.protocolVersion !== '2025-11-25') {
      throw new Error('snapshot MCP initialize 身份或协议漂移');
    }
    child.stdin.write(serializeMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }));
    const listed = assertJsonRpcResult(await request(child, readMessage, 2, 'tools/list', {}, 30_000), 'snapshot MCP tools/list');
    if (!listed.tools?.some(tool => tool.name === 'ai_governance_scorecard')) throw new Error('snapshot MCP 未列出 ai_governance_scorecard');
    const called = assertJsonRpcResult(await request(child, readMessage, 3, 'tools/call', {
      name: 'ai_governance_scorecard', arguments: { top: 35 },
    }, 120_000), 'snapshot MCP tools/call');
    if (called.isError === true || !Array.isArray(called.content) || called.content.length !== 1
      || called.content[0]?.type !== 'text') throw new Error('snapshot scorecard 返回错误或非闭合 text result');
    let scorecard;
    try { scorecard = JSON.parse(called.content[0].text); } catch { throw new Error('snapshot scorecard text 不是合法 JSON'); }
    if (!called.structuredContent
      || JSON.stringify(stableValue(called.structuredContent)) !== JSON.stringify(stableValue(scorecard))) {
      throw new Error('snapshot scorecard text 与 structuredContent 不一致');
    }
    if (scorecard.reportType !== 'jsonutils-governance-scorecard' || scorecard.ok !== true
      || scorecard.maturityScorecard?.reportType !== 'ai-governance-maturity-scorecard'
      || typeof scorecard.maturityScorecard?.nextFocus?.id !== 'string') {
      throw new Error('snapshot scorecard 未通过或结果契约漂移');
    }
    result = {
      protocolVersion: initialized.protocolVersion,
      terminationStrategy: process.platform === 'win32'
        ? 'parent-process-best-effort'
        : 'posix-process-group-best-effort',
      reportType: scorecard.reportType,
      maturityReportType: scorecard.maturityScorecard.reportType,
      nextFocusIdSha256: hashValue('jsonutils.registration-snapshot.next-focus/v1', scorecard.maturityScorecard.nextFocus.id),
      resultSha256: hashValue('jsonutils.registration-snapshot.scorecard-result/v1', scorecard),
    };
  } finally {
    child.stdin.end();
    await stopChild(child);
    runtimeHome = verifyRetainedRuntimeHome(home, expectedHomeIdentity);
  }
  return {
    ...result,
    stderr: Object.freeze({ byteCount: stderrByteCount, nonEmpty: stderrByteCount > 0 }),
    runtimeHome,
  };
};

export const preflightRegistrationCanarySnapshot = async ({ snapshotRoot, packetBundle, expectedSnapshotSha256 }) => {
  const root = fs.realpathSync(snapshotRoot);
  const before = verifyEvolutionSealedWorktreeSnapshot(root);
  if (before.snapshotSha256 !== expectedSnapshotSha256) throw new Error('snapshot preflight 与 host expected snapshot digest 不匹配');
  const packetFailures = collectRegistrationCanaryPacketFailures(packetBundle);
  if (packetFailures.length > 0) throw new Error(packetFailures.join('; '));
  const expectedBindings = readExpectedBindings(root, before.fixtureRevision, before.environmentSha256);
  if (JSON.stringify(stableValue(packetBundle.host.bindings)) !== JSON.stringify(stableValue(expectedBindings))) {
    throw new Error('snapshot preflight packet 与 fixture/environment/ledger bindings 不匹配');
  }
  const mcp = await callSnapshotScorecard(root);
  const after = verifyEvolutionSealedWorktreeSnapshot(root);
  if (before.snapshotSha256 !== after.snapshotSha256 || before.manifestFileSha256 !== after.manifestFileSha256) {
    throw new Error('snapshot preflight 期间 snapshot 发生变化');
  }
  return Object.freeze({
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-snapshot-preflight',
    dataClass: 'redacted',
    preflightVersion: REGISTRATION_CANARY_SNAPSHOT_PREFLIGHT.version,
    bindings: Object.freeze({
      snapshotSha256: before.snapshotSha256,
      manifestFileSha256: before.manifestFileSha256,
      fixtureRevision: before.fixtureRevision,
      environmentSha256: before.environmentSha256,
      packetBundleSha256: hashValue('jsonutils.registration-snapshot.packet-bundle/v1', packetBundle),
      ledgerBindingsSha256: hashValue('jsonutils.registration-snapshot.ledger-bindings/v1', packetBundle.host.bindings.ledgers),
    }),
    mcp: Object.freeze({
      server: 'jsonutils-governance',
      transport: 'snapshot-stdio',
      tool: 'ai_governance_scorecard',
      ...mcp,
    }),
    observations: Object.freeze({
      fileInventoryVerified: true,
      readOnlyModeObserved: true,
      revisionReproduced: true,
      packetBindingsVerified: true,
      scorecardObserved: true,
      snapshotBeforeAfterStable: true,
      ledgerEndpointsStableBeforeAfter: true,
      ledgerGitPrefixVerified: false,
    }),
    claims: Object.freeze({
      evidenceScope: 'component-only',
      modelInvocationRequested: false,
      modelInvocationAbsenceVerified: false,
      trialExecutionObserved: false,
      immutableMountVerified: false,
      externalHostVerified: false,
      environmentVerified: false,
      runtimeIsolationVerified: false,
      currentTaskRegistryVerified: false,
      outcomeEligible: false,
      ledgerWriteRequested: false,
      ledgerWriteAbsenceVerified: false,
      descendantCleanupVerified: false,
      temporaryHomeCleanupVerified: false,
    }),
  });
};
