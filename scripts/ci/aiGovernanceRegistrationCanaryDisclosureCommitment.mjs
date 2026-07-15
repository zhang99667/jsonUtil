import {
  collectRegistrationCanaryExactFieldFailures,
  collectRegistrationCanaryProtocolStringFailures,
  hashRegistrationCanaryExactBytes,
  isRegistrationCanaryProtocolRecord,
  isRegistrationCanarySha256,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { parseRegistrationCanaryGradeCheckpointRequest } from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import {
  collectRegistrationCanaryPacketFailures,
  hashRegistrationCanaryPacketValue,
  REGISTRATION_CANARY_TRIAL_BINDINGS,
} from './aiGovernanceRegistrationCanaryPacket.mjs';
import {
  collectRegistrationCanaryHostRunRecordFailures,
  parseRegistrationCanaryHostRunRecord,
} from './aiGovernanceRegistrationCanaryReview.mjs';
import {
  collectRegistrationCanaryBlindGradeFailures,
  hashRegistrationCanaryBlindGrade,
} from './aiGovernanceRegistrationCanaryResult.mjs';

export const REGISTRATION_CANARY_DISCLOSURE_PROTOCOL_VERSION = '1.0.0';
const EXPECTED_ITEMS = 6;
const COMMITMENT_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'commitmentVersion',
  'checkpointRequestSha256', 'order', 'count', 'refs', 'commitmentSha256', 'privacy',
];
const COMMITMENT_REF_FIELDS = ['blindTrialAlias', 'hostPacketSha256', 'hostRunRecordSha256'];
const COMMITMENT_PRIVACY = Object.freeze({
  hostBodyStored: false,
  sourceUserContentStored: false,
  reasoningStored: false,
  toolPayloadStored: false,
  authMaterialStored: false,
  absoluteUserPathStored: false,
  armStored: false,
  trialStored: false,
  leaseStored: false,
});

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const commitmentBody = commitment => ({
  checkpointRequestSha256: commitment.checkpointRequestSha256,
  order: commitment.order,
  count: commitment.count,
  refs: commitment.refs,
});
const commitmentDigest = commitment => hashRegistrationCanaryPacketValue(
  'jsonutils.registration-canary.disclosure-commitment/v1', commitmentBody(commitment),
);
const hostRecordSha256 = json => hashRegistrationCanaryExactBytes(Buffer.from(json, 'utf8'));

export const collectRegistrationCanaryDisclosureCommitmentFailures = (commitment) => {
  const failures = collectRegistrationCanaryExactFieldFailures(commitment, COMMITMENT_FIELDS, 'disclosure commitment');
  if (!isRegistrationCanaryProtocolRecord(commitment)) return failures;
  if (commitment.schemaVersion !== 1
    || commitment.artifactType !== 'ai-registration-canary-disclosure-commitment'
    || commitment.dataClass !== 'redacted'
    || commitment.commitmentVersion !== REGISTRATION_CANARY_DISCLOSURE_PROTOCOL_VERSION
    || commitment.order !== 'blind-alias-lexicographic' || commitment.count !== EXPECTED_ITEMS) {
    failures.push('disclosure commitment 基础字段非法');
  }
  if (!isRegistrationCanarySha256(commitment.checkpointRequestSha256)) failures.push('disclosure commitment checkpoint digest 非法');
  if (!Array.isArray(commitment.refs) || commitment.refs.length !== EXPECTED_ITEMS) {
    failures.push(`disclosure commitment 必须精确包含 ${EXPECTED_ITEMS} 条 ref`);
  } else {
    commitment.refs.forEach((ref, index) => {
      failures.push(...collectRegistrationCanaryExactFieldFailures(ref, COMMITMENT_REF_FIELDS, `disclosure commitment.refs[${index}]`));
      if (!/^canary-[0-9a-f]{32}$/.test(ref?.blindTrialAlias ?? '')
        || !isRegistrationCanarySha256(ref?.hostPacketSha256)
        || !isRegistrationCanarySha256(ref?.hostRunRecordSha256)) failures.push(`disclosure commitment.refs[${index}] 非法`);
    });
    const aliases = commitment.refs.map(ref => ref.blindTrialAlias);
    if (new Set(aliases).size !== EXPECTED_ITEMS
      || !sameJson(aliases, [...aliases].sort((left, right) => left.localeCompare(right)))) failures.push('disclosure commitment alias 必须唯一且排序');
  }
  failures.push(...collectRegistrationCanaryExactFieldFailures(commitment.privacy, Object.keys(COMMITMENT_PRIVACY), 'disclosure commitment.privacy'));
  if (!sameJson(commitment.privacy, COMMITMENT_PRIVACY)) failures.push('disclosure commitment privacy 必须全部为 false');
  if (commitment.commitmentSha256 !== commitmentDigest(commitment)) failures.push('disclosure commitment digest 漂移');
  failures.push(...collectRegistrationCanaryProtocolStringFailures(commitment, 'disclosure commitment'));
  return failures;
};

