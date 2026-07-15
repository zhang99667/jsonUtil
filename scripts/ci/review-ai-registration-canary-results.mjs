#!/usr/bin/env node
// 只通过 stdin 执行盲评、封存、checkpoint 或揭盲预览；不启动模型，不读取用户配置，不写治理资产。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import { gradeRegistrationCanaryResultBlind, REGISTRATION_CANARY_RESULT } from './aiGovernanceRegistrationCanaryResult.mjs';
import {
  bindRegistrationCanaryReviewToCheckpoint,
  buildRegistrationCanaryGradeCheckpointRequest,
} from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import {
  parseRegistrationCanaryHostRunRecord,
  sealRegistrationCanaryBlindGradeSet,
} from './aiGovernanceRegistrationCanaryReview.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MAX_STDIN_BYTES = 4 * 1024 * 1024;
const STAGES = new Set(['blind', 'seal', 'checkpoint', 'unblind']);

const exactFields = (value, fields, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`${label} 必须是对象`);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new TypeError(`${label} 必须是闭字段对象`);
};

const parseArgs = (argv) => {
  if (argv.length !== 2 || argv[0] !== '--stage' || !STAGES.has(argv[1])) {
    throw new TypeError('必须且只能提供 --stage blind|seal|checkpoint|unblind');
  }
  return argv[1];
};

const readBoundedStdin = async (stream = process.stdin) => {
  stream.setEncoding('utf8');
  let body = '';
  for await (const chunk of stream) {
    body += chunk;
    if (Buffer.byteLength(body, 'utf8') > MAX_STDIN_BYTES) throw new TypeError('stdin 超过 4 MiB 上限');
  }
  if (body.trim().length === 0) throw new TypeError('stdin 不能为空');
  try { return JSON.parse(body); } catch { throw new TypeError('stdin 不是合法 JSON'); }
};

const loadBlindGradingContext = (projectRoot) => {
  const corpus = readEvolutionEvalCorpus(path.join(projectRoot, 'evals/ai-governance/cases.json'));
  if (corpus.failures.length > 0) throw new Error(corpus.failures.join('；'));
  const caseItem = corpus.cases.find(item => item.id === REGISTRATION_CANARY_RESULT.caseId);
  const policies = buildEvolutionTracePolicyRegistry({ rootDir: projectRoot });
  if (policies.failures.length > 0) throw new Error(policies.failures.join('；'));
  const policyEntry = policies.policiesByCaseId.get(REGISTRATION_CANARY_RESULT.caseId);
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, 'evals/ai-governance/experiments.json'), 'utf8'));
  const experiment = manifest.experiments?.find(item => item.id === 'mcp-project-registration-canary');
  if (!caseItem || !policyEntry || !experiment || manifest.manifestVersion !== '1.0.0') {
    throw new Error('缺少 registration canary 当前 case、experiment 或 trace policy');
  }
  return {
    caseItem,
    policyEntry,
    experimentRef: { id: experiment.id, manifestVersion: manifest.manifestVersion },
  };
};

export const reviewRegistrationCanaryInput = ({ stage, input, projectRoot = rootDir }) => {
  if (!STAGES.has(stage)) throw new TypeError('review stage 非法');
  if (stage === 'blind') {
    exactFields(input, ['schemaVersion', 'agentPacket', 'graderPacket', 'resultJson'], 'blind input');
    if (input.schemaVersion !== 1 || typeof input.resultJson !== 'string') throw new TypeError('blind input 基础字段非法');
    const { caseItem, policyEntry } = loadBlindGradingContext(projectRoot);
    return gradeRegistrationCanaryResultBlind({
      resultJson: input.resultJson,
      agentPacket: input.agentPacket,
      graderPacket: input.graderPacket,
      caseItem,
      policyEntry,
      expectedFixtureRevision: resolveEvolutionWorktreeRevision(projectRoot),
    });
  }
  if (stage === 'seal') {
    exactFields(input, ['schemaVersion', 'blindGrades'], 'seal input');
    if (input.schemaVersion !== 1) throw new TypeError('seal input.schemaVersion 必须为 1');
    return sealRegistrationCanaryBlindGradeSet(input.blindGrades);
  }
  if (stage === 'checkpoint') {
    exactFields(input, ['schemaVersion', 'blindGrades', 'gradeSet'], 'checkpoint input');
    if (input.schemaVersion !== 1) throw new TypeError('checkpoint input.schemaVersion 必须为 1');
    const context = loadBlindGradingContext(projectRoot);
    return buildRegistrationCanaryGradeCheckpointRequest({
      gradeSet: input.gradeSet,
      blindGrades: input.blindGrades,
      ...context,
      expectedFixtureRevision: resolveEvolutionWorktreeRevision(projectRoot),
    });
  }
  exactFields(input, ['schemaVersion', 'packetBundles', 'blindGrades', 'gradeSet', 'checkpointRequestJson', 'hostRunRecordJsons'], 'unblind input');
  if (input.schemaVersion !== 1 || !Array.isArray(input.hostRunRecordJsons)) throw new TypeError('unblind input 基础字段非法');
  const expectedFixtureRevision = resolveEvolutionWorktreeRevision(projectRoot);
  const context = loadBlindGradingContext(projectRoot);
  return bindRegistrationCanaryReviewToCheckpoint({
    requestJson: input.checkpointRequestJson,
    packetBundles: input.packetBundles,
    blindGrades: input.blindGrades,
    gradeSet: input.gradeSet,
    hostRunRecords: input.hostRunRecordJsons.map(parseRegistrationCanaryHostRunRecord),
    ...context,
    expectedFixtureRevision,
  });
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const stage = parseArgs(process.argv.slice(2));
    const input = await readBoundedStdin();
    process.stdout.write(`${JSON.stringify(reviewRegistrationCanaryInput({ stage, input }))}\n`);
  } catch (error) {
    console.error(`registration canary review 失败：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
