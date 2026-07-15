import { createHash, createPublicKey } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_POLICY_BYTES = 64 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const POLICY_FIELDS = ['schemaVersion', 'policyType', 'policyVersion', 'policyId', 'identities', 'requirements'];
const IDENTITY_FIELDS = ['role', 'keyId', 'spkiSha256', 'publicKeySpkiBase64'];
const REQUIREMENT_FIELDS = ['producer', 'platform', 'attestationProfile', 'stateAuthorityId'];
const policyPathCandidates = new WeakSet();

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactFields = (value, fields, label) => {
  if (!isRecord(value) || Object.keys(value).length !== fields.length
    || fields.some(field => !Object.hasOwn(value, field))) throw new TypeError(`${label} 必须是闭字段对象`);
};
const hash = value => createHash('sha256').update(value).digest('hex');
const isSafeId = value => typeof value === 'string' && SAFE_ID_PATTERN.test(value);
const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach(deepFreeze);
  return Object.freeze(value);
};

const parseIdentity = (identity, role) => {
  exactFields(identity, IDENTITY_FIELDS, `runtime trust policy.identities.${role}`);
  if (identity.role !== role || !isSafeId(identity.keyId)
    || !SHA256_PATTERN.test(identity.spkiSha256 ?? '')
    || typeof identity.publicKeySpkiBase64 !== 'string'
    || !BASE64_PATTERN.test(identity.publicKeySpkiBase64)) {
    throw new TypeError(`runtime trust policy identity 非法: ${role}`);
  }
  const bytes = Buffer.from(identity.publicKeySpkiBase64, 'base64');
  if (bytes.length === 0 || bytes.toString('base64') !== identity.publicKeySpkiBase64
    || hash(bytes) !== identity.spkiSha256) throw new TypeError(`runtime trust policy SPKI 非法: ${role}`);
  let publicKey;
  try { publicKey = createPublicKey({ key: bytes, type: 'spki', format: 'der' }); }
  catch { throw new TypeError(`runtime trust policy public key 非法: ${role}`); }
  if (publicKey.asymmetricKeyType !== 'ed25519') throw new TypeError(`runtime trust policy key 必须是 Ed25519: ${role}`);
  return publicKey;
};

export const parseExternalControllerRuntimeTrustPolicy = (policyJson) => {
  if (typeof policyJson !== 'string' || Buffer.byteLength(policyJson, 'utf8') > MAX_POLICY_BYTES) {
    throw new TypeError('runtime trust policy 必须是至多 64 KiB 的紧凑 JSON');
  }
  let record;
  try { record = JSON.parse(policyJson); } catch { throw new TypeError('runtime trust policy 不是合法 JSON'); }
  if (JSON.stringify(record) !== policyJson) throw new TypeError('runtime trust policy 必须使用精确紧凑 JSON');
  exactFields(record, POLICY_FIELDS, 'runtime trust policy');
  exactFields(record.identities, ['signer', 'witness'], 'runtime trust policy.identities');
  exactFields(record.requirements, REQUIREMENT_FIELDS, 'runtime trust policy.requirements');
  if (record.schemaVersion !== 1
    || record.policyType !== 'jsonutils-external-controller-runtime-trust-policy'
    || record.policyVersion !== '1.0.0' || !isSafeId(record.policyId)
    || record.requirements.producer !== 'protected-external-controller'
    || record.requirements.platform !== 'linux'
    || record.requirements.attestationProfile !== 'dsse-ed25519-dual-role-v1'
    || !isSafeId(record.requirements.stateAuthorityId)) {
    throw new TypeError('runtime trust policy 基础字段非法');
  }
  const signerPublicKey = parseIdentity(record.identities.signer, 'signer');
  const witnessPublicKey = parseIdentity(record.identities.witness, 'witness');
  if (record.identities.signer.keyId === record.identities.witness.keyId
    || record.identities.signer.spkiSha256 === record.identities.witness.spkiSha256) {
    throw new TypeError('runtime trust policy signer/witness 必须角色隔离');
  }
  return Object.freeze({
    record: deepFreeze(record),
    policyJson,
    policySha256: hash(Buffer.from(policyJson, 'utf8')),
    signerPublicKey,
    witnessPublicKey,
  });
};

const isWithin = (root, candidate) => {
  const relative = path.relative(root, candidate);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..'
    && !relative.startsWith(`..${path.sep}`));
};

const assertProtectedPath = (requestedPath, repositoryRoot) => {
  if (!path.isAbsolute(requestedPath ?? '') || !path.isAbsolute(repositoryRoot ?? '')) {
    throw new TypeError('runtime trust policy path 必须是绝对路径');
  }
  const realPolicy = fs.realpathSync(requestedPath);
  const realRepository = fs.realpathSync(repositoryRoot);
  if (realPolicy !== requestedPath || isWithin(realRepository, realPolicy)) {
    throw new TypeError('runtime trust policy 必须位于 checkout 外且不能经过 symlink');
  }
  let current = realPolicy;
  while (true) {
    const stat = fs.lstatSync(current, { bigint: true });
    const isLeaf = current === realPolicy;
    if ((isLeaf ? !stat.isFile() || stat.nlink !== 1n : !stat.isDirectory())
      || stat.isSymbolicLink() || stat.uid !== 0n || (stat.mode & 0o022n) !== 0n) {
      throw new TypeError('runtime trust policy 路径链必须 root-owned 且不可由 group/other 写入');
    }
    try {
      fs.accessSync(current, fs.constants.W_OK);
      throw new TypeError('runtime trust policy 路径链对当前 verifier 可写');
    } catch (error) {
      if (error instanceof TypeError) throw error;
      if (!['EACCES', 'EPERM', 'EROFS'].includes(error?.code)) throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return realPolicy;
};

export const loadExternalControllerRuntimePolicyPathCandidate = ({
  policyPath, expectedPolicySha256, repositoryRoot,
}) => {
  if (!SHA256_PATTERN.test(expectedPolicySha256 ?? '')) throw new TypeError('expectedPolicySha256 非法');
  const realPolicy = assertProtectedPath(policyPath, repositoryRoot);
  const before = fs.lstatSync(realPolicy, { bigint: true });
  if (before.size < 1n || before.size > BigInt(MAX_POLICY_BYTES)) {
    throw new TypeError('runtime trust policy 文件大小非法');
  }
  const policyJson = fs.readFileSync(realPolicy, 'utf8');
  const after = fs.lstatSync(realPolicy, { bigint: true });
  if (before.dev !== after.dev || before.ino !== after.ino || before.mode !== after.mode
    || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) {
    throw new TypeError('runtime trust policy 读取期间漂移');
  }
  const policy = parseExternalControllerRuntimeTrustPolicy(policyJson);
  if (policy.policySha256 !== expectedPolicySha256) throw new TypeError('runtime trust policy digest 漂移');
  policyPathCandidates.add(policy);
  return policy;
};

export const isExternalControllerRuntimePolicyPathCandidate = policy => policyPathCandidates.has(policy);
