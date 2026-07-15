import {
  collectEvolutionSensitiveFieldFailures,
  isEvolutionRecord,
} from './aiGovernanceEvolutionEvalContract.mjs';
import {
  collectRegistrationCanaryPacketFailures,
  hashRegistrationCanaryPacketValue,
  REGISTRATION_CANARY_TRIAL_BINDINGS,
} from './aiGovernanceRegistrationCanaryPacket.mjs';
import {
  collectRegistrationCanaryBlindGradeFailures,
  hashRegistrationCanaryBlindGrade,
  REGISTRATION_CANARY_RESULT,
} from './aiGovernanceRegistrationCanaryResult.mjs';

const MAX_HOST_RECORD_BYTES = 64 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const BLIND_ALIAS_PATTERN = /^canary-[0-9a-f]{32}$/;
const REVIEW_VERSION = '1.0.0';
const EXPECTED_TRIALS = 6;
const RUN_RECORD_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'recordVersion', 'blindTrialAlias',
  'hostPacketSha256', 'hostBindingsSha256', 'leaseKeySha256', 'taskInstanceSha256',
  'executionOrdinal', 'leaseAcquireCount', 'executionCount', 'retryCount',
  'freshTaskObserved', 'armIsolationObserved', 'registryObserved', 'pluginStateObserved',
  'artifactBindingsStable', 'ledgerBindingsStable', 'claims', 'privacy',
];
const RUN_RECORD_CLAIMS = Object.freeze({
  executionReported: true,
  executionVerified: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
});
const GRADE_SET_CLAIMS = Object.freeze({
  armKnown: false,
  automaticLedgerWrites: false,
  outcomeEligible: false,
  trusted: false,
});
const REVIEW_CLAIMS = Object.freeze({
  automaticExperimentWrites: false,
  automaticFeedbackWrites: false,
  automaticReceiptWrites: false,
  automaticOutcomeWrites: false,
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
});
const GRADE_SET_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'gradeSetVersion', 'order', 'grades',
  'gradeSetSha256', 'claims', 'privacy',
];
const GRADE_REF_FIELDS = ['blindTrialAlias', 'resultSha256', 'gradeSha256'];
const INFRASTRUCTURE_CODES = new Set([
  'blind-grade-ungradable', 'lease-not-single-use', 'execution-count-invalid',
  'retry-detected', 'fresh-task-not-observed', 'arm-isolation-not-observed',
  'registry-not-observed', 'plugin-state-mismatch', 'execution-order-mismatch',
  'artifact-binding-drift', 'ledger-binding-drift', 'task-instance-reused',
]);

export const REGISTRATION_CANARY_REVIEW = Object.freeze({
  ...REGISTRATION_CANARY_RESULT,
  reviewVersion: REVIEW_VERSION,
});

