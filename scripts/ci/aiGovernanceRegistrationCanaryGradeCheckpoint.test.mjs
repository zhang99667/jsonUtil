import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import {
  buildRegistrationCanaryGradeCheckpointRequest,
  collectRegistrationCanaryGradeCheckpointFailures,
  parseRegistrationCanaryGradeCheckpointRequest,
  verifyRegistrationCanaryGradeCheckpointRequest,
} from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import { sealRegistrationCanaryBlindGradeSet } from './aiGovernanceRegistrationCanaryReview.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/experiments.json'), 'utf8'));
const caseItem = corpus.cases.find(item => item.id === 'mcp-project-registration-discovery');
const experiment = manifest.experiments.find(item => item.id === 'mcp-project-registration-canary');
const policyEntry = buildEvolutionTracePolicyRegistry({ rootDir }).policiesByCaseId.get(caseItem.id);
const fixtureRevision = resolveEvolutionWorktreeRevision(rootDir);
const digest = value => createHash('sha256').update(String(value)).digest('hex');
const experimentRef = { id: experiment.id, manifestVersion: manifest.manifestVersion };
const rubricSha256 = hashRegistrationCanaryPacketValue('jsonutils.registration-canary.rubric/v1', {
  expectedOutcome: caseItem.expectedOutcome, graders: caseItem.graders,
});
const gradePrivacy = {
  sourceUserContentStored: false, reasoningStored: false, toolPayloadStored: false,
  authMaterialStored: false, userConfigStored: false, absoluteUserPathStored: false,
  responseBodyStored: false, traceBodyStored: false, armStored: false, rubricStored: false,
};
const buildGrade = (index, overrides = {}) => ({
  schemaVersion: 1,
  artifactType: 'ai-registration-canary-blind-grade',
  dataClass: 'redacted',
  gradeVersion: '1.0.0',
  blindTrialAlias: `canary-${digest(`alias-${index}`).slice(0, 32)}`,
  bindings: {
    agentPacketSha256: digest(`agent-${index}`),
    graderPacketSha256: digest(`grader-${index}`),
    fixtureRevision,
    environmentSha256: digest('environment'),
    observationSha256: digest(`observation-${index}`),
    traceSha256: digest(`trace-${index}`),
  },
  resultSha256: digest(`result-${index}`),
  rubricSha256,
  grade: { status: 'graded', verdict: 'pass', score: 100 },
  reasonCodes: ['registration-and-tool-discovered'],
  traceReview: { structureStatus: 'accepted', completenessStatus: 'complete', policyStatus: 'verified' },
  claims: {
    armKnown: false, callerVerdictAccepted: false, automaticLedgerWrites: false,
    outcomeEligible: false, trusted: false,
  },
  privacy: { ...gradePrivacy },
  ...overrides,
});
const grades = Array.from({ length: 6 }, (_, index) => buildGrade(index + 1));
const gradeSet = sealRegistrationCanaryBlindGradeSet(grades);
const buildInput = (overrides = {}) => ({
  gradeSet,
  blindGrades: grades,
  caseItem,
  experimentRef,
  policyEntry,
  expectedFixtureRevision: fixtureRevision,
  ...overrides,
});

test('checkpoint request 精确绑定 grade set、case/policy、fixture/environment 与 rubric', () => {
  const request = buildRegistrationCanaryGradeCheckpointRequest(buildInput());
  assert.deepEqual(collectRegistrationCanaryGradeCheckpointFailures(request), []);
  assert.equal(request.phase, 'pre-unblind');
  assert.equal(request.gradeSet.count, 6);
  assert.equal(request.gradeSet.commitmentSha256, gradeSet.gradeSetSha256);
  assert.deepEqual(request.gradeSet.refs, gradeSet.grades);
  assert.equal(request.caseRef.id, caseItem.id);
  assert.deepEqual(request.policyRef, policyEntry.descriptor);
  assert.equal(request.fixtureRevision, fixtureRevision);
  assert.equal(request.environmentSha256, grades[0].bindings.environmentSha256);
  assert.equal(request.rubricSha256, grades[0].rubricSha256);
  assert.deepEqual(request.anchor, {
    status: 'external-anchor-required', policyAuthority: 'repository-external', receiptAttached: false,
  });
  assert.equal(request.trust.trustedSigners, 0);
  assert.equal(request.trust.phaseOrderingVerified, false);
  assert.equal(request.trust.nonReplaceabilityVerified, false);
  assert.equal(request.claims.outcomeEligible, false);
  assert.deepEqual(parseRegistrationCanaryGradeCheckpointRequest(JSON.stringify(request)), request);
  assert.deepEqual(verifyRegistrationCanaryGradeCheckpointRequest({ request, ...buildInput() }), request);
});