export const buildRegistrationCanaryDisclosureCommitment = ({
  checkpointRequestJson,
  packetBundles,
  blindGrades,
  hostRunRecordJsons,
}) => {
  const checkpoint = parseRegistrationCanaryGradeCheckpointRequest(checkpointRequestJson);
  if (!Array.isArray(packetBundles) || packetBundles.length !== EXPECTED_ITEMS
    || !Array.isArray(blindGrades) || blindGrades.length !== EXPECTED_ITEMS
    || !Array.isArray(hostRunRecordJsons) || hostRunRecordJsons.length !== EXPECTED_ITEMS) {
    throw new TypeError(`disclosure commitment 必须精确提供 ${EXPECTED_ITEMS} 个 packet、blind grade 与 host run record`);
  }
  const failures = [];
  packetBundles.forEach((bundle, index) => failures.push(
    ...collectRegistrationCanaryPacketFailures(bundle).map(failure => `packetBundles[${index}]: ${failure}`),
  ));
  blindGrades.forEach((grade, index) => failures.push(
    ...collectRegistrationCanaryBlindGradeFailures(grade).map(failure => `blindGrades[${index}]: ${failure}`),
  ));
  const records = hostRunRecordJsons.map((json, index) => {
    try { return parseRegistrationCanaryHostRunRecord(json); } catch (error) {
      failures.push(`hostRunRecordJsons[${index}]: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  });
  records.forEach((record, index) => failures.push(
    ...collectRegistrationCanaryHostRunRecordFailures(record).map(failure => `hostRunRecords[${index}]: ${failure}`),
  ));
  const bundleByAlias = new Map(packetBundles.map(bundle => [bundle?.host?.blindTrialAlias, bundle]));
  const gradeByAlias = new Map(blindGrades.map(grade => [grade?.blindTrialAlias, grade]));
  const recordByAlias = new Map(records.map(record => [record?.blindTrialAlias, record]));
  const expectedAliases = checkpoint.gradeSet.refs.map(ref => ref.blindTrialAlias);
  const checkpointRefByAlias = new Map(checkpoint.gradeSet.refs.map(ref => [ref.blindTrialAlias, ref]));
  if (bundleByAlias.size !== EXPECTED_ITEMS || gradeByAlias.size !== EXPECTED_ITEMS
    || recordByAlias.size !== EXPECTED_ITEMS
    || !sameJson([...bundleByAlias.keys()].sort(), expectedAliases)
    || !sameJson([...gradeByAlias.keys()].sort(), expectedAliases)
    || !sameJson([...recordByAlias.keys()].sort(), expectedAliases)) failures.push('disclosure packet/run-record alias 必须与 checkpoint 精确一致');
  const hostBindingDigests = new Set();
  const trialIds = new Set();
  const executionOrdinals = new Set();
  const leaseKeys = new Set();
  const taskInstances = new Set();
  const refs = expectedAliases.map((blindTrialAlias) => {
    const bundle = bundleByAlias.get(blindTrialAlias);
    const host = bundle?.host;
    const grade = gradeByAlias.get(blindTrialAlias);
    const checkpointRef = checkpointRefByAlias.get(blindTrialAlias);
    const record = recordByAlias.get(blindTrialAlias);
    const recordIndex = records.indexOf(record);
    const hostPacketSha256 = host
      ? hashRegistrationCanaryPacketValue('jsonutils.registration-canary.host-packet/v1', host)
      : undefined;
    const hostBindingsSha256 = host
      ? hashRegistrationCanaryPacketValue('jsonutils.registration-canary.host-bindings/v1', host.bindings)
      : undefined;
    if (host && (host.bindings.fixtureRevision !== checkpoint.fixtureRevision
      || host.bindings.environmentSha256 !== checkpoint.environmentSha256
      || host.experimentRef.id !== checkpoint.experimentRef.id
      || host.experimentRef.manifestVersion !== checkpoint.experimentRef.manifestVersion)) {
      failures.push(`host packet ${blindTrialAlias} 与 checkpoint fixture/environment/experiment 不匹配`);
    }
    if (grade && host && (checkpointRef?.resultSha256 !== grade.resultSha256
      || checkpointRef?.gradeSha256 !== hashRegistrationCanaryBlindGrade(grade)
      || grade.bindings.agentPacketSha256 !== host.projectionDigests.agentSha256
      || grade.bindings.graderPacketSha256 !== host.projectionDigests.graderSha256
      || grade.bindings.fixtureRevision !== checkpoint.fixtureRevision
      || grade.bindings.fixtureRevision !== host.bindings.fixtureRevision
      || grade.bindings.environmentSha256 !== checkpoint.environmentSha256
      || grade.bindings.environmentSha256 !== host.bindings.environmentSha256
      || grade.rubricSha256 !== checkpoint.rubricSha256
      || grade.rubricSha256 !== bundle.grader.rubricSha256)) {
      failures.push(`blind grade ${blindTrialAlias} 未绑定 checkpoint ref 与对应 Agent/grader 投影`);
    }
    if (record && (record.hostPacketSha256 !== hostPacketSha256
      || record.hostBindingsSha256 !== hostBindingsSha256
      || record.leaseKeySha256 !== host?.lease?.keySha256
      || record.executionOrdinal !== host?.trial?.executionOrdinal)) failures.push(`host run record ${blindTrialAlias} 未绑定对应 host packet/bindings/lease/order`);
    if (host) {
      hostBindingDigests.add(hostBindingsSha256);
      trialIds.add(host.trial.id);
      executionOrdinals.add(host.trial.executionOrdinal);
      leaseKeys.add(host.lease.keySha256);
    }
    if (record) taskInstances.add(record.taskInstanceSha256);
    return {
      blindTrialAlias,
      hostPacketSha256,
      hostRunRecordSha256: recordIndex >= 0 ? hostRecordSha256(hostRunRecordJsons[recordIndex]) : undefined,
    };
  });
  if (!sameJson([...trialIds].sort(), Object.keys(REGISTRATION_CANARY_TRIAL_BINDINGS).sort())
    || !sameJson([...executionOrdinals].sort((left, right) => left - right), [1, 2, 3, 4, 5, 6])) failures.push('disclosure host trial/order 必须覆盖固定六条计划');
  if (hostBindingDigests.size !== 1 || leaseKeys.size !== EXPECTED_ITEMS || taskInstances.size !== EXPECTED_ITEMS) {
    failures.push('disclosure host bindings 必须一致，lease/task instance 必须逐 trial 唯一');
  }
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const commitment = {
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-disclosure-commitment',
    dataClass: 'redacted',
    commitmentVersion: REGISTRATION_CANARY_DISCLOSURE_PROTOCOL_VERSION,
    checkpointRequestSha256: hashRegistrationCanaryExactBytes(Buffer.from(checkpointRequestJson, 'utf8')),
    order: 'blind-alias-lexicographic',
    count: refs.length,
    refs,
    commitmentSha256: '',
    privacy: { ...COMMITMENT_PRIVACY },
  };
  commitment.commitmentSha256 = commitmentDigest(commitment);
  const commitmentFailures = collectRegistrationCanaryDisclosureCommitmentFailures(commitment);
  if (commitmentFailures.length > 0) throw new TypeError(commitmentFailures.join('；'));
  return commitment;
};
