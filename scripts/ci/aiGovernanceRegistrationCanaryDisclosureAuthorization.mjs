import {
  collectRegistrationCanaryAnchorStatementFailures,
  verifyRegistrationCanaryAnchorReceipt,
} from './aiGovernanceRegistrationCanaryAnchorReceipt.mjs';
import {
  REGISTRATION_CANARY_STATEMENT_TYPE,
  collectRegistrationCanaryExactFieldFailures,
  collectRegistrationCanaryProtocolStringFailures,
  hashRegistrationCanaryEd25519PublicKey,
  isRegistrationCanaryProtocolRecord,
  isRegistrationCanarySafeId,
  isRegistrationCanarySha256,
  parseRegistrationCanaryDsseEnvelope,
  verifyRegistrationCanaryDsseSignature,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { parseRegistrationCanaryGradeCheckpointRequest } from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import {
  hashRegistrationCanaryPacketValue,
} from './aiGovernanceRegistrationCanaryPacket.mjs';
import {
  REGISTRATION_CANARY_DISCLOSURE_PROTOCOL_VERSION,
  buildRegistrationCanaryDisclosureCommitment,
} from './aiGovernanceRegistrationCanaryDisclosureCommitment.mjs';
export {
  buildRegistrationCanaryDisclosureCommitment,
  collectRegistrationCanaryDisclosureCommitmentFailures,
} from './aiGovernanceRegistrationCanaryDisclosureCommitment.mjs';

export const REGISTRATION_CANARY_AUTHORIZATION_PREDICATE_TYPE = 'https://github.com/zhang99667/jsonUtil/attestations/registration-canary-disclosure-authorization/v1';
const PROTOCOL_VERSION = REGISTRATION_CANARY_DISCLOSURE_PROTOCOL_VERSION;
const PURPOSE = 'authorize-registration-canary-unblind';
const GRANT_ID_PATTERN = /^grant-[0-9a-f]{32}$/;
const SUBJECT_NAMES = [
  'ai-registration-canary-grade-checkpoint-request',
  'ai-registration-canary-anchor-receipt',
  'ai-registration-canary-disclosure-commitment',
];
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
