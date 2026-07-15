import { KeyObject, createHash, verify as verifyBytes } from 'node:crypto';
import { TextDecoder } from 'node:util';

import { createDssePreAuthEncoding } from './aiGovernanceEvolutionTraceProof.mjs';
import { collectEvolutionSensitiveValueFailures } from './aiGovernanceEvolutionEvalContract.mjs';

export const REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE = 'application/vnd.in-toto+json';
export const REGISTRATION_CANARY_STATEMENT_TYPE = 'https://in-toto.io/Statement/v1';

const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const FORBIDDEN_VALUE_PATTERN = /(?:^|[^a-z])(baseline|candidate|arm|trial|pair|plugin|treatment|lease)(?:$|[^a-z])/i;
const ENVELOPE_FIELDS = ['payloadType', 'payload', 'signatures'];
const SIGNATURE_FIELDS = ['keyid', 'sig'];
const MAX_PAYLOAD_BYTES = 64 * 1024;
const MAX_PROTOCOL_SCAN_DEPTH = 64;
const MAX_PROTOCOL_SCAN_NODES = 10_000;
const decoder = new TextDecoder('utf-8', { fatal: true });

export const isRegistrationCanaryProtocolRecord = value => (
  value !== null && typeof value === 'object' && !Array.isArray(value)
);
export const isRegistrationCanarySha256 = value => (
  typeof value === 'string' && SHA256_PATTERN.test(value)
);
export const isRegistrationCanarySafeId = value => (
  typeof value === 'string' && SAFE_ID_PATTERN.test(value)
);
export const hashRegistrationCanaryExactBytes = value => (
  createHash('sha256').update(value).digest('hex')
);

export const hashRegistrationCanaryEd25519PublicKey = (publicKey) => {
  if (!(publicKey instanceof KeyObject) || publicKey.type !== 'public' || publicKey.asymmetricKeyType !== 'ed25519') {
    throw new TypeError('DSSE 验证公钥必须是外部传入的 Ed25519 public KeyObject');
  }
  return hashRegistrationCanaryExactBytes(publicKey.export({ type: 'spki', format: 'der' }));
};

export const collectRegistrationCanaryProtocolStringFailures = (value, label) => {
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  let sensitive = false;
  let sideChannel = false;
  while (pending.length > 0) {
    const current = pending.pop();
    nodes += 1;
    if (nodes > MAX_PROTOCOL_SCAN_NODES || current.depth > MAX_PROTOCOL_SCAN_DEPTH) {
      return [`${label}: 协议字符串扫描超过深度或节点上限`];
    }
    if (typeof current.value === 'string') {
      sensitive ||= collectEvolutionSensitiveValueFailures(current.value, label).length > 0;
      sideChannel ||= FORBIDDEN_VALUE_PATTERN.test(current.value);
      continue;
    }
    const children = Array.isArray(current.value) ? current.value
      : isRegistrationCanaryProtocolRecord(current.value) ? Object.values(current.value) : [];
    for (const child of children) pending.push({ value: child, depth: current.depth + 1 });
  }
  return [
    ...(sensitive ? [`${label}: 禁止疑似凭据值`] : []),
    ...(sideChannel ? [`${label}: 禁止 arm/trial/plugin/lease 字符串侧信道`] : []),
  ];
};

export const collectRegistrationCanaryExactFieldFailures = (value, fields, label) => {
  if (!isRegistrationCanaryProtocolRecord(value)) return [`${label} 必须是对象`];
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  return JSON.stringify(actual) === JSON.stringify(expected) ? [] : [`${label} 必须是闭字段对象`];
};

export const parseRegistrationCanaryExactCompactJson = (json, { label, maxBytes }) => {
  if (typeof json !== 'string' || Buffer.byteLength(json, 'utf8') > maxBytes) {
    throw new TypeError(`${label} 必须是至多 ${maxBytes} 字节的紧凑 JSON 字符串`);
  }
  let value;
  try { value = JSON.parse(json); } catch { throw new TypeError(`${label} 不是合法 JSON`); }
  if (JSON.stringify(value) !== json) throw new TypeError(`${label} 必须是精确紧凑 JSON，且不能含重复键`);
  return value;
};

