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
  parseRegistrationCanaryExactCompactJson,
  verifyRegistrationCanaryDsseSignature,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import {
  collectRegistrationCanaryAuthorizationStatementFailures,
  verifyRegistrationCanaryDisclosureAuthorization,
} from './aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';

export const REGISTRATION_CANARY_CONSUMPTION_PREDICATE_TYPE = 'https://github.com/zhang99667/jsonUtil/attestations/registration-canary-disclosure-consumption/v1';
const PROTOCOL_VERSION = '1.0.0';
const PURPOSE = 'consume-registration-canary-unblind-grant';
const REDEMPTION_FIELDS = [
  'schemaVersion', 'artifactType', 'dataClass', 'requestVersion', 'grantId',
  'checkpointRequestSha256', 'anchorReceiptSha256', 'disclosureCommitmentSha256',
  'authorizationReceiptSha256', 'nonceSha256',
];
const SUBJECT_NAMES = [
  'ai-registration-canary-grade-checkpoint-request',
  'ai-registration-canary-anchor-receipt',
  'ai-registration-canary-disclosure-commitment',
  'ai-registration-canary-disclosure-authorization',
  'ai-registration-canary-disclosure-redemption-request',
];
const STATEMENT_FIELDS = ['_type', 'subject', 'predicateType', 'predicate'];
const SUBJECT_FIELDS = ['name', 'digest'];
const DIGEST_FIELDS = ['sha256'];
const PREDICATE_FIELDS = [
  'protocolVersion', 'purpose', 'experimentRef', 'batchId', 'authority', 'role',
  'grantId', 'audience', 'action', 'senderConstraint', 'state', 'maxUses', 'anchorKeySha256',
  'authorizationStateKeySha256', 'consumptionStateKeySha256', 'consumptionBindingSha256', 'policy',
];
const EXPERIMENT_FIELDS = ['id', 'manifestVersion'];
const AUTHORITY_FIELDS = ['id', 'epoch'];
const SENDER_FIELDS = ['type', 'thumbprintSha256'];
const STATE_FIELDS = ['from', 'to', 'expectedVersion', 'resultVersion'];
const POLICY_FIELDS = ['id', 'version', 'sha256'];

export const REGISTRATION_CANARY_DISCLOSURE_CONSUMPTION = Object.freeze({
  id: 'mcp-registration-canary-disclosure-consumption',
  version: PROTOCOL_VERSION,
  caseId: 'mcp-project-registration-discovery',
});

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const receiptDigest = json => hashRegistrationCanaryExactBytes(Buffer.from(json, 'utf8'));
const consumptionStateKeyFor = ({ authorizationStateKeySha256 }) => (
  hashRegistrationCanaryPacketValue('jsonutils.registration-canary.consumption-state-key/v1', {
    protocolVersion: PROTOCOL_VERSION,
    purpose: PURPOSE,
    authorizationStateKeySha256,
  })
);
const consumptionBindingFor = ({ consumptionStateKeySha256, redemptionRequestSha256, policy }) => (
  hashRegistrationCanaryPacketValue('jsonutils.registration-canary.consumption-binding/v1', {
    consumptionStateKeySha256,
    redemptionRequestSha256,
    policy,
  })
);

export const collectRegistrationCanaryRedemptionRequestFailures = (request) => {
  const failures = collectRegistrationCanaryExactFieldFailures(request, REDEMPTION_FIELDS, 'redemption request');
  if (!isRegistrationCanaryProtocolRecord(request)) return failures;
  if (request.schemaVersion !== 1
    || request.artifactType !== 'ai-registration-canary-disclosure-redemption-request'
    || request.dataClass !== 'redacted' || request.requestVersion !== PROTOCOL_VERSION
    || !/^grant-[0-9a-f]{32}$/.test(request.grantId ?? '')) failures.push('redemption request 基础字段非法');
  for (const field of [
    'checkpointRequestSha256', 'anchorReceiptSha256', 'disclosureCommitmentSha256',
    'authorizationReceiptSha256', 'nonceSha256',
  ]) if (!isRegistrationCanarySha256(request[field])) failures.push(`redemption request.${field} 非法`);
  failures.push(...collectRegistrationCanaryProtocolStringFailures(request, 'redemption request'));
  return failures;
};

