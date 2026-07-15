import { createHash } from 'node:crypto';

import {
  hashRegistrationCanaryEd25519PublicKey,
  parseRegistrationCanaryDsseEnvelope,
  verifyRegistrationCanaryDsseSignature,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { collectEvolutionSensitiveFieldFailures } from './aiGovernanceEvolutionEvalContract.mjs';
import { isExternalControllerRuntimePolicyPathCandidate } from './aiGovernanceCodexExternalControllerRuntimePolicy.mjs';

export const CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT = Object.freeze({
  id: 'codex-external-controller-attested-runtime-preflight',
  version: '1.0.0',
  caseId: 'codex-external-controller-attested-runtime-preflight-boundary',
  coverage: 'external-controller-runtime-isolation-subset',
});

const MAX_REPORT_BYTES = 256 * 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const REVISION_PATTERN = /^worktree-[0-9a-f]{64}$/;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,127}$/;
const ROLES = Object.freeze(['controller', 'codex', 'mcp', 'validation', 'sanitizer', 'signer', 'witness']);
const BINDING_FIELDS = Object.freeze([
  'snapshotRevision', 'snapshotManifestSha256', 'snapshotTreeSha256', 'sourceProbeSha256',
  'topologyPlanSha256', 'controllerBundleSha256', 'launcherBundleSha256',
  'runtimeImageSha256', 'codexBinarySha256', 'policySha256', 'runNonceSha256',
  'challengeSha256', 'stateKeySha256',
]);
const EXACT_FIELDS = Object.freeze({
  report: ['schemaVersion', 'reportType', 'contract', 'bindings', 'runtime', 'identities', 'isolation', 'state', 'claims', 'privacy', 'result'],
  contract: ['id', 'version', 'evidenceScope', 'coverage', 'producer', 'attestationProfile'],
  bindings: BINDING_FIELDS,
  runtime: ['platform', 'architecture', 'executed', 'fakeWorkloadsOnly', 'modelInvocations', 'modelAccessMaterialPresent', 'automaticLedgerWrites', 'retryCount'],
  identities: ROLES,
  identity: ['role', 'trustDomain', 'hostUid', 'hostGid', 'supplementaryGroupsEmpty', 'namespaceUid', 'pidNamespaceSha256', 'userNamespaceSha256', 'mountNamespaceSha256', 'networkNamespaceSha256', 'ipcNamespaceSha256', 'imageSha256', 'identityBoundarySha256'],
  isolation: ['checkoutVisibleToWorkloads', 'snapshotReadOnly', 'snapshotDigestBefore', 'snapshotDigestAfter', 'authenticationRootsEmpty', 'noNewPrivileges', 'capabilitiesEmpty', 'hostProcVisible', 'hostSocketVisible', 'sharedWritableStorage', 'externalNetworkBlocked', 'controlGroupsObserved', 'descendantsExited', 'temporaryStateRemoved'],
  state: ['authorityId', 'stateKeySha256', 'challengeSha256', 'attempt', 'generationBefore', 'generationAfter', 'issuedCount', 'consumedCount'],
  claims: ['runtimeIsolationVerified', 'controllerIsolationVerified', 'userNamespaceVerified', 'pidNamespaceVerified', 'signerVerified', 'trustedSigners', 'externalStateVerified', 'atMostOnceVerified', 'nonEquivocationVerified', 'modelInvocationAbsenceVerified', 'currentTaskRegistryVerified', 'outcomeEligible', 'confirmedCoverageEligible'],
  privacy: ['sourceContentStored', 'reasoningStored', 'toolPayloadStored', 'authMaterialStored', 'absolutePathStored', 'processIdStored', 'commandStored', 'stdoutStored', 'stderrStored', 'canaryContentStored'],
  result: ['status', 'failures'],
});
const HOST_STATEMENT_PREDICATE = 'https://jsonutils.local/attestation/external-controller-runtime-preflight/v1';
const WITNESS_STATEMENT_PREDICATE = 'https://jsonutils.local/attestation/external-controller-runtime-witness/v1';
const STATEMENT_FIELDS = ['_type', 'subject', 'predicateType', 'predicate'];
const SUBJECT_FIELDS = ['name', 'digest'];
const HOST_PREDICATE_FIELDS = ['contractId', 'contractVersion', 'reportSha256', 'stateKeySha256', 'challengeSha256', 'signerSpkiSha256', 'witnessSpkiSha256'];
const WITNESS_PREDICATE_FIELDS = ['contractId', 'contractVersion', 'reportSha256', 'hostProofSha256', 'stateKeySha256', 'challengeSha256', 'stateAuthorityId', 'transition', 'transparency'];

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const exactFields = (value, fields, label) => {
  if (!isRecord(value) || Object.keys(value).length !== fields.length
    || fields.some(field => !Object.hasOwn(value, field))) throw new TypeError(`${label} 必须是闭字段对象`);
};
const allFalse = (value, fields) => fields.every(field => value[field] === false);
const allTrue = (value, fields) => fields.every(field => value[field] === true);
const unique = values => new Set(values).size === values.length;
const safeId = value => typeof value === 'string' && SAFE_ID_PATTERN.test(value);

