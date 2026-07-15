import { parseRegistrationCanaryGradeCheckpointRequest } from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import { hashRegistrationCanaryPacketValue } from './aiGovernanceRegistrationCanaryPacket.mjs';
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

export const REGISTRATION_CANARY_ANCHOR_PREDICATE_TYPE = 'https://github.com/zhang99667/jsonUtil/attestations/registration-canary-anchor/v1';
const PROTOCOL_VERSION = '1.0.0';
const PURPOSE = 'pre-unblind-grade-checkpoint';
const SUBJECT_NAME = 'ai-registration-canary-grade-checkpoint-request';
const BATCH_ID_PATTERN = /^batch-[0-9a-f]{32}$/;
const STATEMENT_FIELDS = ['_type', 'subject', 'predicateType', 'predicate'];
const SUBJECT_FIELDS = ['name', 'digest'];
const DIGEST_FIELDS = ['sha256'];
const PREDICATE_FIELDS = [
  'protocolVersion', 'purpose', 'experimentRef', 'batchId', 'checkpoint', 'authority',
  'role', 'state', 'anchorKeySha256', 'controller',
];
const EXPERIMENT_FIELDS = ['id', 'manifestVersion'];
const CHECKPOINT_FIELDS = ['mediaType', 'byteLength', 'sha256', 'checkpointVersion'];
const AUTHORITY_FIELDS = ['id', 'epoch'];
const STATE_FIELDS = ['from', 'to', 'expectedVersion', 'resultVersion'];
const CONTROLLER_FIELDS = ['bundleSha256', 'policy'];
const POLICY_FIELDS = ['id', 'version', 'sha256'];
const EXPECTED_BINDING_FIELDS = ['batchId', 'authority', 'controller', 'signerKeyId', 'signerPublicKeySha256'];

export const REGISTRATION_CANARY_ANCHOR_RECEIPT = Object.freeze({
  id: 'mcp-registration-canary-anchor-receipt',
  version: PROTOCOL_VERSION,
  caseId: 'mcp-project-registration-discovery',
});

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const anchorKeyFor = ({ experimentRef, batchId }) => hashRegistrationCanaryPacketValue(
  'jsonutils.registration-canary.anchor-key/v1',
  { protocolVersion: PROTOCOL_VERSION, experimentRef, batchId, purpose: PURPOSE },
);

