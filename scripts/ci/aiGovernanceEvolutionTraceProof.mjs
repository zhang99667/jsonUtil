import { KeyObject, createHash, sign as signBytes, verify as verifyBytes } from 'node:crypto';
import { TextDecoder } from 'node:util';

export const AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE = 'application/vnd.in-toto+json';
export const AI_EVOLUTION_TRACE_PROOF_STATEMENT_TYPE = 'https://in-toto.io/Statement/v1';
export const AI_EVOLUTION_TRACE_PROOF_PREDICATE_TYPE = 'https://github.com/zhang99667/jsonUtil/attestations/host-proof/v1';

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const REVISION_PATTERN = /^(?:[0-9a-f]{40}|(?:worktree|commit|ci)-[0-9a-f]{40}|worktree-[0-9a-f]{64})$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const PROOF_FIELDS = new Set(['schemaVersion', 'envelope']);
const ENVELOPE_FIELDS = new Set(['payloadType', 'payload', 'signatures']);
const SIGNATURE_FIELDS = new Set(['keyid', 'sig']);
const STATEMENT_FIELDS = new Set(['_type', 'subject', 'predicateType', 'predicate']);
const SUBJECT_FIELDS = new Set(['name', 'digest']);
const DIGEST_FIELDS = new Set(['sha256']);
const PREDICATE_FIELDS = new Set([
  'receiptId', 'case', 'adapter', 'policy', 'revisions', 'model', 'cliVersion', 'exitCode',
  'stdoutDrained', 'timedOut', 'binaryStable', 'execArgsSha256', 'adapterBundleSha256',
]);
const CASE_FIELDS = new Set(['id', 'corpusVersion', 'caseVersion', 'subjectVersion', 'sha256']);
const ADAPTER_FIELDS = new Set(['id', 'version']);
const POLICY_FIELDS = new Set(['id', 'version', 'sha256']);
const REVISION_FIELDS = new Set(['before', 'after', 'receipt']);
const EXECUTION_FACT_FIELDS = new Set([
  'modelId', 'cliVersion', 'binarySha256', 'stdoutSha256', 'exitCode', 'stdoutDrained',
  'timedOut', 'binaryStable', 'execArgsSha256', 'adapterBundleSha256',
]);
const SUBJECT_NAMES = [
  'ai-evolution-trial-receipt',
  'observable-trace',
  'codex-exec-jsonl-stdout',
  'codex-cli-binary',
];
const MAX_PAYLOAD_BYTES = 64 * 1024;
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const hashJson = value => sha256(Buffer.from(JSON.stringify(value), 'utf8'));
const unexpectedFields = (value, allowed, label) => isRecord(value)
  ? Object.keys(value).filter(field => !allowed.has(field)).map(field => `${label}.${field} 不在允许字段中`)
  : [`${label} 必须是对象`];
const matches = (value, pattern) => typeof value === 'string' && pattern.test(value);
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const withoutProof = receipt => Object.fromEntries(Object.entries(receipt).filter(([field]) => field !== 'proof'));

const collectBuildInputFailures = (receipt, executionFacts) => {
  const failures = [];
  if (!isRecord(receipt)) return ['receipt 必须是对象'];
  if (receipt.schemaVersion !== 3) failures.push('receipt.schemaVersion 必须为 3');
  if (!matches(receipt.id, /^[a-z][a-z0-9-]{0,127}$/)) failures.push('receipt.id 非法');
  if (!matches(receipt.caseId, SAFE_ID_PATTERN)) failures.push('receipt.caseId 非法');
  if (!matches(receipt.corpusVersion, SAFE_ID_PATTERN)) failures.push('receipt.corpusVersion 非法');
  if (!Number.isInteger(receipt.caseVersion) || receipt.caseVersion < 1) failures.push('receipt.caseVersion 必须是正整数');
  if (!matches(receipt.subjectVersion, SAFE_ID_PATTERN)) failures.push('receipt.subjectVersion 非法');
  if (!matches(receipt.revision, REVISION_PATTERN)) failures.push('receipt.revision 非法');
  if (!isRecord(receipt.trace)) failures.push('receipt.trace 必须是对象');
  if (!isRecord(receipt.trace?.adapter)) failures.push('receipt.trace.adapter 必须是对象');
  if (!isRecord(receipt.trace?.policy)) failures.push('receipt.trace.policy 必须是对象');
  if (!matches(receipt.trace?.adapter?.id, SAFE_ID_PATTERN)
    || !matches(receipt.trace?.adapter?.version, SAFE_ID_PATTERN)) failures.push('receipt.trace.adapter 非法');
  if (!matches(receipt.trace?.policy?.id, SAFE_ID_PATTERN)
    || !matches(receipt.trace?.policy?.version, SAFE_ID_PATTERN)
    || !matches(receipt.trace?.policy?.sha256, SHA256_PATTERN)) failures.push('receipt.trace.policy 非法');
  if (!matches(receipt.trace?.caseSha256, SHA256_PATTERN)) failures.push('receipt.trace.caseSha256 非法');
  if (!matches(receipt.trace?.beforeRevision, REVISION_PATTERN)
    || !matches(receipt.trace?.afterRevision, REVISION_PATTERN)) failures.push('receipt.trace revisions 非法');
  if (receipt.trace?.afterRevision !== receipt.revision) failures.push('trace.afterRevision 必须等于 receipt.revision');
  failures.push(...unexpectedFields(executionFacts, EXECUTION_FACT_FIELDS, 'executionFacts'));
  if (isRecord(executionFacts)) {
    if (!matches(executionFacts.modelId, SAFE_ID_PATTERN)) failures.push('executionFacts.modelId 非法');
    if (!matches(executionFacts.cliVersion, SAFE_ID_PATTERN)) failures.push('executionFacts.cliVersion 非法');
    for (const field of ['binarySha256', 'stdoutSha256', 'execArgsSha256', 'adapterBundleSha256']) {
      if (!matches(executionFacts[field], SHA256_PATTERN)) failures.push(`executionFacts.${field} 必须是小写 SHA-256`);
    }
    if (executionFacts.exitCode !== null && (
      !Number.isInteger(executionFacts.exitCode) || executionFacts.exitCode < 0 || executionFacts.exitCode > 255
    )) failures.push('executionFacts.exitCode 必须是 null 或 0 到 255 的整数');
    for (const field of ['stdoutDrained', 'timedOut', 'binaryStable']) {
      if (typeof executionFacts[field] !== 'boolean') failures.push(`executionFacts.${field} 必须是布尔值`);
    }
  }
  return failures;
};

