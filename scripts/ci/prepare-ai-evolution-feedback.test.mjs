import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildFeedbackCandidateFromProfile } from './prepare-ai-evolution-feedback.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const cases = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-13' }).cases;
const inboxPath = path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl');

test('feedback producer 只构造固定 profile candidate，保持不可评分声明', () => {
  const event = buildFeedbackCandidateFromProfile({ existingEvents: [], observedAt: '2026-07-11', cases });
  assert.equal(event.caseRef.id, 'mcp-project-registration-discovery');
  assert.equal(event.experimentId, 'mcp-project-registration-canary');
  assert.equal(event.claims.modelInvoked, false);
  assert.equal(event.claims.automaticLedgerWrites, false);
  assert.equal(event.claims.outcomeEligible, false);
});

test('feedback producer 拒绝未知参数且不修改 inbox', () => {
  const before = fs.readFileSync(inboxPath, 'utf8');
  assert.throws(() => execFileSync(process.execPath, ['scripts/ci/prepare-ai-evolution-feedback.mjs', '--profile', 'arbitrary', '--observed-at', '2026-07-11'], {
    cwd: rootDir, encoding: 'utf8', stdio: 'pipe',
  }), /status 1|Command failed/);
  assert.equal(fs.readFileSync(inboxPath, 'utf8'), before);
  const source = fs.readFileSync(path.join(rootDir, 'scripts/ci/prepare-ai-evolution-feedback.mjs'), 'utf8');
  assert.doesNotMatch(source, /writeFile|appendFile|outcomes\.jsonl|trial-receipts\.jsonl/);
});