export const deriveCodexExternalControllerAttestedStateBindings = ({ bindings, policy }) => {
  const stableFields = BINDING_FIELDS.filter(field => !['runNonceSha256', 'challengeSha256', 'stateKeySha256'].includes(field));
  const stateKeySha256 = hash(JSON.stringify([
    'jsonutils-external-controller-runtime-state-key-v1', policy.policySha256,
    policy.record.policyId, policy.record.requirements.stateAuthorityId,
    CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.id,
    CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.version,
    ...stableFields.map(field => bindings[field]),
  ]));
  return Object.freeze({ stateKeySha256, challengeSha256: hash(JSON.stringify([
    'jsonutils-external-controller-runtime-challenge-v1', stateKeySha256,
    bindings.runNonceSha256, 1,
  ])) });
};

const parseReport = (reportJson) => {
  if (typeof reportJson !== 'string' || Buffer.byteLength(reportJson, 'utf8') > MAX_REPORT_BYTES) {
    throw new TypeError('attested runtime report 必须是至多 256 KiB 的紧凑 JSON');
  }
  let report;
  try { report = JSON.parse(reportJson); } catch { throw new TypeError('attested runtime report 不是合法 JSON'); }
  if (JSON.stringify(report) !== reportJson) throw new TypeError('attested runtime report 必须使用精确紧凑 JSON');
  for (const field of ['report', 'contract', 'bindings', 'runtime', 'identities', 'isolation', 'state', 'claims', 'privacy', 'result']) {
    exactFields(field === 'report' ? report : report[field], EXACT_FIELDS[field], `attested runtime report.${field}`);
  }
  for (const role of ROLES) exactFields(report.identities[role], EXACT_FIELDS.identity, `attested runtime report.identities.${role}`);
  return report;
};