const assertValid = (failures, label) => {
  if (failures.length > 0) throw new TypeError(`${label}: ${failures.join('；')}`);
};

export const createDssePreAuthEncoding = (payloadType, payload) => {
  if (typeof payloadType !== 'string' || payloadType.length === 0) throw new TypeError('payloadType 必须是非空字符串');
  const payloadBytes = typeof payload === 'string'
    ? Buffer.from(payload, 'utf8')
    : Buffer.isBuffer(payload) || payload instanceof Uint8Array ? Buffer.from(payload) : undefined;
  if (!payloadBytes) throw new TypeError('payload 必须是字符串或字节数组');
  const typeBytes = Buffer.from(payloadType, 'utf8');
  const prefix = Buffer.from(`DSSEv1 ${typeBytes.length} ${payloadType} ${payloadBytes.length} `, 'utf8');
  return Buffer.concat([prefix, payloadBytes]);
};

export const buildEvolutionTraceProofStatement = ({ receipt, executionFacts }) => {
  assertValid(collectBuildInputFailures(receipt, executionFacts), '无法构造 trace proof Statement');
  const receiptBody = withoutProof(receipt);
  return {
    _type: AI_EVOLUTION_TRACE_PROOF_STATEMENT_TYPE,
    subject: [
      { name: SUBJECT_NAMES[0], digest: { sha256: hashJson(receiptBody) } },
      { name: SUBJECT_NAMES[1], digest: { sha256: hashJson(receipt.trace) } },
      { name: SUBJECT_NAMES[2], digest: { sha256: executionFacts.stdoutSha256 } },
      { name: SUBJECT_NAMES[3], digest: { sha256: executionFacts.binarySha256 } },
    ],
    predicateType: AI_EVOLUTION_TRACE_PROOF_PREDICATE_TYPE,
    predicate: {
      receiptId: receipt.id,
      case: {
        id: receipt.caseId,
        corpusVersion: receipt.corpusVersion,
        caseVersion: receipt.caseVersion,
        subjectVersion: receipt.subjectVersion,
        sha256: receipt.trace.caseSha256,
      },
      adapter: { id: receipt.trace.adapter.id, version: receipt.trace.adapter.version },
      policy: {
        id: receipt.trace.policy.id,
        version: receipt.trace.policy.version,
        sha256: receipt.trace.policy.sha256,
      },
      revisions: {
        before: receipt.trace.beforeRevision,
        after: receipt.trace.afterRevision,
        receipt: receipt.revision,
      },
      model: executionFacts.modelId,
      cliVersion: executionFacts.cliVersion,
      exitCode: executionFacts.exitCode,
      stdoutDrained: executionFacts.stdoutDrained,
      timedOut: executionFacts.timedOut,
      binaryStable: executionFacts.binaryStable,
      execArgsSha256: executionFacts.execArgsSha256,
      adapterBundleSha256: executionFacts.adapterBundleSha256,
    },
  };
};