export const parseRegistrationCanaryRedemptionRequest = (requestJson) => {
  const request = parseRegistrationCanaryExactCompactJson(requestJson, {
    label: 'redemption request',
    maxBytes: 16 * 1024,
  });
  const failures = collectRegistrationCanaryRedemptionRequestFailures(request);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return request;
};

export const buildRegistrationCanaryRedemptionRequest = ({
  checkpointRequestJson,
  anchorReceiptJson,
  authorizationReceiptJson,
  packetBundles,
  blindGrades,
  hostRunRecordJsons,
  nonceSha256,
}) => {
  const authorization = verifyRegistrationCanaryDisclosureAuthorization({
    checkpointRequestJson,
    anchorReceiptJson,
    authorizationReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
  });
  const request = {
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-disclosure-redemption-request',
    dataClass: 'redacted',
    requestVersion: PROTOCOL_VERSION,
    grantId: authorization.authorizationRef.grantId,
    checkpointRequestSha256: authorization.anchorRef.checkpointRequestSha256,
    anchorReceiptSha256: authorization.anchorRef.anchorReceiptSha256,
    disclosureCommitmentSha256: authorization.disclosureCommitment.commitmentSha256,
    authorizationReceiptSha256: authorization.authorizationRef.authorizationReceiptSha256,
    nonceSha256,
  };
  const failures = collectRegistrationCanaryRedemptionRequestFailures(request);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return request;
};

const collectConsumptionSubjectFailures = (subjects) => {
  const failures = [];
  if (!Array.isArray(subjects) || subjects.length !== SUBJECT_NAMES.length) return ['consumption Statement.subject 数量非法'];
  subjects.forEach((subject, index) => {
    failures.push(...collectRegistrationCanaryExactFieldFailures(subject, SUBJECT_FIELDS, `consumption Statement.subject[${index}]`));
    failures.push(...collectRegistrationCanaryExactFieldFailures(subject?.digest, DIGEST_FIELDS, `consumption Statement.subject[${index}].digest`));
    if (subject?.name !== SUBJECT_NAMES[index] || !isRegistrationCanarySha256(subject?.digest?.sha256)) failures.push(`consumption Statement.subject[${index}] 非法`);
  });
  return failures;
};

