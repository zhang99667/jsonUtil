import { createHash } from 'node:crypto';

import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';
import { hashEvolutionTraceValue } from './aiGovernanceEvolutionTrace.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';
import {
  collectRegistrationCanaryBlindGradeFailures,
  hashRegistrationCanaryBlindGrade,
} from './aiGovernanceRegistrationCanaryResult.mjs';
import {
  collectRegistrationCanaryBlindGradeSetFailures,
  unblindRegistrationCanaryGradeSet,
} from './aiGovernanceRegistrationCanaryReview.mjs';

const MAX_REQUEST_BYTES = 128 * 1024;
const EXPECTED_GRADES = 6;
const CHECKPOINT_VERSION = '1.0.0';
const CASE_ID = 'mcp-project-registration-discovery';
const EXPERIMENT_ID = 'mcp-project-registration-canary';
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const BLIND_ALIAS_PATTERN = /^canary-[0-9a-f]{32}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const REQUEST_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'checkpointVersion', 'phase',
  'caseRef', 'experimentRef', 'policyRef', 'fixtureRevision', 'environmentSha256',
  'rubricSha256', 'gradeSet', 'anchor', 'trust', 'claims', 'privacy',
];
const CASE_REF_FIELDS = ['id', 'caseVersion', 'subjectVersion', 'sha256'];
const EXPERIMENT_REF_FIELDS = ['id', 'manifestVersion'];
const POLICY_REF_FIELDS = ['id', 'version', 'sha256'];
const GRADE_SET_FIELDS = [
  'order', 'count', 'bytesSha256', 'commitmentSha256', 'aliasesSha256',
  'resultRefsSha256', 'gradeRefsSha256', 'refs',
];
const GRADE_REF_FIELDS = ['blindTrialAlias', 'resultSha256', 'gradeSha256'];
const ANCHOR = Object.freeze({
  status: 'external-anchor-required',
  policyAuthority: 'repository-external',
  receiptAttached: false,
});
const TRUST = Object.freeze({
  evidenceScope: 'component-only',
  trustedSigners: 0,
  identityVerified: false,
  timestampVerified: false,
  inclusionVerified: false,
  phaseOrderingVerified: false,
  nonReplaceabilityVerified: false,
});
const CLAIMS = Object.freeze({
  executable: false,
  modelInvoked: false,
  executionVerified: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
});
const PRIVACY = Object.freeze({
  sourceUserContentStored: false,
  reasoningStored: false,
  toolPayloadStored: false,
  authMaterialStored: false,
  userConfigStored: false,
  absoluteUserPathStored: false,
  responseBodyStored: false,
  traceBodyStored: false,
  hostDisclosureStored: false,
  armStored: false,
  rubricStored: false,
});
const FORBIDDEN_VALUE_PATTERN = /(?:^|[^a-z])(baseline|candidate|project-config-only|project-plugin-registration)(?:$|[^a-z])/i;

export const REGISTRATION_CANARY_GRADE_CHECKPOINT = Object.freeze({
  id: 'mcp-registration-canary-grade-checkpoint-request',
  version: CHECKPOINT_VERSION,
  caseId: CASE_ID,
});