export const collectRegistrationCanaryAnchorStatementFailures = (statement) => {
  const failures = collectRegistrationCanaryExactFieldFailures(statement, STATEMENT_FIELDS, 'anchor Statement');
  if (!isRegistrationCanaryProtocolRecord(statement)) return failures;
  if (statement._type !== REGISTRATION_CANARY_STATEMENT_TYPE) failures.push('anchor Statement._type 非法');
  if (statement.predicateType !== REGISTRATION_CANARY_ANCHOR_PREDICATE_TYPE) failures.push('anchor Statement.predicateType 非法');
  if (!Array.isArray(statement.subject) || statement.subject.length !== 1) {
    failures.push('anchor Statement.subject 必须精确包含 checkpoint 一项');
  } else {
    const [subject] = statement.subject;
    failures.push(...collectRegistrationCanaryExactFieldFailures(subject, SUBJECT_FIELDS, 'anchor Statement.subject[0]'));
    failures.push(...collectRegistrationCanaryExactFieldFailures(subject?.digest, DIGEST_FIELDS, 'anchor Statement.subject[0].digest'));
    if (subject?.name !== SUBJECT_NAME || !isRegistrationCanarySha256(subject?.digest?.sha256)) failures.push('anchor Statement.subject[0] 非法');
  }
  const predicate = statement.predicate;
  failures.push(...collectRegistrationCanaryExactFieldFailures(predicate, PREDICATE_FIELDS, 'anchor Statement.predicate'));
  if (!isRegistrationCanaryProtocolRecord(predicate)) {
    failures.push(...collectRegistrationCanaryProtocolStringFailures(statement, 'anchor Statement'));
    return failures;
  }
  for (const [field, fields] of [
    ['experimentRef', EXPERIMENT_FIELDS], ['checkpoint', CHECKPOINT_FIELDS],
    ['authority', AUTHORITY_FIELDS], ['state', STATE_FIELDS], ['controller', CONTROLLER_FIELDS],
  ]) failures.push(...collectRegistrationCanaryExactFieldFailures(predicate?.[field], fields, `anchor Statement.predicate.${field}`));
  failures.push(...collectRegistrationCanaryExactFieldFailures(predicate?.controller?.policy, POLICY_FIELDS, 'anchor Statement.predicate.controller.policy'));
  if (predicate?.protocolVersion !== PROTOCOL_VERSION || predicate?.purpose !== PURPOSE
    || predicate?.role !== 'grade-checkpoint-anchor' || !BATCH_ID_PATTERN.test(predicate?.batchId ?? '')) failures.push('anchor predicate protocol/purpose/role/batch 非法');
  if (!isRegistrationCanarySafeId(predicate?.experimentRef?.id)
    || !isRegistrationCanarySafeId(predicate?.experimentRef?.manifestVersion)) failures.push('anchor predicate experimentRef 非法');
  if (predicate?.checkpoint?.mediaType !== 'application/json'
    || !Number.isSafeInteger(predicate?.checkpoint?.byteLength) || predicate.checkpoint.byteLength < 2
    || !isRegistrationCanarySha256(predicate?.checkpoint?.sha256)
    || !isRegistrationCanarySafeId(predicate?.checkpoint?.checkpointVersion)) failures.push('anchor predicate checkpoint 非法');
  if (!isRegistrationCanarySafeId(predicate?.authority?.id) || !isRegistrationCanarySafeId(predicate?.authority?.epoch)) failures.push('anchor predicate authority 非法');
  if (!sameJson(predicate?.state, { from: 'absent', to: 'anchored', expectedVersion: 0, resultVersion: 1 })) failures.push('anchor predicate state 必须为 absent→anchored 0→1');
  if (!isRegistrationCanarySha256(predicate?.anchorKeySha256)
    || !isRegistrationCanarySha256(predicate?.controller?.bundleSha256)
    || !isRegistrationCanarySafeId(predicate?.controller?.policy?.id)
    || !isRegistrationCanarySafeId(predicate?.controller?.policy?.version)
    || !isRegistrationCanarySha256(predicate?.controller?.policy?.sha256)) failures.push('anchor predicate controller/policy 非法');
  if (predicate?.anchorKeySha256 !== anchorKeyFor(predicate)) failures.push('anchor key digest 与 protocol/experiment/batch/purpose 不匹配');
  failures.push(...collectRegistrationCanaryProtocolStringFailures(statement, 'anchor Statement'));
  return failures;
};

export const buildRegistrationCanaryAnchorStatement = ({
  checkpointRequestJson,
  batchId,
  authority,
  controller,
}) => {
  const request = parseRegistrationCanaryGradeCheckpointRequest(checkpointRequestJson);
  const requestBytes = Buffer.from(checkpointRequestJson, 'utf8');
  const predicate = {
    protocolVersion: PROTOCOL_VERSION,
    purpose: PURPOSE,
    experimentRef: structuredClone(request.experimentRef),
    batchId,
    checkpoint: {
      mediaType: 'application/json',
      byteLength: requestBytes.length,
      sha256: hashRegistrationCanaryExactBytes(requestBytes),
      checkpointVersion: request.checkpointVersion,
    },
    authority: structuredClone(authority),
    role: 'grade-checkpoint-anchor',
    state: { from: 'absent', to: 'anchored', expectedVersion: 0, resultVersion: 1 },
    anchorKeySha256: anchorKeyFor({ experimentRef: request.experimentRef, batchId }),
    controller: structuredClone(controller),
  };
  const statement = {
    _type: REGISTRATION_CANARY_STATEMENT_TYPE,
    subject: [{ name: SUBJECT_NAME, digest: { sha256: predicate.checkpoint.sha256 } }],
    predicateType: REGISTRATION_CANARY_ANCHOR_PREDICATE_TYPE,
    predicate,
  };
  const failures = collectRegistrationCanaryAnchorStatementFailures(statement);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  return statement;
};