export const collectRegistrationCanaryConsumptionStatementFailures = (statement) => {
  const failures = collectRegistrationCanaryExactFieldFailures(statement, STATEMENT_FIELDS, 'consumption Statement');
  if (!isRegistrationCanaryProtocolRecord(statement)) return failures;
  if (statement._type !== REGISTRATION_CANARY_STATEMENT_TYPE
    || statement.predicateType !== REGISTRATION_CANARY_CONSUMPTION_PREDICATE_TYPE) failures.push('consumption Statement 类型非法');
  failures.push(...collectConsumptionSubjectFailures(statement.subject));
  const predicate = statement.predicate;
  failures.push(...collectRegistrationCanaryExactFieldFailures(predicate, PREDICATE_FIELDS, 'consumption Statement.predicate'));
  if (!isRegistrationCanaryProtocolRecord(predicate)) {
    failures.push(...collectRegistrationCanaryProtocolStringFailures(statement, 'consumption Statement'));
    return failures;
  }
  for (const [field, fields] of [['experimentRef', EXPERIMENT_FIELDS], ['authority', AUTHORITY_FIELDS], ['senderConstraint', SENDER_FIELDS], ['state', STATE_FIELDS], ['policy', POLICY_FIELDS]]) {
    failures.push(...collectRegistrationCanaryExactFieldFailures(predicate?.[field], fields, `consumption Statement.predicate.${field}`));
  }
  if (predicate?.protocolVersion !== PROTOCOL_VERSION || predicate?.purpose !== PURPOSE
    || predicate?.role !== 'disclosure-consumer' || !/^grant-[0-9a-f]{32}$/.test(predicate?.grantId ?? '')
    || predicate?.audience !== 'jsonutils-registration-canary-unblinder'
    || predicate?.action !== 'registration-canary:unblind' || predicate?.maxUses !== 1) failures.push('consumption predicate protocol/purpose/role/grant/audience 非法');
  if (!isRegistrationCanarySafeId(predicate?.experimentRef?.id) || !isRegistrationCanarySafeId(predicate?.experimentRef?.manifestVersion)
    || !/^batch-[0-9a-f]{32}$/.test(predicate?.batchId ?? '')
    || !isRegistrationCanarySafeId(predicate?.authority?.id) || !isRegistrationCanarySafeId(predicate?.authority?.epoch)) failures.push('consumption predicate experiment/batch/authority 非法');
  if (predicate?.senderConstraint?.type !== 'ed25519-spki-sha256'
    || !isRegistrationCanarySha256(predicate?.senderConstraint?.thumbprintSha256)) failures.push('consumption sender constraint 非法');
  if (!sameJson(predicate?.state, { from: 'authorized', to: 'consumed', expectedVersion: 2, resultVersion: 3 })) failures.push('consumption state 必须为 authorized→consumed 2→3');
  for (const field of ['anchorKeySha256', 'authorizationStateKeySha256', 'consumptionStateKeySha256', 'consumptionBindingSha256']) {
    if (!isRegistrationCanarySha256(predicate?.[field])) failures.push(`consumption predicate.${field} 非法`);
  }
  if (!isRegistrationCanarySafeId(predicate?.policy?.id)
    || !isRegistrationCanarySafeId(predicate?.policy?.version)
    || !isRegistrationCanarySha256(predicate?.policy?.sha256)) failures.push('consumption policy 非法');
  const redemptionRequestSha256 = statement.subject?.[4]?.digest?.sha256;
  if (predicate?.consumptionStateKeySha256 !== consumptionStateKeyFor(predicate)
    || predicate?.consumptionBindingSha256 !== consumptionBindingFor({
      consumptionStateKeySha256: predicate?.consumptionStateKeySha256,
      redemptionRequestSha256,
      policy: predicate?.policy,
    })) failures.push('consumption state key 或 binding digest 漂移');
  failures.push(...collectRegistrationCanaryProtocolStringFailures(statement, 'consumption Statement'));
  return failures;
};

const assertRedemptionBinding = (request, authorization) => {
  const expected = {
    grantId: authorization.authorizationRef.grantId,
    checkpointRequestSha256: authorization.anchorRef.checkpointRequestSha256,
    anchorReceiptSha256: authorization.anchorRef.anchorReceiptSha256,
    disclosureCommitmentSha256: authorization.disclosureCommitment.commitmentSha256,
    authorizationReceiptSha256: authorization.authorizationRef.authorizationReceiptSha256,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (request[field] !== value) throw new TypeError(`redemption request.${field} 与 authorization chain 不匹配`);
  }
};