const decodeCanonicalBase64 = (value, label, failures) => {
  if (typeof value !== 'string' || value.length === 0 || !BASE64_PATTERN.test(value)) {
    failures.push(`${label} 必须是 canonical base64`);
    return undefined;
  }
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value) failures.push(`${label} 必须是 canonical base64`);
  return bytes;
};

export const parseRegistrationCanaryDsseEnvelope = (envelopeJson, label = 'DSSE envelope') => {
  const envelope = parseRegistrationCanaryExactCompactJson(envelopeJson, {
    label,
    maxBytes: 128 * 1024,
  });
  const failures = collectRegistrationCanaryExactFieldFailures(envelope, ENVELOPE_FIELDS, label);
  if (envelope?.payloadType !== REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE) {
    failures.push(`${label}.payloadType 非法`);
  }
  if (!Array.isArray(envelope?.signatures) || envelope.signatures.length !== 1) {
    failures.push(`${label}.signatures 必须精确包含一个签名`);
  }
  const signature = envelope?.signatures?.[0];
  failures.push(...collectRegistrationCanaryExactFieldFailures(signature, SIGNATURE_FIELDS, `${label}.signatures[0]`));
  if (!isRegistrationCanarySafeId(signature?.keyid)) failures.push(`${label}.signatures[0].keyid 非法`);
  failures.push(...collectRegistrationCanaryProtocolStringFailures(signature?.keyid, `${label}.signatures[0].keyid`));
  const payloadBytes = decodeCanonicalBase64(envelope?.payload, `${label}.payload`, failures);
  const signatureBytes = decodeCanonicalBase64(signature?.sig, `${label}.signatures[0].sig`, failures);
  if (payloadBytes && payloadBytes.length > MAX_PAYLOAD_BYTES) failures.push(`${label}.payload 超过 64 KiB`);
  if (signatureBytes && signatureBytes.length !== 64) failures.push(`${label} Ed25519 签名必须是 64 字节`);
  let statement;
  if (payloadBytes && payloadBytes.length <= MAX_PAYLOAD_BYTES) {
    try {
      const text = decoder.decode(payloadBytes);
      statement = JSON.parse(text);
      if (text !== JSON.stringify(statement)) failures.push(`${label} Statement 必须是精确紧凑 JSON`);
    } catch {
      failures.push(`${label}.payload 必须是合法 UTF-8 JSON Statement`);
    }
  }
  if (failures.length > 0) throw new TypeError(failures.join('；'));
  const statementSha256 = hashRegistrationCanaryExactBytes(payloadBytes);
  const signatureSha256 = hashRegistrationCanaryExactBytes(signatureBytes);
  const proofSha256 = hashRegistrationCanaryExactBytes(Buffer.from(JSON.stringify({
    payloadType: envelope.payloadType,
    statementSha256,
    signatureSha256,
  }), 'utf8'));
  return {
    envelope,
    envelopeJson,
    envelopeSha256: hashRegistrationCanaryExactBytes(Buffer.from(envelopeJson, 'utf8')),
    statementSha256,
    signatureSha256,
    proofSha256,
    payloadBytes,
    signatureBytes,
    signerKeyId: signature.keyid,
    statement,
  };
};

export const verifyRegistrationCanaryDsseSignature = (parsed, publicKey) => {
  if (publicKey === undefined) return { status: 'unverified', signatureVerified: false };
  hashRegistrationCanaryEd25519PublicKey(publicKey);
  const pae = createDssePreAuthEncoding(parsed.envelope.payloadType, parsed.payloadBytes);
  if (!verifyBytes(null, pae, publicKey, parsed.signatureBytes)) throw new TypeError('DSSE Ed25519 签名验证失败');
  return { status: 'signature-verified-unwitnessed', signatureVerified: true };
};