export const verifyRegistrationCanaryAnchorReceipt = ({
  checkpointRequestJson,
  anchorReceiptJson,
  publicKey,
  expectedBindings,
}) => {
  const parsed = parseRegistrationCanaryDsseEnvelope(anchorReceiptJson, 'anchor receipt');
  const failures = collectRegistrationCanaryAnchorStatementFailures(parsed.statement);
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const predicate = parsed.statement.predicate;
  const expected = buildRegistrationCanaryAnchorStatement({
    checkpointRequestJson,
    batchId: predicate.batchId,
    authority: predicate.authority,
    controller: predicate.controller,
  });
  if (!sameJson(parsed.statement, expected)) throw new TypeError('anchor receipt 与 checkpoint 精确字节或当前协议绑定不匹配');
  const signature = verifyRegistrationCanaryDsseSignature(parsed, publicKey);
  let bindingStatus = 'unchecked';
  if (expectedBindings !== undefined) {
    const bindingFailures = collectRegistrationCanaryExactFieldFailures(expectedBindings, EXPECTED_BINDING_FIELDS, 'anchor expectedBindings');
    const publicKeySha256 = publicKey ? hashRegistrationCanaryEd25519PublicKey(publicKey) : null;
    if (bindingFailures.length > 0 || !publicKeySha256
      || expectedBindings.batchId !== predicate.batchId
      || !sameJson(expectedBindings.authority, predicate.authority)
      || !sameJson(expectedBindings.controller, predicate.controller)
      || expectedBindings.signerKeyId !== parsed.signerKeyId
      || expectedBindings.signerPublicKeySha256 !== publicKeySha256) {
      throw new TypeError([...bindingFailures, 'anchor receipt 与 host expectedBindings 不匹配'].join('；'));
    }
    bindingStatus = 'matched-caller-expected';
  }
  return {
    schemaVersion: 1,
    reportType: 'ai-registration-canary-anchor-verification',
    protocolVersion: PROTOCOL_VERSION,
    verificationStatus: signature.status === 'unverified' ? 'valid-untrusted' : signature.status,
    bindingStatus,
    evidenceScope: 'component-only',
    anchorRef: {
      batchId: predicate.batchId,
      anchorKeySha256: predicate.anchorKeySha256,
      checkpointRequestSha256: predicate.checkpoint.sha256,
      anchorReceiptSha256: parsed.proofSha256,
      anchorTransportSha256: parsed.envelopeSha256,
      authority: structuredClone(predicate.authority),
      stateVersion: predicate.state.resultVersion,
    },
    signature: {
      keyid: parsed.signerKeyId,
      publicKeySha256: publicKey ? hashRegistrationCanaryEd25519PublicKey(publicKey) : null,
      signatureVerified: signature.signatureVerified,
    },
    trust: {
      trustedSigners: 0,
      identityVerified: false,
      timestampVerified: false,
      inclusionVerified: false,
      consistencyVerified: false,
      nonEquivocationVerified: false,
      externalStateVerified: false,
    },
    writebackCandidate: {
      status: 'blocked', reasonCode: 'external-anchor-witness-required', automaticWrite: false,
    },
  };
};

export const verifyRegistrationCanaryAnchorReceiptSet = ({ anchorReceiptJsons, ...input }) => {
  if (!Array.isArray(anchorReceiptJsons) || anchorReceiptJsons.length < 1 || anchorReceiptJsons.length > 16) {
    throw new TypeError('anchor receipt observation set 必须包含 1 到 16 条记录');
  }
  const observed = anchorReceiptJsons.map(anchorReceiptJson => ({
    anchorReceiptJson,
    ...parseRegistrationCanaryDsseEnvelope(anchorReceiptJson, 'anchor receipt'),
  }));
  if (new Set(observed.map(item => item.proofSha256)).size !== 1) {
    throw new TypeError('检测到同一 checkpoint 的本地可观察 anchor 分叉或非幂等重签');
  }
  const preferred = input.expectedBindings?.signerKeyId;
  const candidates = preferred === undefined
    ? observed : observed.filter(item => item.signerKeyId === preferred);
  const selected = [...(candidates.length > 0 ? candidates : observed)].sort((left, right) => (
    left.anchorReceiptJson < right.anchorReceiptJson ? -1 : left.anchorReceiptJson > right.anchorReceiptJson ? 1 : 0
  ))[0];
  return verifyRegistrationCanaryAnchorReceipt({ ...input, anchorReceiptJson: selected.anchorReceiptJson });
};