export const buildRegistrationCanaryConsumptionStatement = ({
  checkpointRequestJson,
  anchorReceiptJson,
  authorizationReceiptJson,
  packetBundles,
  blindGrades,
  hostRunRecordJsons,
  redemptionRequestJson,
  policy,
}) => {
  const authorization = verifyRegistrationCanaryDisclosureAuthorization({
    checkpointRequestJson,
    anchorReceiptJson,
    authorizationReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
  });
  const authorizationEnvelope = parseRegistrationCanaryDsseEnvelope(authorizationReceiptJson, 'disclosure authorization receipt');
  const authorizationFailures = collectRegistrationCanaryAuthorizationStatementFailures(authorizationEnvelope.statement);
  if (authorizationFailures.length > 0) throw new TypeError(authorizationFailures.join('；'));
  const authorizationPredicate = authorizationEnvelope.statement.predicate;
  const redemption = parseRegistrationCanaryRedemptionRequest(redemptionRequestJson);
  assertRedemptionBinding(redemption, authorization);
  const redemptionRequestSha256 = receiptDigest(redemptionRequestJson);
  const predicate = {
    protocolVersion: PROTOCOL_VERSION,
    purpose: PURPOSE,
    experimentRef: structuredClone(authorizationPredicate.experimentRef),
    batchId: authorization.anchorRef.batchId,
    authority: structuredClone(authorization.anchorRef.authority),
    role: 'disclosure-consumer',
    grantId: authorization.authorizationRef.grantId,
    audience: authorization.authorizationRef.audience,
    action: authorization.authorizationRef.action,
    senderConstraint: structuredClone(authorizationPredicate.senderConstraint),
    state: { from: 'authorized', to: 'consumed', expectedVersion: 2, resultVersion: 3 },
    maxUses: 1,
    anchorKeySha256: authorization.anchorRef.anchorKeySha256,
    authorizationStateKeySha256: authorization.authorizationRef.authorizationStateKeySha256,
    consumptionStateKeySha256: consumptionStateKeyFor({
      authorizationStateKeySha256: authorization.authorizationRef.authorizationStateKeySha256,
    }),
    consumptionBindingSha256: '',
    policy: structuredClone(policy),
  };
  predicate.consumptionBindingSha256 = consumptionBindingFor({
    consumptionStateKeySha256: predicate.consumptionStateKeySha256,
    redemptionRequestSha256,
    policy: predicate.policy,
  });
  const statement = {
    _type: REGISTRATION_CANARY_STATEMENT_TYPE,
    subject: [
      { name: SUBJECT_NAMES[0], digest: { sha256: authorization.anchorRef.checkpointRequestSha256 } },
      { name: SUBJECT_NAMES[1], digest: { sha256: authorization.anchorRef.anchorReceiptSha256 } },
      { name: SUBJECT_NAMES[2], digest: { sha256: authorization.disclosureCommitment.commitmentSha256 } },
      { name: SUBJECT_NAMES[3], digest: { sha256: authorization.authorizationRef.authorizationReceiptSha256 } },
      { name: SUBJECT_NAMES[4], digest: { sha256: redemptionRequestSha256 } },
    ],
    predicateType: REGISTRATION_CANARY_CONSUMPTION_PREDICATE_TYPE,
    predicate,
  };
  const failures = collectRegistrationCanaryConsumptionStatementFailures(statement);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return statement;
};