export const createEvolutionTraceProof = ({ receipt, executionFacts, signer }) => {
  if (!isRecord(signer) || !matches(signer.keyid, SAFE_ID_PATTERN)) throw new TypeError('signer.keyid 非法');
  if (!(signer.privateKey instanceof KeyObject)
    || signer.privateKey.type !== 'private' || signer.privateKey.asymmetricKeyType !== 'ed25519') {
    throw new TypeError('signer.privateKey 必须是外部传入的 Ed25519 私钥');
  }
  const statement = buildEvolutionTraceProofStatement({ receipt, executionFacts });
  const payloadBytes = Buffer.from(JSON.stringify(statement), 'utf8');
  const pae = createDssePreAuthEncoding(AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE, payloadBytes);
  return {
    schemaVersion: 1,
    envelope: {
      payloadType: AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE,
      payload: payloadBytes.toString('base64'),
      signatures: [{ keyid: signer.keyid, sig: signBytes(null, pae, signer.privateKey).toString('base64') }],
    },
  };
};

const decodeCanonicalBase64 = (value, label, failures) => {
  if (typeof value !== 'string' || value.length === 0 || !BASE64_PATTERN.test(value)) {
    failures.push(`${label} 必须是标准 canonical base64`);
    return undefined;
  }
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value) {
    failures.push(`${label} 必须是标准 canonical base64`);
    return undefined;
  }
  return decoded;
};

const collectStatementFailures = (statement) => {
  const failures = unexpectedFields(statement, STATEMENT_FIELDS, 'statement');
  if (!isRecord(statement)) return failures;
  if (statement._type !== AI_EVOLUTION_TRACE_PROOF_STATEMENT_TYPE) failures.push('statement._type 非法');
  if (statement.predicateType !== AI_EVOLUTION_TRACE_PROOF_PREDICATE_TYPE) failures.push('statement.predicateType 非法');
  if (!Array.isArray(statement.subject) || statement.subject.length !== SUBJECT_NAMES.length) {
    failures.push(`statement.subject 必须精确包含 ${SUBJECT_NAMES.length} 项`);
  } else statement.subject.forEach((subject, index) => {
    failures.push(...unexpectedFields(subject, SUBJECT_FIELDS, `statement.subject[${index}]`));
    if (subject?.name !== SUBJECT_NAMES[index]) failures.push(`statement.subject[${index}].name 非法`);
    failures.push(...unexpectedFields(subject?.digest, DIGEST_FIELDS, `statement.subject[${index}].digest`));
    if (!matches(subject?.digest?.sha256, SHA256_PATTERN)) failures.push(`statement.subject[${index}].digest.sha256 非法`);
  });
  failures.push(...unexpectedFields(statement.predicate, PREDICATE_FIELDS, 'statement.predicate'));
  const predicate = statement.predicate;
  if (!isRecord(predicate)) return failures;
  for (const [field, allowed] of [['case', CASE_FIELDS], ['adapter', ADAPTER_FIELDS], ['policy', POLICY_FIELDS], ['revisions', REVISION_FIELDS]]) {
    failures.push(...unexpectedFields(predicate[field], allowed, `statement.predicate.${field}`));
  }
  if (!matches(predicate.receiptId, SAFE_ID_PATTERN)) failures.push('statement.predicate.receiptId 非法');
  if (!matches(predicate.case?.id, SAFE_ID_PATTERN)
    || !matches(predicate.case?.corpusVersion, SAFE_ID_PATTERN)
    || !Number.isInteger(predicate.case?.caseVersion) || predicate.case.caseVersion < 1
    || !matches(predicate.case?.subjectVersion, SAFE_ID_PATTERN)
    || !matches(predicate.case?.sha256, SHA256_PATTERN)) failures.push('statement.predicate.case 非法');
  if (!matches(predicate.adapter?.id, SAFE_ID_PATTERN) || !matches(predicate.adapter?.version, SAFE_ID_PATTERN)) failures.push('statement.predicate.adapter 非法');
  if (!matches(predicate.policy?.id, SAFE_ID_PATTERN) || !matches(predicate.policy?.version, SAFE_ID_PATTERN)
    || !matches(predicate.policy?.sha256, SHA256_PATTERN)) failures.push('statement.predicate.policy 非法');
  if (!matches(predicate.revisions?.before, REVISION_PATTERN)
    || !matches(predicate.revisions?.after, REVISION_PATTERN)
    || !matches(predicate.revisions?.receipt, REVISION_PATTERN)) failures.push('statement.predicate.revisions 非法');
  if (!matches(predicate.model, SAFE_ID_PATTERN) || !matches(predicate.cliVersion, SAFE_ID_PATTERN)) failures.push('statement.predicate model/cliVersion 非法');
  if (predicate.exitCode !== null && (!Number.isInteger(predicate.exitCode) || predicate.exitCode < 0 || predicate.exitCode > 255)) failures.push('statement.predicate.exitCode 非法');
  for (const field of ['stdoutDrained', 'timedOut', 'binaryStable']) {
    if (typeof predicate[field] !== 'boolean') failures.push(`statement.predicate.${field} 必须是布尔值`);
  }
  for (const field of ['execArgsSha256', 'adapterBundleSha256']) {
    if (!matches(predicate[field], SHA256_PATTERN)) failures.push(`statement.predicate.${field} 非法`);
  }
  return failures;
};