const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};
const exactObjectFailures = (value, template, label) => {
  const failures = exactFields(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.entries(template).filter(([field, expected]) => value[field] !== expected)
    .map(([field, expected]) => `${label}.${field} 必须为 ${String(expected)}`);
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const hashPacket = hashRegistrationCanaryPacketValue;
const hashRefValues = (domain, refs, field) => hashPacket(domain, refs.map(item => item[field]));
const isSafeId = value => typeof value === 'string' && SAFE_ID_PATTERN.test(value);
const hasUniqueValues = values => new Set(values).size === values.length;
const containsForbiddenValue = value => typeof value === 'string'
  ? FORBIDDEN_VALUE_PATTERN.test(value)
  : Array.isArray(value) ? value.some(containsForbiddenValue)
    : isEvolutionRecord(value) ? Object.values(value).some(containsForbiddenValue) : false;
const gradeRefsFrom = blindGrades => blindGrades.map(grade => ({
  blindTrialAlias: grade.blindTrialAlias,
  resultSha256: grade.resultSha256,
  gradeSha256: hashRegistrationCanaryBlindGrade(grade),
})).sort((left, right) => left.blindTrialAlias.localeCompare(right.blindTrialAlias));

const collectBuildFailures = ({ gradeSet, blindGrades, caseItem, experimentRef, policyEntry, expectedFixtureRevision }) => {
  const failures = collectRegistrationCanaryBlindGradeSetFailures(gradeSet);
  if (!Array.isArray(blindGrades) || blindGrades.length !== EXPECTED_GRADES) {
    failures.push(`checkpoint request 必须精确绑定 ${EXPECTED_GRADES} 条 blind grade`);
  } else blindGrades.forEach((grade, index) => failures.push(
    ...collectRegistrationCanaryBlindGradeFailures(grade).map(failure => `blindGrades[${index}]: ${failure}`),
  ));
  const refs = Array.isArray(blindGrades) ? gradeRefsFrom(blindGrades) : [];
  if (refs.length === EXPECTED_GRADES && JSON.stringify(gradeSet?.grades) !== JSON.stringify(refs)) {
    failures.push('checkpoint request 的 grade set 与 blind grades 不匹配');
  }
  for (const [label, values] of [
    ['fixtureRevision', blindGrades?.map(grade => grade?.bindings?.fixtureRevision) ?? []],
    ['environmentSha256', blindGrades?.map(grade => grade?.bindings?.environmentSha256) ?? []],
    ['rubricSha256', blindGrades?.map(grade => grade?.rubricSha256) ?? []],
  ]) if (new Set(values).size !== 1) failures.push(`checkpoint request 的 ${label} 必须在六条 grade 中一致`);
  const fixtureRevision = blindGrades?.[0]?.bindings?.fixtureRevision;
  if (expectedFixtureRevision !== undefined && fixtureRevision !== expectedFixtureRevision) {
    failures.push('checkpoint request fixtureRevision 已过期');
  }
  if (!isEvolutionRecord(caseItem) || caseItem.id !== CASE_ID
    || !Number.isSafeInteger(caseItem.caseVersion) || !isSafeId(caseItem.subject?.version)) {
    failures.push('checkpoint request caseItem 非法');
  }
  const expectedRubricSha256 = hashPacket('jsonutils.registration-canary.rubric/v1', {
    expectedOutcome: caseItem?.expectedOutcome,
    graders: caseItem?.graders,
  });
  if (blindGrades?.[0]?.rubricSha256 !== expectedRubricSha256) {
    failures.push('checkpoint request rubric 未绑定当前 case');
  }
  failures.push(...exactFields(experimentRef, EXPERIMENT_REF_FIELDS, 'checkpoint experimentRef'));
  if (experimentRef?.id !== EXPERIMENT_ID || !isSafeId(experimentRef?.manifestVersion)) {
    failures.push('checkpoint experimentRef 非法');
  }
  failures.push(...exactFields(policyEntry?.descriptor, POLICY_REF_FIELDS, 'checkpoint policy descriptor'));
  if (policyEntry?.descriptor?.id !== CASE_ID || !isSafeId(policyEntry?.descriptor?.version)
    || !SHA256_PATTERN.test(policyEntry?.descriptor?.sha256 ?? '')) failures.push('checkpoint policy descriptor 非法');
  return { failures, refs, fixtureRevision };
};

const buildExpectedRequest = (input) => {
  const { failures, refs, fixtureRevision } = collectBuildFailures(input);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const { gradeSet, blindGrades, caseItem, experimentRef, policyEntry } = input;
  return {
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-grade-checkpoint-request',
    dataClass: 'redacted',
    checkpointVersion: CHECKPOINT_VERSION,
    phase: 'pre-unblind',
    caseRef: {
      id: caseItem.id,
      caseVersion: caseItem.caseVersion,
      subjectVersion: caseItem.subject.version,
      sha256: hashEvolutionTraceValue(caseItem),
    },
    experimentRef: structuredClone(experimentRef),
    policyRef: structuredClone(policyEntry.descriptor),
    fixtureRevision,
    environmentSha256: blindGrades[0].bindings.environmentSha256,
    rubricSha256: blindGrades[0].rubricSha256,
    gradeSet: {
      order: gradeSet.order,
      count: refs.length,
      bytesSha256: sha256(Buffer.from(JSON.stringify(gradeSet), 'utf8')),
      commitmentSha256: gradeSet.gradeSetSha256,
      aliasesSha256: hashRefValues('jsonutils.registration-canary.checkpoint-aliases/v1', refs, 'blindTrialAlias'),
      resultRefsSha256: hashRefValues('jsonutils.registration-canary.checkpoint-results/v1', refs, 'resultSha256'),
      gradeRefsSha256: hashRefValues('jsonutils.registration-canary.checkpoint-grades/v1', refs, 'gradeSha256'),
      refs,
    },
    anchor: { ...ANCHOR },
    trust: { ...TRUST },
    claims: { ...CLAIMS },
    privacy: { ...PRIVACY },
  };
};

export const collectRegistrationCanaryGradeCheckpointFailures = (request) => {
  const failures = exactFields(request, REQUEST_FIELDS, 'checkpoint request');
  if (!isEvolutionRecord(request)) return failures;
  if (request.schemaVersion !== 1
    || request.artifactType !== 'ai-registration-canary-grade-checkpoint-request'
    || request.dataClass !== 'redacted' || request.checkpointVersion !== CHECKPOINT_VERSION
    || request.phase !== 'pre-unblind') failures.push('checkpoint request 基础字段非法');
  failures.push(...exactFields(request.caseRef, CASE_REF_FIELDS, 'checkpoint request.caseRef'));
  if (request.caseRef?.id !== CASE_ID || !Number.isSafeInteger(request.caseRef?.caseVersion)
    || request.caseRef.caseVersion < 1 || !isSafeId(request.caseRef?.subjectVersion)
    || !SHA256_PATTERN.test(request.caseRef?.sha256 ?? '')) failures.push('checkpoint request.caseRef 非法');
  failures.push(...exactFields(request.experimentRef, EXPERIMENT_REF_FIELDS, 'checkpoint request.experimentRef'));
  if (request.experimentRef?.id !== EXPERIMENT_ID || !isSafeId(request.experimentRef?.manifestVersion)) failures.push('checkpoint request.experimentRef 非法');
  failures.push(...exactFields(request.policyRef, POLICY_REF_FIELDS, 'checkpoint request.policyRef'));
  if (request.policyRef?.id !== CASE_ID || !isSafeId(request.policyRef?.version)
    || !SHA256_PATTERN.test(request.policyRef?.sha256 ?? '')) failures.push('checkpoint request.policyRef 非法');
  if (!REVISION_PATTERN.test(request.fixtureRevision ?? '')
    || !SHA256_PATTERN.test(request.environmentSha256 ?? '')
    || !SHA256_PATTERN.test(request.rubricSha256 ?? '')) failures.push('checkpoint request fixture/environment/rubric 绑定非法');
  failures.push(...exactFields(request.gradeSet, GRADE_SET_FIELDS, 'checkpoint request.gradeSet'));
  const refs = request.gradeSet?.refs;
  if (request.gradeSet?.order !== 'blind-alias-lexicographic'
    || request.gradeSet?.count !== EXPECTED_GRADES
    || !Array.isArray(refs) || refs.length !== EXPECTED_GRADES) failures.push('checkpoint request.gradeSet 数量或顺序非法');
  else {
    refs.forEach((ref, index) => {
      failures.push(...exactFields(ref, GRADE_REF_FIELDS, `checkpoint request.gradeSet.refs[${index}]`));
      if (!BLIND_ALIAS_PATTERN.test(ref?.blindTrialAlias ?? '')
        || !SHA256_PATTERN.test(ref?.resultSha256 ?? '')
        || !SHA256_PATTERN.test(ref?.gradeSha256 ?? '')) failures.push(`checkpoint request.gradeSet.refs[${index}] 非法`);
    });
    const aliases = refs.map(ref => ref.blindTrialAlias);
    if (!hasUniqueValues(aliases) || !hasUniqueValues(refs.map(ref => ref.resultSha256))) failures.push('checkpoint request grade alias/result 必须唯一');
    if (JSON.stringify(aliases) !== JSON.stringify([...aliases].sort((left, right) => left.localeCompare(right)))) failures.push('checkpoint request grade refs 必须按 blind alias 排序');
    if (request.gradeSet.aliasesSha256 !== hashRefValues('jsonutils.registration-canary.checkpoint-aliases/v1', refs, 'blindTrialAlias')
      || request.gradeSet.resultRefsSha256 !== hashRefValues('jsonutils.registration-canary.checkpoint-results/v1', refs, 'resultSha256')
      || request.gradeSet.gradeRefsSha256 !== hashRefValues('jsonutils.registration-canary.checkpoint-grades/v1', refs, 'gradeSha256')) failures.push('checkpoint request grade refs digest 漂移');
  }
  for (const field of ['bytesSha256', 'commitmentSha256', 'aliasesSha256', 'resultRefsSha256', 'gradeRefsSha256']) {
    if (!SHA256_PATTERN.test(request.gradeSet?.[field] ?? '')) failures.push(`checkpoint request.gradeSet.${field} 非法`);
  }
  failures.push(...exactObjectFailures(request.anchor, ANCHOR, 'checkpoint request.anchor'));
  failures.push(...exactObjectFailures(request.trust, TRUST, 'checkpoint request.trust'));
  failures.push(...exactObjectFailures(request.claims, CLAIMS, 'checkpoint request.claims'));
  failures.push(...exactObjectFailures(request.privacy, PRIVACY, 'checkpoint request.privacy'));
  if (containsForbiddenValue(request)) failures.push('checkpoint request 禁止 arm/treatment 字符串值侧信道');
  failures.push(...collectEvolutionSensitiveFieldFailures(request, 'checkpoint request'));
  return failures;
};

export const buildRegistrationCanaryGradeCheckpointRequest = input => buildExpectedRequest(input);

export const parseRegistrationCanaryGradeCheckpointRequest = (requestJson) => {
  if (typeof requestJson !== 'string' || Buffer.byteLength(requestJson, 'utf8') > MAX_REQUEST_BYTES) {
    throw new TypeError('checkpoint request 必须是至多 128 KiB 的紧凑 JSON 字符串');
  }
  let request;
  try { request = JSON.parse(requestJson); } catch { throw new TypeError('checkpoint request 不是合法 JSON'); }
  if (JSON.stringify(request) !== requestJson) throw new TypeError('checkpoint request 必须是精确紧凑 JSON，且不能含重复键');
  const failures = collectRegistrationCanaryGradeCheckpointFailures(request);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return request;
};

export const verifyRegistrationCanaryGradeCheckpointRequest = ({ request, ...input }) => {
  const failures = collectRegistrationCanaryGradeCheckpointFailures(request);
  let expected;
  try { expected = buildExpectedRequest(input); } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
  if (expected && JSON.stringify(request) !== JSON.stringify(expected)) {
    failures.push('checkpoint request 与当前 grade set/case/policy/fixture/environment 不匹配');
  }
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return request;
};

export const bindRegistrationCanaryReviewToCheckpoint = (input) => {
  const inputFailures = exactFields(input, [
    'requestJson', 'packetBundles', 'blindGrades', 'gradeSet', 'hostRunRecords',
    'caseItem', 'experimentRef', 'policyEntry', 'expectedFixtureRevision',
  ], 'checkpoint bind input');
  if (inputFailures.length > 0) throw new TypeError(inputFailures.join('；'));
  const {
    requestJson, packetBundles, blindGrades, gradeSet, hostRunRecords,
    caseItem, experimentRef, policyEntry, expectedFixtureRevision,
  } = input;
  const request = parseRegistrationCanaryGradeCheckpointRequest(requestJson);
  verifyRegistrationCanaryGradeCheckpointRequest({
    request, gradeSet, blindGrades, caseItem, experimentRef, policyEntry, expectedFixtureRevision,
  });
  const review = unblindRegistrationCanaryGradeSet({
    packetBundles, blindGrades, gradeSet, hostRunRecords, expectedFixtureRevision,
  });
  const reviewRefs = review.trials.map(trial => ({
    blindTrialAlias: trial.blindTrialAlias,
    resultSha256: trial.resultSha256,
    gradeSha256: trial.gradeSha256,
  })).sort((left, right) => left.blindTrialAlias.localeCompare(right.blindTrialAlias));
  if (review.status !== 'review-only' || review.gradeSetSha256 !== request.gradeSet.commitmentSha256
    || review.experimentRef?.id !== request.experimentRef.id
    || review.experimentRef?.manifestVersion !== request.experimentRef.manifestVersion
    || JSON.stringify(reviewRefs) !== JSON.stringify(request.gradeSet.refs)) {
    throw new TypeError('checkpoint 与重建 review 的 grade set、experiment 或 trial refs 不匹配');
  }
  return {
    ...review,
    checkpoint: {
      requestSha256: sha256(Buffer.from(requestJson, 'utf8')),
      anchorStatus: request.anchor.status,
      trustedSigners: request.trust.trustedSigners,
      identityVerified: request.trust.identityVerified,
      timestampVerified: request.trust.timestampVerified,
      inclusionVerified: request.trust.inclusionVerified,
      phaseOrderingVerified: request.trust.phaseOrderingVerified,
      nonReplaceabilityVerified: request.trust.nonReplaceabilityVerified,
    },
    writebackCandidate: {
      status: 'blocked', reasonCode: 'external-checkpoint-required',
      schemaUpgradeRequired: true, automaticWrite: false,
    },
  };
};