export const verifyRegistrationCanaryDisclosureConsumption = ({
  checkpointRequestJson,
  anchorReceiptJson,
  authorizationReceiptJson,
  consumptionReceiptJson,
  packetBundles,
  blindGrades,
  hostRunRecordJsons,
  redemptionRequestJson,
  anchorPublicKey,
  authorizationPublicKey,
  consumerPublicKey,
  anchorExpectedBindings,
}) => {
  const authorization = verifyRegistrationCanaryDisclosureAuthorization({
    checkpointRequestJson,
    anchorReceiptJson,
    authorizationReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    anchorPublicKey,
    authorizationPublicKey,
    anchorExpectedBindings,
  });
  const redemption = parseRegistrationCanaryRedemptionRequest(redemptionRequestJson);
  assertRedemptionBinding(redemption, authorization);
  const parsed = parseRegistrationCanaryDsseEnvelope(consumptionReceiptJson, 'disclosure consumption receipt');
  const failures = collectRegistrationCanaryConsumptionStatementFailures(parsed.statement);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const expected = buildRegistrationCanaryConsumptionStatement({
    checkpointRequestJson,
    anchorReceiptJson,
    authorizationReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    redemptionRequestJson,
    policy: parsed.statement.predicate.policy,
  });
  if (!sameJson(parsed.statement, expected)) throw new TypeError('consumption receipt 与 authorization/redemption chain 跨批或绑定不匹配');
  const roleKeyIds = [authorization.signatures.anchor.keyid, authorization.signatures.authorization.keyid, parsed.signerKeyId];
  if (new Set(roleKeyIds).size !== roleKeyIds.length) throw new TypeError('anchor、authorization 与 consumer 必须使用不同角色 keyid');
  const signature = verifyRegistrationCanaryDsseSignature(parsed, consumerPublicKey);
  const suppliedRoleKeys = [anchorPublicKey, authorizationPublicKey, consumerPublicKey].filter(Boolean);
  const roleFingerprints = suppliedRoleKeys.map(hashRegistrationCanaryEd25519PublicKey);
  if (new Set(roleFingerprints).size !== roleFingerprints.length) {
    throw new TypeError('anchor、authorization 与 consumer 必须使用不同 Ed25519 公钥');
  }
  if (consumerPublicKey && hashRegistrationCanaryEd25519PublicKey(consumerPublicKey)
    !== parsed.statement.predicate.senderConstraint.thumbprintSha256) {
    throw new TypeError('consumer 公钥未满足 authorization sender constraint');
  }
  const allSignaturesVerified = authorization.signatures.anchor.signatureVerified
    && authorization.signatures.authorization.signatureVerified && signature.signatureVerified;
  return {
    schemaVersion: 1,
    reportType: 'ai-registration-canary-disclosure-consumption-verification',
    protocolVersion: PROTOCOL_VERSION,
    verificationStatus: allSignaturesVerified ? 'signature-verified-unwitnessed' : 'valid-untrusted',
    stateStatus: allSignaturesVerified
      ? 'consumed-signature-bound-unwitnessed' : 'claimed-consumed-signature-unchecked',
    evidenceScope: 'component-only',
    anchorBindingStatus: authorization.anchorBindingStatus,
    anchorRef: authorization.anchorRef,
    authorizationRef: authorization.authorizationRef,
    consumptionRef: {
      consumptionStateKeySha256: parsed.statement.predicate.consumptionStateKeySha256,
      consumptionBindingSha256: parsed.statement.predicate.consumptionBindingSha256,
      consumptionReceiptSha256: parsed.proofSha256,
      consumptionTransportSha256: parsed.envelopeSha256,
      redemptionRequestSha256: parsed.statement.subject[4].digest.sha256,
      stateVersion: parsed.statement.predicate.state.resultVersion,
    },
    disclosureCommitment: authorization.disclosureCommitment,
    senderConstraint: {
      thumbprintSha256: parsed.statement.predicate.senderConstraint.thumbprintSha256,
      status: consumerPublicKey ? 'consumer-signature-bound' : 'unchecked',
    },
    signatures: {
      ...authorization.signatures,
      consumer: {
        keyid: parsed.signerKeyId,
        publicKeySha256: consumerPublicKey
          ? hashRegistrationCanaryEd25519PublicKey(consumerPublicKey) : null,
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
      status: 'blocked', reasonCode: 'external-state-and-witness-required', automaticWrite: false,
    },
  };
};

const singleObservedReceipt = (jsons, label, preferredSignerKeyId) => {
  if (!Array.isArray(jsons) || jsons.length < 1 || jsons.length > 16) throw new TypeError(`${label} observation set 必须包含 1 到 16 条记录`);
  const observed = jsons.map(json => ({
    json,
    ...parseRegistrationCanaryDsseEnvelope(json, label),
  }));
  if (new Set(observed.map(item => item.proofSha256)).size !== 1) {
    throw new TypeError(`检测到 ${label} 的本地可观察分叉、双授权或双消费`);
  }
  const candidates = preferredSignerKeyId === undefined
    ? observed : observed.filter(item => item.signerKeyId === preferredSignerKeyId);
  return [...(candidates.length > 0 ? candidates : observed)].sort((left, right) => (
    left.json < right.json ? -1 : left.json > right.json ? 1 : 0
  ))[0].json;
};

export const verifyRegistrationCanaryDisclosureTranscript = ({
  anchorReceiptJsons,
  authorizationReceiptJsons,
  consumptionReceiptJsons,
  ...input
}) => verifyRegistrationCanaryDisclosureConsumption({
  ...input,
  anchorReceiptJson: singleObservedReceipt(
    anchorReceiptJsons, 'anchor receipt', input.anchorExpectedBindings?.signerKeyId,
  ),
  authorizationReceiptJson: singleObservedReceipt(authorizationReceiptJsons, 'authorization receipt'),
  consumptionReceiptJson: singleObservedReceipt(consumptionReceiptJsons, 'consumption receipt'),
});
