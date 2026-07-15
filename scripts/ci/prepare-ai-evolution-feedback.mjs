#!/usr/bin/env node
// 只生成脱敏 feedback event candidate；不修改 inbox、receipt、outcome 或长期规则。

import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { collectEvolutionIsoDateFailures, readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildMcpRegistrationFeedbackCandidate, readEvolutionFeedbackInbox } from './aiGovernanceEvolutionFeedbackInbox.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PROFILE = 'mcp-server-unregistered';
const CASE_ID = 'mcp-project-registration-discovery';
const EXPERIMENT_ID = 'mcp-project-registration-canary';

const parseArgs = (argv) => {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!['--profile', '--observed-at'].includes(token) || args[token]) throw new Error(`不支持或重复参数：${token}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${token} 缺少值`);
    args[token] = value;
    index += 1;
  }
  if (args['--profile'] !== PROFILE) throw new Error(`--profile 只允许 ${PROFILE}`);
  if (collectEvolutionIsoDateFailures('--observed-at', args['--observed-at']).length > 0) throw new Error('--observed-at 必须是有效且不晚于今天的 YYYY-MM-DD');
  return { profile: args['--profile'], observedAt: args['--observed-at'] };
};

export const buildFeedbackCandidateFromProfile = ({ existingEvents, observedAt, cases }) => {
  const caseItem = cases.find(item => item.id === CASE_ID);
  if (!caseItem) throw new Error(`缺少 case \`${CASE_ID}\``);
  return buildMcpRegistrationFeedbackCandidate({ existingEvents, observedAt, caseItem, experimentId: EXPERIMENT_ID });
};

export const prepareFeedbackCandidate = ({ argv = process.argv.slice(2) } = {}) => {
  const { observedAt } = parseArgs(argv);
  const corpus = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'));
  if (corpus.failures.length > 0) throw new Error(corpus.failures.join('; '));
  const inbox = readEvolutionFeedbackInbox(path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl'), {
    casesById: new Map(corpus.cases.map(item => [item.id, item])),
    maxDate: observedAt,
  });
  if (inbox.failures.length > 0) throw new Error(inbox.failures.join('; '));
  return buildFeedbackCandidateFromProfile({ existingEvents: inbox.validEvents, observedAt, cases: corpus.cases });
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
