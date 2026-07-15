import {
  collectRegistrationCanaryAnchorStatementFailures,
  verifyRegistrationCanaryAnchorReceipt,
} from './aiGovernanceRegistrationCanaryAnchorReceipt.mjs';
import {
  REGISTRATION_CANARY_STATEMENT_TYPE,
  collectRegistrationCanaryExactFieldFailures,
  collectRegistrationCanaryProtocolStringFailures,
  hashRegistrationCanaryExactBytes,
  hashRegistrationCanaryEd25519PublicKey,
  isRegistrationCanaryProtocolRecord,
  isRegistrationCanarySafeId,
  isRegistrationCanarySha256,
  parseRegistrationCanaryDsseEnvelope,
  verifyRegistrationCanaryDsseSignature,
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

export const REGISTRATION_CANARY_AUTHORIZATION_PREDICATE_TYPE = 'https://github.com/zhang99667/jsonUtil/attestations/registration-canary-disclosure-authorization/v1';
const PROTOCOL_VERSION = '1.0.0';
const PURPOSE = 'authorize-registration-canary-unblind';
const EXPECTED_ITEMS = 6;
const GRANT_ID_PATTERN = /^grant-[0-9a-f]{32}$/;
const SUBJECT_NAMES = [
  'ai-registration-canary-grade-checkpoint-request',
  'ai-registration-canary-anchor-receipt',
  'ai-registration-canary-disclosure-commitment',
];
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
const STATEMENT_FIELDS = ['_type', 'subject', 'predicateType', 'predicate'];
const SUBJECT_FIELDS = ['name', 'digest'];
const DIGEST_FIELDS = ['sha256'];
const PREDICATE_FIELDS = [
  'protocolVersion', 'purpose', 'experimentRef', 'batchId', 'authority', 'role',
  'grantId', 'audience', 'action', 'senderConstraint', 'state', 'maxUses',
  'anchorKeySha256', 'authorizationStateKeySha256', 'authorizationBindingSha256', 'policy',
];
const EXPERIMENT_FIELDS = ['id', 'manifestVersion'];
const AUTHORITY_FIELDS = ['id', 'epoch'];
const SENDER_FIELDS = ['type', 'thumbprintSha256'];
const STATE_FIELDS = ['from', 'to', 'expectedVersion', 'resultVersion'];
const POLICY_FIELDS = ['id', 'version', 'sha256'];

export const REGISTRATION_CANARY_DISCLOSURE_AUTHORIZATION = Object.freeze({
  id: 'mcp-registration-canary-disclosure-authorization',
  version: PROTOCOL_VERSION,
  caseId: 'mcp-project-registration-discovery',
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
const authorizationStateKeyFor = predicate => hashRegistrationCanaryPacketValue(
  'jsonutils.registration-canary.authorization-state-key/v1',
  {
    protocolVersion: PROTOCOL_VERSION,
    purpose: PURPOSE,
    anchorKeySha256: predicate.anchorKeySha256,
  },
);
const authorizationBindingFor = predicate => hashRegistrationCanaryPacketValue(
  'jsonutils.registration-canary.authorization-binding/v1',
  {
    authorizationStateKeySha256: predicate.authorizationStateKeySha256,
    grantId: predicate.grantId,
    disclosureCommitmentSha256: predicate.disclosureCommitmentSha256,
    senderConstraint: predicate.senderConstraint,
    policy: predicate.policy,
  },
);
const hostRecordSha256 = json => hashRegistrationCanaryExactBytes(Buffer.from(json, 'utf8'));

export const collectRegistrationCanaryDisclosureCommitmentFailures = (commitment) => {
  const failures = collectRegistrationCanaryExactFieldFailures(commitment, COMMITMENT_FIELDS, 'disclosure commitment');
  if (!isRegistrationCanaryProtocolRecord(commitment)) return failures;
  if (commitment.schemaVersion !== 1
    || commitment.artifactType !== 'ai-registration-canary-disclosure-commitment'
    || commitment.dataClass !== 'redacted' || commitment.commitmentVersion !== PROTOCOL_VERSION
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
    commitmentVersion: PROTOCOL_VERSION,
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

const collectAuthorizationSubjectFailures = (subjects) => {
  const failures = [];
  if (!Array.isArray(subjects) || subjects.length !== SUBJECT_NAMES.length) return ['authorization Statement.subject 数量非法'];
  subjects.forEach((subject, index) => {
    failures.push(...collectRegistrationCanaryExactFieldFailures(subject, SUBJECT_FIELDS, `authorization Statement.subject[${index}]`));
    failures.push(...collectRegistrationCanaryExactFieldFailures(subject?.digest, DIGEST_FIELDS, `authorization Statement.subject[${index}].digest`));
    if (subject?.name !== SUBJECT_NAMES[index] || !isRegistrationCanarySha256(subject?.digest?.sha256)) failures.push(`authorization Statement.subject[${index}] 非法`);
  });
  return failures;
};

export const collectRegistrationCanaryAuthorizationStatementFailures = (statement) => {
  const failures = collectRegistrationCanaryExactFieldFailures(statement, STATEMENT_FIELDS, 'authorization Statement');
  if (!isRegistrationCanaryProtocolRecord(statement)) return failures;
  if (statement._type !== REGISTRATION_CANARY_STATEMENT_TYPE
    || statement.predicateType !== REGISTRATION_CANARY_AUTHORIZATION_PREDICATE_TYPE) failures.push('authorization Statement 类型非法');
  failures.push(...collectAuthorizationSubjectFailures(statement.subject));
  const predicate = statement.predicate;
  failures.push(...collectRegistrationCanaryExactFieldFailures(predicate, PREDICATE_FIELDS, 'authorization Statement.predicate'));
  if (!isRegistrationCanaryProtocolRecord(predicate)) {
    failures.push(...collectRegistrationCanaryProtocolStringFailures(statement, 'authorization Statement'));
    return failures;
  }
  for (const [field, fields] of [['experimentRef', EXPERIMENT_FIELDS], ['authority', AUTHORITY_FIELDS], ['senderConstraint', SENDER_FIELDS], ['state', STATE_FIELDS], ['policy', POLICY_FIELDS]]) {
    failures.push(...collectRegistrationCanaryExactFieldFailures(predicate?.[field], fields, `authorization Statement.predicate.${field}`));
  }
  if (predicate?.protocolVersion !== PROTOCOL_VERSION || predicate?.purpose !== PURPOSE
    || predicate?.role !== 'unblind-authorizer' || !GRANT_ID_PATTERN.test(predicate?.grantId ?? '')
    || predicate?.audience !== 'jsonutils-registration-canary-unblinder'
    || predicate?.action !== 'registration-canary:unblind' || predicate?.maxUses !== 1) failures.push('authorization predicate protocol/purpose/role/grant/audience 非法');
  if (!isRegistrationCanarySafeId(predicate?.experimentRef?.id) || !isRegistrationCanarySafeId(predicate?.experimentRef?.manifestVersion)
    || !/^batch-[0-9a-f]{32}$/.test(predicate?.batchId ?? '')
    || !isRegistrationCanarySafeId(predicate?.authority?.id) || !isRegistrationCanarySafeId(predicate?.authority?.epoch)) failures.push('authorization predicate experiment/batch/authority 非法');
  if (predicate?.senderConstraint?.type !== 'ed25519-spki-sha256'
    || !isRegistrationCanarySha256(predicate?.senderConstraint?.thumbprintSha256)) failures.push('authorization sender constraint 非法');
  if (!sameJson(predicate?.state, { from: 'anchored', to: 'authorized', expectedVersion: 1, resultVersion: 2 })) failures.push('authorization state 必须为 anchored→authorized 1→2');
  if (!isRegistrationCanarySha256(predicate?.anchorKeySha256)
    || !isRegistrationCanarySha256(predicate?.authorizationStateKeySha256)
    || !isRegistrationCanarySha256(predicate?.authorizationBindingSha256)
    || !isRegistrationCanarySafeId(predicate?.policy?.id)
    || !isRegistrationCanarySafeId(predicate?.policy?.version)
    || !isRegistrationCanarySha256(predicate?.policy?.sha256)) failures.push('authorization key/policy 非法');
  const disclosureCommitmentSha256 = statement.subject?.[2]?.digest?.sha256;
  if (predicate?.authorizationStateKeySha256 !== authorizationStateKeyFor(predicate)
    || predicate?.authorizationBindingSha256 !== authorizationBindingFor({ ...predicate, disclosureCommitmentSha256 })) failures.push('authorization state key 或 binding digest 漂移');
  failures.push(...collectRegistrationCanaryProtocolStringFailures(statement, 'authorization Statement'));
  return failures;
};

export const buildRegistrationCanaryAuthorizationStatement = ({
  checkpointRequestJson,
  anchorReceiptJson,
  packetBundles,
  blindGrades,
  hostRunRecordJsons,
  grantId,
  senderConstraint,
  policy,
}) => {
  const checkpoint = parseRegistrationCanaryGradeCheckpointRequest(checkpointRequestJson);
  const anchor = verifyRegistrationCanaryAnchorReceipt({ checkpointRequestJson, anchorReceiptJson });
  const commitment = buildRegistrationCanaryDisclosureCommitment({
    checkpointRequestJson, packetBundles, blindGrades, hostRunRecordJsons,
  });
  const predicate = {
    protocolVersion: PROTOCOL_VERSION,
    purpose: PURPOSE,
    experimentRef: structuredClone(checkpoint.experimentRef),
    batchId: anchor.anchorRef.batchId,
    authority: structuredClone(anchor.anchorRef.authority),
    role: 'unblind-authorizer',
    grantId,
    audience: 'jsonutils-registration-canary-unblinder',
    action: 'registration-canary:unblind',
    senderConstraint: structuredClone(senderConstraint),
    state: { from: 'anchored', to: 'authorized', expectedVersion: 1, resultVersion: 2 },
    maxUses: 1,
    anchorKeySha256: anchor.anchorRef.anchorKeySha256,
    authorizationStateKeySha256: '',
    authorizationBindingSha256: '',
    policy: structuredClone(policy),
  };
  predicate.authorizationStateKeySha256 = authorizationStateKeyFor(predicate);
  predicate.authorizationBindingSha256 = authorizationBindingFor({
    ...predicate,
    disclosureCommitmentSha256: commitment.commitmentSha256,
  });
  const statement = {
    _type: REGISTRATION_CANARY_STATEMENT_TYPE,
    subject: [
      { name: SUBJECT_NAMES[0], digest: { sha256: anchor.anchorRef.checkpointRequestSha256 } },
      { name: SUBJECT_NAMES[1], digest: { sha256: anchor.anchorRef.anchorReceiptSha256 } },
      { name: SUBJECT_NAMES[2], digest: { sha256: commitment.commitmentSha256 } },
    ],
    predicateType: REGISTRATION_CANARY_AUTHORIZATION_PREDICATE_TYPE,
    predicate,
  };
  const failures = collectRegistrationCanaryAuthorizationStatementFailures(statement);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return statement;
};

export const verifyRegistrationCanaryDisclosureAuthorization = ({
  checkpointRequestJson,
  anchorReceiptJson,
  authorizationReceiptJson,
  packetBundles,
  blindGrades,
  hostRunRecordJsons,
  anchorPublicKey,
  authorizationPublicKey,
  anchorExpectedBindings,
}) => {
  const anchor = verifyRegistrationCanaryAnchorReceipt({
    checkpointRequestJson,
    anchorReceiptJson,
    publicKey: anchorPublicKey,
    expectedBindings: anchorExpectedBindings,
  });
  const commitment = buildRegistrationCanaryDisclosureCommitment({
    checkpointRequestJson, packetBundles, blindGrades, hostRunRecordJsons,
  });
  const parsed = parseRegistrationCanaryDsseEnvelope(authorizationReceiptJson, 'disclosure authorization receipt');
  const failures = collectRegistrationCanaryAuthorizationStatementFailures(parsed.statement);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const predicate = parsed.statement.predicate;
  const expected = buildRegistrationCanaryAuthorizationStatement({
    checkpointRequestJson,
    anchorReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    grantId: predicate.grantId,
    senderConstraint: predicate.senderConstraint,
    policy: predicate.policy,
  });
  if (!sameJson(parsed.statement, expected)) throw new TypeError('disclosure authorization 与 anchor/checkpoint/host commitment 跨批或绑定不匹配');
  if (parsed.signerKeyId === anchor.signature.keyid) throw new TypeError('anchor 与 disclosure authorization 必须使用不同角色 keyid');
  const signature = verifyRegistrationCanaryDsseSignature(parsed, authorizationPublicKey);
  if (anchorPublicKey && authorizationPublicKey
    && hashRegistrationCanaryEd25519PublicKey(anchorPublicKey) === hashRegistrationCanaryEd25519PublicKey(authorizationPublicKey)) {
    throw new TypeError('anchor 与 disclosure authorization 必须使用不同 Ed25519 公钥');
  }
  const allSignaturesVerified = anchor.signature.signatureVerified && signature.signatureVerified;
  return {
    schemaVersion: 1,
    reportType: 'ai-registration-canary-disclosure-authorization-verification',
    protocolVersion: PROTOCOL_VERSION,
    verificationStatus: allSignaturesVerified ? 'signature-verified-unwitnessed' : 'valid-untrusted',
    stateStatus: allSignaturesVerified
      ? 'authorized-signature-bound-not-consumed' : 'claimed-authorized-signature-unchecked',
    evidenceScope: 'component-only',
    anchorBindingStatus: anchor.bindingStatus,
    anchorRef: anchor.anchorRef,
    authorizationRef: {
      grantId: predicate.grantId,
      authorizationStateKeySha256: predicate.authorizationStateKeySha256,
      authorizationBindingSha256: predicate.authorizationBindingSha256,
      authorizationReceiptSha256: parsed.proofSha256,
      authorizationTransportSha256: parsed.envelopeSha256,
      stateVersion: predicate.state.resultVersion,
      audience: predicate.audience,
      action: predicate.action,
    },
    disclosureCommitment: commitment,
    signatures: {
      anchor: anchor.signature,
      authorization: {
        keyid: parsed.signerKeyId,
        publicKeySha256: authorizationPublicKey
          ? hashRegistrationCanaryEd25519PublicKey(authorizationPublicKey) : null,
        signatureVerified: signature.signatureVerified,
      },
    },
    trust: {
      trustedSigners: 0,
      identityVerified: false,
      timestampVerified: false,
      inclusionVerified: false,
      nonEquivocationVerified: false,
      externalStateVerified: false,
      atMostOnceVerified: false,
      hostCommitmentPreexistingVerified: false,
    },
    writebackCandidate: {
      status: 'blocked', reasonCode: 'external-consumption-witness-required', automaticWrite: false,
    },
  };
};
