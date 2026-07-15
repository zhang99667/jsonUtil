import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { buildFeedbackCandidateFromProfile } from './prepare-ai-evolution-feedback.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const cases = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'), { maxDate: '2026-07-15' }).cases;
const inboxPath = path.join(rootDir, 'evals/ai-governance/feedback-inbox.jsonl');

test('feedback producer 只构造固定 profile candidate，保持不可评分声明', () => {
  const event = buildFeedbackCandidateFromProfile({ existingEvents: [], observedAt: '2026-07-11', cases });
  assert.equal(event.caseRef.id, 'mcp-project-registration-discovery');
  assert.equal(event.experimentId, 'mcp-project-registration-canary');
  assert.equal(event.claims.modelInvoked, false);
  assert.equal(event.claims.automaticLedgerWrites, false);
  assert.equal(event.claims.outcomeEligible, false);
  const skillEvent = buildFeedbackCandidateFromProfile({
    existingEvents: [event], observedAt: '2026-07-13', cases, profile: 'skill-behavior-channel-missing',
  });
  assert.equal(skillEvent.schemaVersion, 2);
  assert.equal(skillEvent.caseRef.id, 'skill-jsonutils-ai-infra-evolver-trigger');
  assert.equal(skillEvent.sequence, 2);
  assert.equal(skillEvent.previousHash, event.eventHash);

  const correction = buildFeedbackCandidateFromProfile({
    existingEvents: [event, skillEvent],
    observedAt: '2026-07-15',
    cases,
    profile: 'maintainer-correction',
    caseId: 'rule-project-ai-asset-ownership',
  });
  assert.equal(correction.schemaVersion, 3);
  assert.equal(correction.caseRef.id, 'rule-project-ai-asset-ownership');
  assert.equal(correction.experimentId, null);
  assert.equal(correction.evidence.code, 'project-maintainer-correction');
  assert.equal(correction.claims.outcomeEligible, false);
});

test('maintainer correction 只接受显式存在的 behavior case', () => {
  const base = { existingEvents: [], observedAt: '2026-07-15', cases, profile: 'maintainer-correction' };
  assert.throws(() => buildFeedbackCandidateFromProfile({ ...base, profile: '__proto__' }), /未知 feedback profile/);
  assert.throws(() => buildFeedbackCandidateFromProfile(base), /--case-id/);
  assert.throws(() => buildFeedbackCandidateFromProfile({ ...base, caseId: 'missing-case' }), /缺少 case/);
  assert.throws(() => buildFeedbackCandidateFromProfile({ ...base, caseId: 'validation-change-matrix' }), /behavior case/);
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