const exactFields = (value, fields, label) => {
  if (!isEvolutionRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};
const exactBooleanObjectFailures = (value, template, label) => {
  const failures = exactFields(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.entries(template).filter(([field, expected]) => value[field] !== expected)
    .map(([field, expected]) => `${label}.${field} 必须为 ${expected}`);
};
const falseObjectFailures = (value, template, label) => {
  const failures = exactFields(value, Object.keys(template), label);
  if (failures.length > 0) return failures;
  return Object.keys(template).filter(field => value[field] !== false).map(field => `${label}.${field} 必须为 false`);
};
const hasUniqueValues = values => new Set(values).size === values.length;
const hashPacket = hashRegistrationCanaryPacketValue;
const gradeSetBody = grades => ({
  order: 'blind-alias-lexicographic',
  grades: grades.map(grade => ({
    blindTrialAlias: grade.blindTrialAlias,
    resultSha256: grade.resultSha256,
    gradeSha256: hashRegistrationCanaryBlindGrade(grade),
  })).sort((left, right) => left.blindTrialAlias.localeCompare(right.blindTrialAlias)),
});
const hashGradeSetBody = body => hashPacket('jsonutils.registration-canary.blind-grade-set/v1', body);

export const collectRegistrationCanaryHostRunRecordFailures = (record) => {
  const failures = exactFields(record, RUN_RECORD_FIELDS, 'host run record');
  if (!isEvolutionRecord(record)) return failures;
  if (record.schemaVersion !== 1 || record.artifactType !== 'ai-registration-canary-host-run-record'
    || record.dataClass !== 'redacted' || record.recordVersion !== REVIEW_VERSION
    || !BLIND_ALIAS_PATTERN.test(record.blindTrialAlias ?? '')) failures.push('host run record 基础字段非法');
  for (const field of ['hostPacketSha256', 'hostBindingsSha256', 'leaseKeySha256', 'taskInstanceSha256']) {
    if (!SHA256_PATTERN.test(record[field] ?? '')) failures.push(`host run record.${field} 非法`);
  }
  if (!Number.isSafeInteger(record.executionOrdinal) || record.executionOrdinal < 1 || record.executionOrdinal > EXPECTED_TRIALS) failures.push('host run record.executionOrdinal 非法');
  for (const field of ['leaseAcquireCount', 'executionCount', 'retryCount']) {
    if (!Number.isSafeInteger(record[field]) || record[field] < 0 || record[field] > 10) failures.push(`host run record.${field} 非法`);
  }
  for (const field of ['freshTaskObserved', 'armIsolationObserved', 'registryObserved', 'artifactBindingsStable', 'ledgerBindingsStable']) {
    if (typeof record[field] !== 'boolean') failures.push(`host run record.${field} 必须是布尔值`);
  }
  if (!['enabled', 'disabled'].includes(record.pluginStateObserved)) failures.push('host run record.pluginStateObserved 非法');
  failures.push(...exactBooleanObjectFailures(record.claims, RUN_RECORD_CLAIMS, 'host run record.claims'));
  failures.push(...falseObjectFailures(record.privacy, PRIVACY, 'host run record.privacy'));
  failures.push(...collectEvolutionSensitiveFieldFailures(record, 'host run record'));
  return failures;
};

export const parseRegistrationCanaryHostRunRecord = (recordJson) => {
  if (typeof recordJson !== 'string' || Buffer.byteLength(recordJson, 'utf8') > MAX_HOST_RECORD_BYTES) {
    throw new TypeError('host run record 必须是至多 64 KiB 的紧凑 JSON 字符串');
  }
  let record;
  try { record = JSON.parse(recordJson); } catch { throw new TypeError('host run record 不是合法 JSON'); }
  if (JSON.stringify(record) !== recordJson) throw new TypeError('host run record 必须是精确紧凑 JSON，且不能含重复键');
  const failures = collectRegistrationCanaryHostRunRecordFailures(record);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return record;
};

export const collectRegistrationCanaryBlindGradeSetFailures = (gradeSet) => {
  const failures = exactFields(gradeSet, GRADE_SET_FIELDS, 'blind grade set');
  if (!isEvolutionRecord(gradeSet)) return failures;
  if (gradeSet.schemaVersion !== 1 || gradeSet.artifactType !== 'ai-registration-canary-blind-grade-set'
    || gradeSet.dataClass !== 'redacted' || gradeSet.gradeSetVersion !== REVIEW_VERSION
    || gradeSet.order !== 'blind-alias-lexicographic') failures.push('blind grade set 基础字段非法');
  if (!Array.isArray(gradeSet.grades) || gradeSet.grades.length !== EXPECTED_TRIALS) failures.push(`blind grade set 必须包含 ${EXPECTED_TRIALS} 条 grade ref`);
  else {
    gradeSet.grades.forEach((item, index) => {
      failures.push(...exactFields(item, GRADE_REF_FIELDS, `blind grade set.grades[${index}]`));
      if (!BLIND_ALIAS_PATTERN.test(item?.blindTrialAlias ?? '')
        || !SHA256_PATTERN.test(item?.resultSha256 ?? '') || !SHA256_PATTERN.test(item?.gradeSha256 ?? '')) failures.push(`blind grade set.grades[${index}] 绑定非法`);
    });
    const aliases = gradeSet.grades.map(item => item.blindTrialAlias);
    if (!hasUniqueValues(aliases) || !hasUniqueValues(gradeSet.grades.map(item => item.resultSha256))) failures.push('blind grade set alias/result 必须唯一');
    if (JSON.stringify(aliases) !== JSON.stringify([...aliases].sort((left, right) => left.localeCompare(right)))) failures.push('blind grade set 必须按 blind alias 排序');
  }
  const body = { order: gradeSet.order, grades: gradeSet.grades };
  if (gradeSet.gradeSetSha256 !== hashGradeSetBody(body)) failures.push('blind grade set digest 漂移');
  failures.push(...exactBooleanObjectFailures(gradeSet.claims, GRADE_SET_CLAIMS, 'blind grade set.claims'));
  failures.push(...falseObjectFailures(gradeSet.privacy, PRIVACY, 'blind grade set.privacy'));
  failures.push(...collectEvolutionSensitiveFieldFailures(gradeSet, 'blind grade set'));
  return failures;
};

export const sealRegistrationCanaryBlindGradeSet = (blindGrades) => {
  if (!Array.isArray(blindGrades) || blindGrades.length !== EXPECTED_TRIALS) throw new TypeError(`必须先完成 ${EXPECTED_TRIALS} 条 blind grade`);
  const failures = blindGrades.flatMap((grade, index) => collectRegistrationCanaryBlindGradeFailures(grade)
    .map(failure => `blindGrades[${index}]: ${failure}`));
  const aliases = blindGrades.map(grade => grade.blindTrialAlias);
  if (!hasUniqueValues(aliases) || !hasUniqueValues(blindGrades.map(grade => grade.resultSha256))) failures.push('blind grade alias/result 必须唯一，禁止择优重试');
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const body = gradeSetBody(blindGrades);
  const gradeSet = {
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-blind-grade-set',
    dataClass: 'redacted',
    gradeSetVersion: REVIEW_VERSION,
    ...body,
    gradeSetSha256: hashGradeSetBody(body),
    claims: { ...GRADE_SET_CLAIMS },
    privacy: { ...PRIVACY },
  };
  const gradeSetFailures = collectRegistrationCanaryBlindGradeSetFailures(gradeSet);
  if (gradeSetFailures.length > 0) throw new TypeError(gradeSetFailures.join('；'));
  return gradeSet;
};

const unavailableMetric = reasonCode => ({ status: 'unavailable', reasonCode });
const round = value => Math.round(value * 1_000_000) / 1_000_000;
const armValues = (trials, arm) => trials.filter(trial => trial.arm === arm).map(trial => trial.score);
const mean = values => values.reduce((total, value) => total + value, 0) / values.length;
const populationStandardDeviation = (values) => {
  const average = mean(values);
  return Math.sqrt(values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length);
};
const buildMetricsPreview = (trials, infrastructureValid) => {
  if (!infrastructureValid) {
    return Object.fromEntries(['passAt1', 'passPower3', 'meanScore', 'standardDeviation', 'pairedDelta', 'timing', 'cost']
      .map(name => [name, unavailableMetric('infrastructure-invalid-trial')]));
  }
  const baseline = armValues(trials, 'baseline');
  const candidate = armValues(trials, 'candidate');
  const pairedDeltas = [1, 2, 3].map(pair => (
    trials.find(trial => trial.pair === pair && trial.arm === 'candidate').score
      - trials.find(trial => trial.pair === pair && trial.arm === 'baseline').score
  ));
  return {
    passAt1: {
      status: 'preview', formula: 'empirical-pass-rate',
      baseline: round(baseline.filter(score => score === 100).length / baseline.length),
      candidate: round(candidate.filter(score => score === 100).length / candidate.length),
    },
    passPower3: unavailableMetric('formula-not-versioned'),
    meanScore: {
      status: 'preview', formula: 'arithmetic-mean',
      baseline: round(mean(baseline)), candidate: round(mean(candidate)),
    },
    standardDeviation: {
      status: 'preview', formula: 'population-standard-deviation',
      baseline: round(populationStandardDeviation(baseline)),
      candidate: round(populationStandardDeviation(candidate)),
    },
    pairedDelta: {
      status: 'preview', formula: 'candidate-minus-baseline-mean',
      value: round(mean(pairedDeltas)),
    },
    timing: unavailableMetric('trusted-measurement-not-captured'),
    cost: unavailableMetric('trusted-measurement-not-captured'),
  };
};

const infrastructureCodesForTrial = (grade, record, host) => {
  const codes = [];
  if (grade.grade.status !== 'graded') codes.push('blind-grade-ungradable');
  if (record.leaseAcquireCount !== 1) codes.push('lease-not-single-use');
  if (record.executionCount !== 1) codes.push('execution-count-invalid');
  if (record.retryCount !== 0) codes.push('retry-detected');
  if (!record.freshTaskObserved) codes.push('fresh-task-not-observed');
  if (!record.armIsolationObserved) codes.push('arm-isolation-not-observed');
  if (!record.registryObserved) codes.push('registry-not-observed');
  const expectedPluginState = host.treatment.personalPluginExpectedEnabled ? 'enabled' : 'disabled';
  if (record.pluginStateObserved !== expectedPluginState) codes.push('plugin-state-mismatch');
  if (record.executionOrdinal !== host.trial.executionOrdinal) codes.push('execution-order-mismatch');
  if (!record.artifactBindingsStable) codes.push('artifact-binding-drift');
  if (!record.ledgerBindingsStable) codes.push('ledger-binding-drift');
  return codes;
};

export const unblindRegistrationCanaryGradeSet = ({
  packetBundles,
  blindGrades,
  gradeSet,
  hostRunRecords,
  expectedFixtureRevision,
}) => {
  if (![packetBundles, blindGrades, hostRunRecords].every(items => Array.isArray(items) && items.length === EXPECTED_TRIALS)) {
    throw new TypeError(`unblind 必须精确提供 ${EXPECTED_TRIALS} 个 packet、grade 与 host run record`);
  }
  const failures = collectRegistrationCanaryBlindGradeSetFailures(gradeSet);
  packetBundles.forEach((bundle, index) => failures.push(...collectRegistrationCanaryPacketFailures(bundle).map(failure => `packetBundles[${index}]: ${failure}`)));
  blindGrades.forEach((grade, index) => failures.push(...collectRegistrationCanaryBlindGradeFailures(grade).map(failure => `blindGrades[${index}]: ${failure}`)));
  hostRunRecords.forEach((record, index) => failures.push(...collectRegistrationCanaryHostRunRecordFailures(record).map(failure => `hostRunRecords[${index}]: ${failure}`)));
  const bundleByAlias = new Map(packetBundles.map(bundle => [bundle?.host?.blindTrialAlias, bundle]));
  const gradeByAlias = new Map(blindGrades.map(grade => [grade?.blindTrialAlias, grade]));
  const recordByAlias = new Map(hostRunRecords.map(record => [record?.blindTrialAlias, record]));
  if ([bundleByAlias, gradeByAlias, recordByAlias].some(map => map.size !== EXPECTED_TRIALS)) failures.push('packet/grade/run record blind alias 必须唯一');
  const aliasSets = [bundleByAlias, gradeByAlias, recordByAlias].map(map => [...map.keys()].sort());
  if (aliasSets.some(aliases => JSON.stringify(aliases) !== JSON.stringify(aliasSets[0]))) failures.push('packet/grade/run record alias 集合不一致');
  const expectedGradeSet = gradeSetBody(blindGrades);
  if (gradeSet?.gradeSetSha256 !== hashGradeSetBody(expectedGradeSet)
    || JSON.stringify(gradeSet?.grades) !== JSON.stringify(expectedGradeSet.grades)) failures.push('unblind 前 blind grade set 未封存或已改变');
  const fixtureRevisions = new Set();
  const environmentDigests = new Set();
  const hostBindingDigests = new Set();
  const experimentRefs = new Set();
  const trialIds = new Set();
  const trials = [];
  for (const alias of aliasSets[0] ?? []) {
    const bundle = bundleByAlias.get(alias);
    const host = bundle?.host;
    const grade = gradeByAlias.get(alias);
    const record = recordByAlias.get(alias);
    if (!host || !grade || !record) continue;
    const hostPacketSha256 = hashPacket('jsonutils.registration-canary.host-packet/v1', host);
    const hostBindingsSha256 = hashPacket('jsonutils.registration-canary.host-bindings/v1', host.bindings);
    const expectedBindings = {
      agentPacketSha256: host.projectionDigests.agentSha256,
      graderPacketSha256: host.projectionDigests.graderSha256,
      fixtureRevision: host.bindings.fixtureRevision,
      environmentSha256: host.bindings.environmentSha256,
    };
    for (const [field, expected] of Object.entries(expectedBindings)) {
      if (grade.bindings[field] !== expected) failures.push(`blind grade ${alias} 的 ${field} 与 host packet 不匹配`);
    }
    if (record.hostPacketSha256 !== hostPacketSha256 || record.hostBindingsSha256 !== hostBindingsSha256
      || record.leaseKeySha256 !== host.lease.keySha256) failures.push(`host run record ${alias} digest/lease 与 packet 不匹配`);
    if (expectedFixtureRevision !== undefined && host.bindings.fixtureRevision !== expectedFixtureRevision) failures.push(`host packet ${alias} fixtureRevision 已过期`);
    fixtureRevisions.add(host.bindings.fixtureRevision);
    environmentDigests.add(host.bindings.environmentSha256);
    hostBindingDigests.add(hostBindingsSha256);
    experimentRefs.add(JSON.stringify(host.experimentRef));
    trialIds.add(host.trial.id);
    const infrastructureCodes = infrastructureCodesForTrial(grade, record, host);
    trials.push({
      trialId: host.trial.id,
      pair: host.trial.pair,
      arm: host.trial.arm,
      executionOrdinal: host.trial.executionOrdinal,
      blindTrialAlias: alias,
      resultSha256: grade.resultSha256,
      gradeSha256: hashRegistrationCanaryBlindGrade(grade),
      gradeStatus: grade.grade.status,
      verdict: grade.grade.verdict,
      score: grade.grade.score,
      infrastructureStatus: infrastructureCodes.length === 0 ? 'valid-reported' : 'invalid-reported',
      infrastructureCodes,
    });
  }
  const expectedTrialIds = Object.keys(REGISTRATION_CANARY_TRIAL_BINDINGS).sort();
  if (trialIds.size !== EXPECTED_TRIALS || JSON.stringify([...trialIds].sort()) !== JSON.stringify(expectedTrialIds)) failures.push('host packet trial ID 必须覆盖固定六个 trial');
  const pairArms = new Set(trials.map(trial => `${trial.pair}:${trial.arm}`));
  if ([1, 2, 3].some(pair => !pairArms.has(`${pair}:baseline`) || !pairArms.has(`${pair}:candidate`))) failures.push('每个 pair 必须精确包含 baseline/candidate');
  if (fixtureRevisions.size !== 1 || environmentDigests.size !== 1 || hostBindingDigests.size !== 1 || experimentRefs.size !== 1) failures.push('六个 trial 的 fixture/environment/host binding/experiment 必须一致');
  if (!hasUniqueValues(packetBundles.map(bundle => bundle.host.lease.keySha256))
    || !hasUniqueValues(hostRunRecords.map(record => record.leaseKeySha256))) failures.push('六个 trial 的 external lease key 必须唯一');
  const taskInstances = hostRunRecords.map(record => record.taskInstanceSha256);
  if (!hasUniqueValues(taskInstances)) trials.forEach(trial => trial.infrastructureCodes.push('task-instance-reused'));
  if (hostRunRecords.map(record => record.executionOrdinal).sort((left, right) => left - right)
    .some((ordinal, index) => ordinal !== index + 1)) trials.forEach(trial => trial.infrastructureCodes.push('execution-order-mismatch'));
  trials.forEach((trial) => {
    trial.infrastructureCodes = [...new Set(trial.infrastructureCodes)];
    if (trial.infrastructureCodes.some(code => !INFRASTRUCTURE_CODES.has(code))) failures.push(`未知 infrastructure code: ${trial.trialId}`);
    trial.infrastructureStatus = trial.infrastructureCodes.length === 0 ? 'valid-reported' : 'invalid-reported';
  });
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  trials.sort((left, right) => left.executionOrdinal - right.executionOrdinal);
  const infrastructureValid = trials.every(trial => trial.infrastructureStatus === 'valid-reported');
  const experimentRef = packetBundles[0].host.experimentRef;
  return {
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-unblinded-review',
    dataClass: 'redacted',
    reviewVersion: REVIEW_VERSION,
    experimentRef: structuredClone(experimentRef),
    status: 'review-only',
    gradeSetSha256: gradeSet.gradeSetSha256,
    trust: {
      evidenceScope: 'component-only',
      captureOrigin: 'external-json-unverified',
      trustedSigners: 0,
      runtimeIsolationVerified: false,
      executionOrderReported: true,
      executionOrderVerified: false,
    },
    trials,
    metrics: buildMetricsPreview(trials, infrastructureValid),
    writebackCandidate: {
      status: 'blocked',
      reasonCode: 'external-results-unverified',
      schemaUpgradeRequired: true,
      automaticWrite: false,
    },
    claims: { ...REVIEW_CLAIMS },
    privacy: { ...PRIVACY },
  };
};

export const isRegistrationCanaryReviewRevision = value => REVISION_PATTERN.test(value ?? '');
