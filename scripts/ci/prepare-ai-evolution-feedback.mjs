#!/usr/bin/env node
// 只生成脱敏 feedback event candidate；不修改 inbox、receipt、outcome 或长期规则。

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { collectEvolutionIsoDateFailures, readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildBehaviorEvidenceFeedbackCandidate, buildMaintainerCorrectionFeedbackCandidate, buildMcpRegistrationFeedbackCandidate, readEvolutionFeedbackInbox } from './aiGovernanceEvolutionFeedbackInbox.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PROFILES = {
  'mcp-server-unregistered': { caseId: 'mcp-project-registration-discovery', experimentId: 'mcp-project-registration-canary', build: buildMcpRegistrationFeedbackCandidate },
  'skill-behavior-channel-missing': { caseId: 'skill-jsonutils-ai-infra-evolver-trigger', experimentId: 'skill-evolver-fresh-context-paired', build: buildBehaviorEvidenceFeedbackCandidate },
  'maintainer-correction': { caseId: null, experimentId: null, build: buildMaintainerCorrectionFeedbackCandidate },
};
const getProfile = profile => (Object.hasOwn(PROFILES, profile) ? PROFILES[profile] : null);

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!['--profile', '--observed-at', '--case-id'].includes(token) || args[token]) throw new Error(`不支持或重复参数：${token}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${token} 缺少值`);
    args[token] = value;
    index += 1;
  }
  const descriptor = getProfile(args['--profile']);
  if (!descriptor) throw new Error(`--profile 只允许 ${Object.keys(PROFILES).join('、')}`);
  if (descriptor.caseId === null && !args['--case-id']) throw new Error('--case-id 在 maintainer-correction profile 中必填');
  if (descriptor.caseId !== null && args['--case-id']) throw new Error('--case-id 只适用于 maintainer-correction profile');
  if (collectEvolutionIsoDateFailures('--observed-at', args['--observed-at']).length > 0) throw new Error('--observed-at 必须是有效且不晚于今天的 YYYY-MM-DD');
  return { profile: args['--profile'], observedAt: args['--observed-at'], caseId: args['--case-id'] ?? null };
};

export const buildFeedbackCandidateFromProfile = ({ existingEvents, observedAt, cases, profile = 'mcp-server-unregistered', caseId = null }) => {
  const descriptor = getProfile(profile);
  if (!descriptor) throw new Error(`未知 feedback profile \`${profile}\``);
  if (descriptor.caseId === null && !caseId) throw new Error('--case-id 在 maintainer-correction profile 中必填');
  const targetCaseId = descriptor.caseId ?? caseId;
  const caseItem = cases.find(item => item.id === targetCaseId);
  if (!caseItem) throw new Error(`缺少 case \`${targetCaseId}\``);
  if (descriptor.caseId === null && caseItem.coverageClass !== 'behavior') {
    throw new Error('maintainer correction 只允许绑定 behavior case');
  }
  return descriptor.build({ existingEvents, observedAt, caseItem, experimentId: descriptor.experimentId });
};

export const prepareFeedbackCandidate = ({ argv = process.argv.slice(2) } = {}) => {
  const { observedAt, profile, caseId } = parseArgs(argv);
  const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'));
  if (corpus.failures.length > 0) throw new Error(corpus.failures.join('; '));
  const inbox = readEvolutionFeedbackInbox(path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl'), {
    casesById: new Map(corpus.cases.map(item => [item.id, item])),
    maxDate: observedAt,
  });
  if (inbox.failures.length > 0) throw new Error(inbox.failures.join('; '));
  return buildFeedbackCandidateFromProfile({ existingEvents: inbox.validEvents, observedAt, cases: corpus.cases, profile, caseId });
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    process.stdout.write(`${JSON.stringify(prepareFeedbackCandidate())}\n`);
  } catch (error) {
    console.error(`feedback candidate 生成失败：${error.message}`);
    process.exitCode = 1;
  }
}
