#!/usr/bin/env node
// 只从当前仓库生成盲分 launch packet 投影；不启动 Agent，不读取用户配置，不写 evidence ledger。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import { hashEvolutionOutcomeV3Line } from './aiGovernanceEvolutionOutcomeChain.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import { buildRegistrationCanaryPacketBundle, REGISTRATION_CANARY_PACKET } from './aiGovernanceRegistrationCanaryPacket.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const PROJECTIONS = new Set(['agent', 'grader', 'host']);
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const FILES = Object.freeze({
  cases: 'evals/ai-governance/cases.json', experiments: 'evals/ai-governance/experiments.json',
  projectMcp: '.mcp.json', projectHooks: '.codex/hooks.json',
  outcomes: 'evals/ai-governance/outcomes.jsonl', receipts: 'evals/ai-governance/trial-receipts.jsonl',
  feedback: 'evals/ai-governance/feedback-inbox.jsonl',
});

const sha256 = value => createHash('sha256').update(value).digest('hex');
const isWithin = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === '' || !path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`);
};
const sameStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const readStableFile = (projectRoot, relativePath) => {
  const realRoot = fs.realpathSync(projectRoot);
  const absolutePath = path.join(realRoot, relativePath);
  const resolvedPath = fs.realpathSync(absolutePath);
  if (!isWithin(realRoot, resolvedPath) || resolvedPath !== absolutePath) throw new Error(`${relativePath}: 必须是仓库内普通非 symlink 文件`);
  const pathStat = fs.lstatSync(absolutePath, { bigint: true });
  if (pathStat.isSymbolicLink() || !pathStat.isFile() || pathStat.size > BigInt(MAX_FILE_BYTES)) throw new Error(`${relativePath}: 文件类型或大小非法`);
  const descriptor = fs.openSync(absolutePath, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || before.dev !== pathStat.dev || before.ino !== pathStat.ino) throw new Error(`${relativePath}: 打开期间被替换`);
    const bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor, { bigint: true });
    if (!sameStat(before, after)) throw new Error(`${relativePath}: 读取期间发生变化`);
    return { path: relativePath, bytes, sha256: sha256(bytes) };
  } finally {
    fs.closeSync(descriptor);
  }
};

const ledgerCheckpoint = (snapshot, kind) => {
  const lines = snapshot.bytes.toString('utf8').split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { path: snapshot.path, records: 0, headSequence: null, headSha256: null, fileSha256: snapshot.sha256 };
  let head;
  try { head = JSON.parse(lines.at(-1)); } catch { throw new Error(`${snapshot.path}: 尾行不是合法 JSON`); }
  const headSequence = kind === 'outcomes' ? head.chain?.sequence : kind === 'feedback' ? head.sequence : lines.length;
  const headSha256 = kind === 'outcomes' ? hashEvolutionOutcomeV3Line(lines.at(-1))
    : kind === 'feedback' ? head.eventHash : sha256(lines.at(-1));
  if (headSequence !== lines.length || !SHA256_PATTERN.test(headSha256 ?? '')) throw new Error(`${snapshot.path}: ledger head 非法`);
  return { path: snapshot.path, records: lines.length, headSequence, headSha256, fileSha256: snapshot.sha256 };
};

export const snapshotRegistrationCanaryBoundFiles = (projectRoot, caseItem, experiment) => {
  const snapshots = Object.fromEntries(Object.entries(FILES).map(([key, file]) => [key, readStableFile(projectRoot, file)]));
  return {
    artifacts: {
      caseDescriptor: { path: FILES.cases, sha256: sha256(JSON.stringify(caseItem)) },
      experimentDescriptor: { path: FILES.experiments, sha256: sha256(JSON.stringify(experiment)) },
      projectMcp: { path: FILES.projectMcp, sha256: snapshots.projectMcp.sha256 },
      projectHooks: { path: FILES.projectHooks, sha256: snapshots.projectHooks.sha256 },
    },
    ledgers: {
      outcomes: ledgerCheckpoint(snapshots.outcomes, 'outcomes'),
      receipts: ledgerCheckpoint(snapshots.receipts, 'receipts'),
      feedback: ledgerCheckpoint(snapshots.feedback, 'feedback'),
    },
  };
};

const parseArgs = (argv) => {
  const allowed = new Set(['--trial', '--projection', '--run-nonce', '--environment-sha256']);
  const values = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index], value = argv[index + 1];
    if (!allowed.has(key) || Object.hasOwn(values, key) || !value || value.startsWith('--')) throw new Error(`不支持、重复或缺值参数：${key ?? '<empty>'}`);
    values[key] = value;
  }
  if (Object.keys(values).length !== allowed.size || !PROJECTIONS.has(values['--projection'])) throw new Error('必须提供 trial/projection/run-nonce/environment-sha256');
  if (!SHA256_PATTERN.test(values['--run-nonce']) || !SHA256_PATTERN.test(values['--environment-sha256'])) throw new Error('run nonce 与 environment digest 必须是 64 位小写 SHA-256');
  return {
    trialId: values['--trial'], projection: values['--projection'],
    runNonce: values['--run-nonce'], environmentSha256: values['--environment-sha256'],
  };
};

export const prepareRegistrationCanaryProjection = ({ argv = process.argv.slice(2), projectRoot = rootDir } = {}) => {
  const args = parseArgs(argv);
  const revisionBefore = resolveEvolutionWorktreeRevision(projectRoot);
  const corpus = readEvolutionEvalCorpus(path.join(projectRoot, FILES.cases));
  if (corpus.failures.length > 0) throw new Error(corpus.failures.join('; '));
  const casesById = new Map(corpus.cases.map(item => [item.id, item]));
  const experiments = readEvolutionExperiments(path.join(projectRoot, FILES.experiments), { casesById });
  if (experiments.failures.length > 0) throw new Error(experiments.failures.join('; '));
  const caseItem = casesById.get(REGISTRATION_CANARY_PACKET.caseId);
  const experiment = experiments.experiments.find(item => item.id === REGISTRATION_CANARY_PACKET.experimentId);
  const first = snapshotRegistrationCanaryBoundFiles(projectRoot, caseItem, experiment);
  const revisionMiddle = resolveEvolutionWorktreeRevision(projectRoot);
  const second = snapshotRegistrationCanaryBoundFiles(projectRoot, caseItem, experiment);
  const revisionAfter = resolveEvolutionWorktreeRevision(projectRoot);
  if (revisionBefore !== revisionMiddle || revisionMiddle !== revisionAfter || JSON.stringify(first) !== JSON.stringify(second)) {
    throw new Error('packet preparation 期间 worktree 或 ledger 发生变化');
  }
  const bundle = buildRegistrationCanaryPacketBundle({
    corpusVersion: corpus.corpus.corpusVersion,
    manifestVersion: experiments.manifest.manifestVersion,
    caseItem, experiment, trialId: args.trialId, runNonce: args.runNonce,
    environmentSha256: args.environmentSha256,
    bindings: { fixtureRevision: revisionAfter, ...second },
  });
  return bundle[args.projection];
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try { process.stdout.write(`${JSON.stringify(prepareRegistrationCanaryProjection())}\n`); }
  catch (error) { console.error(`registration canary packet 生成失败：${error.message}`); process.exitCode = 1; }
}