const collectReportFailures = (report, expectedBindings, policy) => {
  exactFields(expectedBindings, BINDING_FIELDS, 'attested runtime expectedBindings');
  const failures = [];
  const { contract, bindings, runtime, identities, isolation, state, claims, privacy, result } = report;
  if (report.schemaVersion !== 1 || report.reportType !== 'codex-external-controller-attested-runtime-preflight'
    || contract.id !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.id
    || contract.version !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.version
    || contract.evidenceScope !== 'component-only'
    || contract.coverage !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.coverage
    || contract.producer !== policy.record.requirements.producer
    || contract.attestationProfile !== policy.record.requirements.attestationProfile) failures.push('contract-boundary-invalid');
  const digestFields = BINDING_FIELDS.filter(field => field.endsWith('Sha256'));
  if (!REVISION_PATTERN.test(bindings.snapshotRevision ?? '')
    || !digestFields.every(field => SHA256_PATTERN.test(bindings[field] ?? ''))
    || bindings.policySha256 !== policy.policySha256
    || BINDING_FIELDS.some(field => bindings[field] !== expectedBindings[field])) {
    failures.push('host-binding-mismatch');
  }
  if (runtime.platform !== policy.record.requirements.platform || !safeId(runtime.architecture)
    || runtime.executed !== true || runtime.fakeWorkloadsOnly !== true
    || runtime.modelInvocations !== 0 || runtime.modelAccessMaterialPresent !== false
    || runtime.automaticLedgerWrites !== false || runtime.retryCount !== 0) failures.push('execution-boundary-invalid');
  for (const role of ROLES) {
    const identity = identities[role];
    if (identity.role !== role || !safeId(identity.trustDomain)
      || !Number.isSafeInteger(identity.hostUid) || identity.hostUid <= 0
      || !Number.isSafeInteger(identity.hostGid) || identity.hostGid <= 0
      || identity.supplementaryGroupsEmpty !== true
      || !Number.isSafeInteger(identity.namespaceUid) || identity.namespaceUid <= 0
      || ['pidNamespaceSha256', 'userNamespaceSha256', 'mountNamespaceSha256',
        'networkNamespaceSha256', 'ipcNamespaceSha256', 'imageSha256', 'identityBoundarySha256']
        .some(field => !SHA256_PATTERN.test(identity[field] ?? ''))) failures.push(`identity-invalid:${role}`);
  }
  if (!unique(ROLES.map(role => identities[role].trustDomain))
    || !unique(ROLES.map(role => identities[role].identityBoundarySha256))) failures.push('trust-domain-not-isolated');
  if (!unique(ROLES.map(role => identities[role].hostUid))) failures.push('host-uid-not-isolated');
  if (!unique(ROLES.map(role => identities[role].hostGid))) failures.push('host-gid-not-isolated');
  if (!unique(ROLES.map(role => identities[role].namespaceUid))) failures.push('namespace-uid-not-isolated');
  for (const field of ['pidNamespaceSha256', 'userNamespaceSha256', 'mountNamespaceSha256',
    'networkNamespaceSha256', 'ipcNamespaceSha256']) {
    if (!unique(ROLES.map(role => identities[role][field]))) failures.push(`${field}-not-isolated`);
  }
  if (identities.signer.identityBoundarySha256 === identities.controller.identityBoundarySha256
    || identities.witness.identityBoundarySha256 === identities.signer.identityBoundarySha256) failures.push('attestation-role-not-isolated');
  if (isolation.checkoutVisibleToWorkloads !== false || isolation.snapshotReadOnly !== true
    || isolation.snapshotDigestBefore !== bindings.snapshotTreeSha256
    || isolation.snapshotDigestAfter !== bindings.snapshotTreeSha256
    || !allTrue(isolation, ['authenticationRootsEmpty', 'noNewPrivileges', 'capabilitiesEmpty',
      'externalNetworkBlocked', 'controlGroupsObserved', 'descendantsExited', 'temporaryStateRemoved'])
    || !allFalse(isolation, ['hostProcVisible', 'hostSocketVisible', 'sharedWritableStorage'])) {
    failures.push('runtime-isolation-invalid');
  }
  const expectedState = deriveCodexExternalControllerAttestedStateBindings({ bindings, policy });
  if (state.authorityId !== policy.record.requirements.stateAuthorityId
    || state.stateKeySha256 !== bindings.stateKeySha256
    || bindings.stateKeySha256 !== expectedState.stateKeySha256
    || state.challengeSha256 !== bindings.challengeSha256
    || bindings.challengeSha256 !== expectedState.challengeSha256 || state.attempt !== 1
    || state.generationBefore !== 0 || state.generationAfter !== 1
    || state.issuedCount !== 1 || state.consumedCount !== 1) failures.push('state-transition-invalid');
  const falseClaimFields = EXACT_FIELDS.claims.filter(field => field !== 'trustedSigners');
  if (!allFalse(claims, falseClaimFields) || claims.trustedSigners !== 0) failures.push('producer-trust-overclaim');
  if (!allFalse(privacy, EXACT_FIELDS.privacy)) failures.push('privacy-boundary-invalid');
  if (result.status !== 'observed-subset' || !Array.isArray(result.failures)
    || result.failures.length !== 0) failures.push('report-status-invalid');
  failures.push(...collectEvolutionSensitiveFieldFailures(report, 'attested runtime report')
    .map(() => 'sensitive-evidence-rejected'));
  return [...new Set(failures)];
};