const verificationResult = (status, failures, signerKeyId, statement) => ({
  status,
  failures,
  signerKeyId: signerKeyId ?? null,
  ...(statement ? { statement } : {}),
});

export const verifyEvolutionTraceProof = (receipt, options) => {
  const failures = [];
  if (!(options?.trustedSigners instanceof Map)) {
    return verificationResult('rejected', ['trustedSigners 必须由调用方传入 Map']);
  }
  const proof = receipt?.proof;
  failures.push(...unexpectedFields(proof, PROOF_FIELDS, 'proof'));
  if (proof?.schemaVersion !== 1) failures.push('proof.schemaVersion 必须为 1');
  failures.push(...unexpectedFields(proof?.envelope, ENVELOPE_FIELDS, 'proof.envelope'));
  const envelope = proof?.envelope;
  if (envelope?.payloadType !== AI_EVOLUTION_TRACE_PROOF_PAYLOAD_TYPE) failures.push('proof.envelope.payloadType 非法');
  if (!Array.isArray(envelope?.signatures) || envelope.signatures.length !== 1) failures.push('proof.envelope.signatures 必须精确包含一个签名');
  const signatureEntry = envelope?.signatures?.[0];
  failures.push(...unexpectedFields(signatureEntry, SIGNATURE_FIELDS, 'proof.envelope.signatures[0]'));
  if (!matches(signatureEntry?.keyid, SAFE_ID_PATTERN)) failures.push('proof.envelope.signatures[0].keyid 非法');
  const payloadBytes = decodeCanonicalBase64(envelope?.payload, 'proof.envelope.payload', failures);
  const signatureBytes = decodeCanonicalBase64(signatureEntry?.sig, 'proof.envelope.signatures[0].sig', failures);
  if (payloadBytes && payloadBytes.length > MAX_PAYLOAD_BYTES) failures.push('proof.envelope.payload 超过 64 KiB');
  if (signatureBytes && signatureBytes.length !== 64) failures.push('Ed25519 签名必须是 64 字节');

  let statement;
  let statementText;
  let statementParsed = false;
  if (payloadBytes && payloadBytes.length <= MAX_PAYLOAD_BYTES) {
    try {
      statementText = utf8Decoder.decode(payloadBytes);
      statement = JSON.parse(statementText);
      statementParsed = true;
      if (statementText !== JSON.stringify(statement)) failures.push('Statement 必须使用精确紧凑 JSON');
    } catch {
      failures.push('proof.envelope.payload 必须是合法 UTF-8 JSON Statement');
    }
  }
  if (statementParsed) failures.push(...collectStatementFailures(statement));
  if (statementParsed && failures.length === 0) {
    const predicate = statement.predicate;
    const executionFacts = {
      modelId: predicate.model,
      cliVersion: predicate.cliVersion,
      binarySha256: statement.subject[3].digest.sha256,
      stdoutSha256: statement.subject[2].digest.sha256,
      exitCode: predicate.exitCode,
      stdoutDrained: predicate.stdoutDrained,
      timedOut: predicate.timedOut,
      binaryStable: predicate.binaryStable,
      execArgsSha256: predicate.execArgsSha256,
      adapterBundleSha256: predicate.adapterBundleSha256,
    };
    try {
      const expected = buildEvolutionTraceProofStatement({ receipt, executionFacts });
      if (!sameJson(statement, expected)) failures.push('Statement 与 receipt/trace 绑定不匹配');
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (failures.length > 0) return verificationResult('rejected', failures, signatureEntry?.keyid, statement);

  const trustedKey = options.trustedSigners.get(signatureEntry.keyid);
  if (trustedKey === undefined) return verificationResult('unverified', [], signatureEntry.keyid, statement);
  if (!(trustedKey instanceof KeyObject)
    || trustedKey.type !== 'public' || trustedKey.asymmetricKeyType !== 'ed25519') {
    return verificationResult('rejected', ['trusted signer 必须是 Ed25519 公钥'], signatureEntry.keyid, statement);
  }
  const pae = createDssePreAuthEncoding(envelope.payloadType, payloadBytes);
  if (!verifyBytes(null, pae, trustedKey, signatureBytes)) {
    return verificationResult('rejected', ['DSSE Ed25519 签名验证失败'], signatureEntry.keyid, statement);
  }
  return verificationResult('verified', [], signatureEntry.keyid, statement);
};