test('checkpoint request 拒绝 partial、duplicate 与混合 fixture/environment/rubric', () => {
  assert.throws(() => buildRegistrationCanaryGradeCheckpointRequest(buildInput({
    blindGrades: grades.slice(0, 5),
  })), /精确绑定 6 条/);
  const duplicate = structuredClone(grades);
  duplicate[5] = structuredClone(duplicate[0]);
  assert.throws(() => buildRegistrationCanaryGradeCheckpointRequest(buildInput({
    blindGrades: duplicate,
  })), /必须唯一|不匹配/);
  for (const mutate of [
    changed => { changed[5].bindings.fixtureRevision = `worktree-${'a'.repeat(64)}`; },
    changed => { changed[5].bindings.environmentSha256 = digest('other-environment'); },
    changed => { changed[5].rubricSha256 = digest('other-rubric'); },
  ]) {
    const changed = structuredClone(grades);
    mutate(changed);
    const changedSet = sealRegistrationCanaryBlindGradeSet(changed);
    assert.throws(() => buildRegistrationCanaryGradeCheckpointRequest(buildInput({
      blindGrades: changed, gradeSet: changedSet, expectedFixtureRevision: undefined,
    })), /必须在六条 grade 中一致/);
  }
  const wrongRubric = structuredClone(grades);
  wrongRubric.forEach((grade) => { grade.rubricSha256 = digest('wrong-current-rubric'); });
  assert.throws(() => buildRegistrationCanaryGradeCheckpointRequest(buildInput({
    blindGrades: wrongRubric, gradeSet: sealRegistrationCanaryBlindGradeSet(wrongRubric),
  })), /rubric 未绑定当前 case/);
});

test('本地 reseal 只能生成新的 anchor request，不能自证揭盲前顺序', () => {
  const original = buildRegistrationCanaryGradeCheckpointRequest(buildInput());
  const changed = structuredClone(grades);
  changed[0].grade = { status: 'graded', verdict: 'fail', score: 0 };
  changed[0].reasonCodes = ['server-not-discovered'];
  const changedSet = sealRegistrationCanaryBlindGradeSet(changed);
  assert.throws(() => verifyRegistrationCanaryGradeCheckpointRequest({
    request: original,
    ...buildInput({ blindGrades: changed, gradeSet: changedSet }),
  }), /不匹配/);
  const resealed = buildRegistrationCanaryGradeCheckpointRequest(buildInput({
    blindGrades: changed, gradeSet: changedSet,
  }));
  assert.notEqual(resealed.gradeSet.commitmentSha256, original.gradeSet.commitmentSha256);
  assert.equal(resealed.anchor.status, 'external-anchor-required');
  assert.equal(resealed.trust.identityVerified, false);
  assert.equal(resealed.trust.timestampVerified, false);
  assert.equal(resealed.trust.inclusionVerified, false);
  assert.equal(resealed.trust.phaseOrderingVerified, false);
  assert.equal(resealed.trust.nonReplaceabilityVerified, false);
});

test('checkpoint request 对 caller verified、timestamp、host disclosure 与 digest 漂移 fail closed', () => {
  const request = buildRegistrationCanaryGradeCheckpointRequest(buildInput());
  for (const mutate of [
    changed => { changed.verified = true; },
    changed => { changed.timestamp = '2026-07-12T00:00:00Z'; },
    changed => { changed.hostPacket = { arm: 'candidate' }; },
    changed => { changed.gradeSet.refs[0].resultSha256 = digest('tampered'); },
    changed => { changed.anchor.receiptAttached = true; },
    changed => { changed.trust.trustedSigners = 1; },
  ]) {
    const changed = structuredClone(request);
    mutate(changed);
    assert.notDeepEqual(collectRegistrationCanaryGradeCheckpointFailures(changed), []);
  }
  assert.throws(
    () => parseRegistrationCanaryGradeCheckpointRequest(`${JSON.stringify(request, null, 2)}\n`),
    /精确紧凑 JSON/,
  );
});

test('checkpoint CLI 只输出 detached request 且不读取密钥或写 evidence ledger', () => {
  const tracked = ['experiments.json', 'feedback-inbox.jsonl', 'trial-receipts.jsonl', 'outcomes.jsonl']
    .map(name => path.join(rootDir, 'evals/ai-governance', name));
  const before = tracked.map(file => fs.readFileSync(file, 'utf8'));
  const result = spawnSync(process.execPath, [
    'scripts/ci/review-ai-registration-canary-results.mjs', '--stage', 'checkpoint',
  ], {
    cwd: rootDir,
    input: JSON.stringify({ schemaVersion: 1, blindGrades: grades, gradeSet }),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  const request = JSON.parse(result.stdout);
  assert.equal(request.anchor.status, 'external-anchor-required');
  assert.equal(request.trust.trustedSigners, 0);
  assert.deepEqual(tracked.map(file => fs.readFileSync(file, 'utf8')), before);
  const source = fs.readFileSync(path.join(rootDir, 'scripts/ci/review-ai-registration-canary-results.mjs'), 'utf8');
  assert.doesNotMatch(source, /generateKey|privateKey|trustedSigners|readFileSync\([^)]*(?:key|pem)|writeFile|appendFile|fetch\(/);
});