const parseStatement = (parsed, { predicateType, predicateFields, subjectName, label }) => {
  const statement = parsed.statement;
  exactFields(statement, STATEMENT_FIELDS, `${label} Statement`);
  if (statement._type !== 'https://in-toto.io/Statement/v1'
    || statement.predicateType !== predicateType
    || !Array.isArray(statement.subject) || statement.subject.length !== 1) {
    throw new TypeError(`${label} Statement 基础字段非法`);
  }
  exactFields(statement.subject[0], SUBJECT_FIELDS, `${label} Statement.subject[0]`);
  exactFields(statement.subject[0].digest, ['sha256'], `${label} Statement.subject[0].digest`);
  exactFields(statement.predicate, predicateFields, `${label} Statement.predicate`);
  if (statement.subject[0].name !== subjectName
    || !SHA256_PATTERN.test(statement.subject[0].digest.sha256 ?? '')) {
    throw new TypeError(`${label} Statement subject 非法`);
  }
  return statement;
};

const validateHostStatement = ({ statement, reportSha256, report, policy }) => {
  const predicate = statement.predicate;
  if (statement.subject[0].digest.sha256 !== reportSha256
    || predicate.contractId !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.id
    || predicate.contractVersion !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.version
    || predicate.reportSha256 !== reportSha256
    || predicate.stateKeySha256 !== report.state.stateKeySha256
    || predicate.challengeSha256 !== report.state.challengeSha256
    || predicate.signerSpkiSha256 !== policy.record.identities.signer.spkiSha256
    || predicate.witnessSpkiSha256 !== policy.record.identities.witness.spkiSha256) {
    throw new TypeError('host attestation Statement 绑定漂移');
  }
};

const validateWitnessStatement = ({ statement, reportSha256, hostProofSha256, report, policy }) => {
  const predicate = statement.predicate;
  exactFields(predicate.transition, ['before', 'after', 'generationBefore', 'generationAfter', 'issuedCount', 'consumedCount'], 'witness Statement.transition');
  exactFields(predicate.transparency, ['profile', 'inclusionReceiptSha256', 'consistencyReceiptSha256', 'nonEquivocationVerified'], 'witness Statement.transparency');
  if (statement.subject[0].digest.sha256 !== hostProofSha256
    || predicate.contractId !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.id
    || predicate.contractVersion !== CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT.version
    || predicate.reportSha256 !== reportSha256 || predicate.hostProofSha256 !== hostProofSha256
    || predicate.stateKeySha256 !== report.state.stateKeySha256
    || predicate.challengeSha256 !== report.state.challengeSha256
    || predicate.stateAuthorityId !== policy.record.requirements.stateAuthorityId
    || predicate.transition.before !== 'absent' || predicate.transition.after !== 'observed'
    || predicate.transition.generationBefore !== 0 || predicate.transition.generationAfter !== 1
    || predicate.transition.issuedCount !== 1 || predicate.transition.consumedCount !== 1
    || predicate.transparency.profile !== 'external-receipts-bound-unverified'
    || !SHA256_PATTERN.test(predicate.transparency.inclusionReceiptSha256 ?? '')
    || !SHA256_PATTERN.test(predicate.transparency.consistencyReceiptSha256 ?? '')
    || predicate.transparency.nonEquivocationVerified !== false) {
    throw new TypeError('witness Statement 绑定漂移');
  }
};

export const verifyCodexExternalControllerAttestedPreflight = ({
  reportJson, hostEnvelopeJson, witnessEnvelopeJson, expectedBindings, policy,
}) => {
  if (!policy?.record || !policy.signerPublicKey || !policy.witnessPublicKey) {
    throw new TypeError('必须提供解析后的 external runtime trust policy');
  }
  const report = parseReport(reportJson);
  const reportSha256 = hash(Buffer.from(reportJson, 'utf8'));
  const reportFailures = collectReportFailures(report, expectedBindings, policy);
  const host = parseRegistrationCanaryDsseEnvelope(hostEnvelopeJson, 'runtime host DSSE envelope');
  const hostStatement = parseStatement(host, {
    predicateType: HOST_STATEMENT_PREDICATE, predicateFields: HOST_PREDICATE_FIELDS,
    subjectName: 'jsonutils-external-controller-runtime-report', label: 'runtime host',
  });
  validateHostStatement({ statement: hostStatement, reportSha256, report, policy });
  verifyRegistrationCanaryDsseSignature(host, policy.signerPublicKey);
  const witness = parseRegistrationCanaryDsseEnvelope(witnessEnvelopeJson, 'runtime witness DSSE envelope');
  const witnessStatement = parseStatement(witness, {
    predicateType: WITNESS_STATEMENT_PREDICATE, predicateFields: WITNESS_PREDICATE_FIELDS,
    subjectName: 'jsonutils-external-controller-runtime-host-proof', label: 'runtime witness',
  });
  validateWitnessStatement({ statement: witnessStatement, reportSha256,
    hostProofSha256: host.proofSha256, report, policy });
  verifyRegistrationCanaryDsseSignature(witness, policy.witnessPublicKey);
  if (host.signerKeyId !== policy.record.identities.signer.keyId
    || witness.signerKeyId !== policy.record.identities.witness.keyId
    || hashRegistrationCanaryEd25519PublicKey(policy.signerPublicKey)
      !== policy.record.identities.signer.spkiSha256
    || hashRegistrationCanaryEd25519PublicKey(policy.witnessPublicKey)
      !== policy.record.identities.witness.spkiSha256) throw new TypeError('runtime attestation signer identity 漂移');
  const policyPathCandidate = isExternalControllerRuntimePolicyPathCandidate(policy);
  const ok = reportFailures.length === 0;
  return Object.freeze({
    schemaVersion: 1,
    reportType: 'codex-external-controller-attested-runtime-preflight-verification',
    contract: CODEX_EXTERNAL_CONTROLLER_ATTESTED_PREFLIGHT,
    ok,
    verificationStatus: !ok ? 'rejected'
      : policyPathCandidate
        ? 'signature-verified-policy-path-candidate-untrusted-verifier-runtime'
        : 'signature-verified-unprotected-policy',
    evidenceScope: 'component-only',
    signatureMathVerified: true,
    reportContractVerified: ok,
    trustPolicyProtected: false,
    policyPathProtectionCandidateObserved: policyPathCandidate,
    verifierRuntimeProtected: false,
    preRuntimeInjectionExcluded: false,
    runtimeIsolationVerified: false,
    controllerIsolationVerified: false,
    userNamespaceVerified: false,
    pidNamespaceVerified: false,
    signerVerified: false,
    trustedSigners: 0,
    externalStateWitnessed: false,
    atMostOnceVerified: false,
    transparencyInclusionVerified: false,
    transparencyConsistencyVerified: false,
    nonEquivocationVerified: false,
    registrationPreflightEligible: false,
    currentTaskRegistryVerified: false,
    modelInvocationRequested: false,
    modelInvocationAbsenceVerified: false,
    outcomeEligible: false,
    confirmedCoverageEligible: false,
    reportSha256,
    hostProofSha256: host.proofSha256,
    witnessProofSha256: witness.proofSha256,
    policySha256: policy.policySha256,
    failures: reportFailures,
  });
};
