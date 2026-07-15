import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  deriveCodexExternalControllerAttestedStateBindings,
  verifyCodexExternalControllerAttestedPreflight,
} from './aiGovernanceCodexExternalControllerAttestedPreflight.mjs';
import {
  loadExternalControllerRuntimePolicyPathCandidate,
  parseExternalControllerRuntimeTrustPolicy,
} from './aiGovernanceCodexExternalControllerRuntimePolicy.mjs';
import {
  REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE,
  parseRegistrationCanaryDsseEnvelope,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { createDssePreAuthEncoding } from './aiGovernanceEvolutionTraceProof.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(Buffer.from(value, 'utf8'));
const clone = value => structuredClone(value);

const keyIdentity = (role, keyPair) => {
  const spki = keyPair.publicKey.export({ type: 'spki', format: 'der' });
  return { role, keyId: `${role}-key-v1`, spkiSha256: hash(spki),
    publicKeySpkiBase64: spki.toString('base64') };
};

const createEnvelope = (statement, keyId, privateKey) => {
  const payloadBytes = Buffer.from(JSON.stringify(statement), 'utf8');
  const signature = sign(null,
    createDssePreAuthEncoding(REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE, payloadBytes), privateKey);
  return JSON.stringify({
    payloadType: REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE,
    payload: payloadBytes.toString('base64'),
    signatures: [{ keyid: keyId, sig: signature.toString('base64') }],
  });
};

const createFixture = () => {
  const signer = generateKeyPairSync('ed25519');
  const witness = generateKeyPairSync('ed25519');
  const signerIdentity = keyIdentity('signer', signer);
  const witnessIdentity = keyIdentity('witness', witness);
  const policyRecord = {
    schemaVersion: 1,
    policyType: 'jsonutils-external-controller-runtime-trust-policy',
    policyVersion: '1.0.0',
    policyId: 'jsonutils-protected-linux-controller-v1',
    identities: { signer: signerIdentity, witness: witnessIdentity },
    requirements: {
      producer: 'protected-external-controller', platform: 'linux',
      attestationProfile: 'dsse-ed25519-dual-role-v1',
      stateAuthorityId: 'jsonutils-external-state-authority-v1',
    },
  };
  const policyJson = JSON.stringify(policyRecord);
  const policy = parseExternalControllerRuntimeTrustPolicy(policyJson);
  const baseBindings = {
    snapshotRevision: `worktree-${digest('snapshot-revision')}`,
    snapshotManifestSha256: digest('snapshot-manifest'),
    snapshotTreeSha256: digest('snapshot-tree'),
    sourceProbeSha256: digest('source-probe'),
    topologyPlanSha256: digest('topology-plan'),
    controllerBundleSha256: digest('controller-bundle'),
    launcherBundleSha256: digest('launcher-bundle'),
    runtimeImageSha256: digest('runtime-image'),
    codexBinarySha256: digest('codex-binary'),
    policySha256: hash(Buffer.from(policyJson, 'utf8')),
    runNonceSha256: digest('run-nonce'),
  };
  const expectedBindings = { ...baseBindings,
    ...deriveCodexExternalControllerAttestedStateBindings({ bindings: baseBindings, policy }) };
  const roles = ['controller', 'codex', 'mcp', 'validation', 'sanitizer', 'signer', 'witness'];
  const identities = Object.fromEntries(roles.map((role, index) => [role, {
    role, trustDomain: `${role}-trust-domain`, hostUid: 1101 + index, hostGid: 2101 + index,
    supplementaryGroupsEmpty: true,
    namespaceUid: 3101 + index, pidNamespaceSha256: digest(`${role}-pid`),
    userNamespaceSha256: digest(`${role}-user`), mountNamespaceSha256: digest(`${role}-mount`),
    networkNamespaceSha256: digest(`${role}-network`), ipcNamespaceSha256: digest(`${role}-ipc`),
    imageSha256: digest(`${role}-image`), identityBoundarySha256: digest(`${role}-identity`),
  }]));
  const report = {
    schemaVersion: 1,
    reportType: 'codex-external-controller-attested-runtime-preflight',
    contract: {
      id: 'codex-external-controller-attested-runtime-preflight', version: '1.0.0',
      evidenceScope: 'component-only', coverage: 'external-controller-runtime-isolation-subset',
      producer: 'protected-external-controller', attestationProfile: 'dsse-ed25519-dual-role-v1',
    },
    bindings: clone(expectedBindings),
    runtime: {
      platform: 'linux', architecture: 'arm64', executed: true, fakeWorkloadsOnly: true,
      modelInvocations: 0, modelAccessMaterialPresent: false, automaticLedgerWrites: false, retryCount: 0,
    },
    identities,
    isolation: {
      checkoutVisibleToWorkloads: false, snapshotReadOnly: true,
      snapshotDigestBefore: expectedBindings.snapshotTreeSha256,
      snapshotDigestAfter: expectedBindings.snapshotTreeSha256,
      authenticationRootsEmpty: true, noNewPrivileges: true, capabilitiesEmpty: true,
      hostProcVisible: false, hostSocketVisible: false, sharedWritableStorage: false,
      externalNetworkBlocked: true, controlGroupsObserved: true,
      descendantsExited: true, temporaryStateRemoved: true,
    },
    state: {
      authorityId: policyRecord.requirements.stateAuthorityId,
      stateKeySha256: expectedBindings.stateKeySha256,
      challengeSha256: expectedBindings.challengeSha256, attempt: 1,
      generationBefore: 0, generationAfter: 1, issuedCount: 1, consumedCount: 1,
    },
    claims: {
      runtimeIsolationVerified: false, controllerIsolationVerified: false,
      userNamespaceVerified: false, pidNamespaceVerified: false, signerVerified: false,
      trustedSigners: 0, externalStateVerified: false, atMostOnceVerified: false,
      nonEquivocationVerified: false, modelInvocationAbsenceVerified: false,
      currentTaskRegistryVerified: false, outcomeEligible: false, confirmedCoverageEligible: false,
    },
    privacy: {
      sourceContentStored: false, reasoningStored: false, toolPayloadStored: false,
      authMaterialStored: false, absolutePathStored: false, processIdStored: false,
      commandStored: false, stdoutStored: false, stderrStored: false, canaryContentStored: false,
    },
    result: { status: 'observed-subset', failures: [] },
  };
  const signArtifacts = (nextReport = report, mutateWitness = value => value) => {
    const reportJson = JSON.stringify(nextReport);
    const reportSha256 = hash(Buffer.from(reportJson, 'utf8'));
    const hostStatement = {
      _type: 'https://in-toto.io/Statement/v1',
      subject: [{ name: 'jsonutils-external-controller-runtime-report', digest: { sha256: reportSha256 } }],
      predicateType: 'https://jsonutils.local/attestation/external-controller-runtime-preflight/v1',
      predicate: {
        contractId: nextReport.contract.id, contractVersion: nextReport.contract.version,
        reportSha256, stateKeySha256: nextReport.state.stateKeySha256,
        challengeSha256: nextReport.state.challengeSha256,
        signerSpkiSha256: signerIdentity.spkiSha256, witnessSpkiSha256: witnessIdentity.spkiSha256,
      },
    };
    const hostEnvelopeJson = createEnvelope(hostStatement, signerIdentity.keyId, signer.privateKey);
    const hostProofSha256 = parseRegistrationCanaryDsseEnvelope(hostEnvelopeJson).proofSha256;
    const witnessStatement = mutateWitness({
      _type: 'https://in-toto.io/Statement/v1',
      subject: [{ name: 'jsonutils-external-controller-runtime-host-proof',
        digest: { sha256: hostProofSha256 } }],
      predicateType: 'https://jsonutils.local/attestation/external-controller-runtime-witness/v1',
      predicate: {
        contractId: nextReport.contract.id, contractVersion: nextReport.contract.version,
        reportSha256, hostProofSha256, stateKeySha256: nextReport.state.stateKeySha256,
        challengeSha256: nextReport.state.challengeSha256,
        stateAuthorityId: policyRecord.requirements.stateAuthorityId,
        transition: { before: 'absent', after: 'observed', generationBefore: 0,
          generationAfter: 1, issuedCount: 1, consumedCount: 1 },
        transparency: { profile: 'external-receipts-bound-unverified',
          inclusionReceiptSha256: digest('inclusion-receipt'),
          consistencyReceiptSha256: digest('consistency-receipt'), nonEquivocationVerified: false },
      },
    });
    return { reportJson, hostEnvelopeJson,
      witnessEnvelopeJson: createEnvelope(witnessStatement, witnessIdentity.keyId, witness.privateKey) };
  };
  return { signer, witness, policyRecord, policyJson, policy, expectedBindings, report, signArtifacts };
};

test('双签名数学通过但 caller policy 未受保护时不能解锁 registration', () => {
  const fixture = createFixture();
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(), expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, true);
  assert.equal(verification.signatureMathVerified, true);
  assert.equal(verification.verificationStatus, 'signature-verified-unprotected-policy');
  assert.equal(verification.trustPolicyProtected, false);
  assert.equal(verification.verifierRuntimeProtected, false);
  assert.equal(verification.preRuntimeInjectionExcluded, false);
  assert.equal(verification.trustedSigners, 0);
  assert.equal(verification.runtimeIsolationVerified, false);
  assert.equal(verification.registrationPreflightEligible, false);
  assert.equal(verification.atMostOnceVerified, false);
  assert.equal(verification.transparencyInclusionVerified, false);
  assert.equal(verification.outcomeEligible, false);
  const reordered = Object.fromEntries(Object.entries(fixture.expectedBindings).reverse());
  assert.equal(verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(), expectedBindings: reordered, policy: fixture.policy,
  }).ok, true);
});

test('expected bindings 漂移使 attested preflight rejected', () => {
  const fixture = createFixture();
  const expectedBindings = { ...fixture.expectedBindings, policySha256: digest('wrong-policy') };
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(), expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, false);
  assert.equal(verification.signatureMathVerified, true);
  assert.equal(verification.reportContractVerified, false);
  assert.equal(verification.verificationStatus, 'rejected');
  assert.deepEqual(verification.failures, ['host-binding-mismatch']);
});

test('重复 host UID 或 namespace 不能由有效签名掩盖', () => {
  const fixture = createFixture();
  const report = clone(fixture.report);
  report.identities.mcp.hostUid = report.identities.codex.hostUid;
  report.identities.mcp.pidNamespaceSha256 = report.identities.codex.pidNamespaceSha256;
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(report), expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, false);
  assert.equal(verification.failures.includes('host-uid-not-isolated'), true);
  assert.equal(verification.failures.includes('pidNamespaceSha256-not-isolated'), true);
});

test('signer/witness 也不能复用 workload UID 或 runtime namespace', () => {
  const fixture = createFixture();
  const report = clone(fixture.report);
  report.identities.signer.hostUid = report.identities.controller.hostUid;
  report.identities.signer.hostGid = report.identities.controller.hostGid;
  report.identities.witness.namespaceUid = report.identities.codex.namespaceUid;
  report.identities.witness.mountNamespaceSha256 = report.identities.codex.mountNamespaceSha256;
  report.identities.witness.supplementaryGroupsEmpty = false;
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(report), expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, false);
  assert.equal(verification.failures.includes('host-uid-not-isolated'), true);
  assert.equal(verification.failures.includes('host-gid-not-isolated'), true);
  assert.equal(verification.failures.includes('namespace-uid-not-isolated'), true);
  assert.equal(verification.failures.includes('mountNamespaceSha256-not-isolated'), true);
  assert.equal(verification.failures.includes('identity-invalid:witness'), true);
});

test('report 必须精确绑定实际受信 policy digest', () => {
  const fixture = createFixture();
  const report = clone(fixture.report);
  report.bindings.policySha256 = digest('different-policy');
  const expectedBindings = { ...fixture.expectedBindings, policySha256: report.bindings.policySha256 };
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(report), expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, false);
  assert.equal(verification.failures.includes('host-binding-mismatch'), true);
});

test('state challenge 必须绑定 host expected challenge', () => {
  const fixture = createFixture();
  const report = clone(fixture.report);
  report.state.challengeSha256 = digest('caller-only-challenge');
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(report), expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, false);
  assert.equal(verification.failures.includes('state-transition-invalid'), true);
});

test('producer 不能自报 verified、trusted signer 或 outcome eligibility', () => {
  const fixture = createFixture();
  const report = clone(fixture.report);
  report.claims.signerVerified = true;
  report.claims.trustedSigners = 2;
  report.claims.outcomeEligible = true;
  const verification = verifyCodexExternalControllerAttestedPreflight({
    ...fixture.signArtifacts(report), expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  });
  assert.equal(verification.ok, false);
  assert.equal(verification.failures.includes('producer-trust-overclaim'), true);
});

test('host signature 篡改与 witness 状态嫁接 fail closed', () => {
  const fixture = createFixture();
  const artifacts = fixture.signArtifacts();
  const tampered = JSON.parse(artifacts.hostEnvelopeJson);
  tampered.signatures[0].sig = `${tampered.signatures[0].sig.slice(0, -4)}AAAA`;
  assert.throws(() => verifyCodexExternalControllerAttestedPreflight({
    ...artifacts, hostEnvelopeJson: JSON.stringify(tampered),
    expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  }), /签名验证失败|canonical base64|签名必须是 64 字节/);
  const mismatched = fixture.signArtifacts(fixture.report, (statement) => {
    statement.predicate.transition.generationAfter = 2;
    return statement;
  });
  assert.throws(() => verifyCodexExternalControllerAttestedPreflight({
    ...mismatched, expectedBindings: fixture.expectedBindings, policy: fixture.policy,
  }), /witness Statement 绑定漂移/);
});

test('trust policy 拒绝同 key 兼任 signer/witness 与非紧凑 JSON', () => {
  const fixture = createFixture();
  const reused = clone(fixture.policyRecord);
  reused.identities.witness = { ...reused.identities.signer, role: 'witness' };
  assert.throws(() => parseExternalControllerRuntimeTrustPolicy(JSON.stringify(reused)), /角色隔离/);
  assert.throws(() => parseExternalControllerRuntimeTrustPolicy(`${fixture.policyJson}\n`), /精确紧凑/);
});

test('当前用户创建的 checkout 外 0400 policy 仍不是受保护 trust root', () => {
  const fixture = createFixture();
  const root = fs.realpathSync(fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'runtime-policy-')));
  const policyPath = path.join(root, 'policy.json');
  try {
    fs.writeFileSync(policyPath, fixture.policyJson, { flag: 'wx', mode: 0o400 });
    assert.throws(() => loadExternalControllerRuntimePolicyPathCandidate({
      policyPath, expectedPolicySha256: hash(Buffer.from(fixture.policyJson)), repositoryRoot: process.cwd(),
    }), /root-owned|当前 verifier 可写/);
  } finally {
    fs.chmodSync(policyPath, 0o600); fs.unlinkSync(policyPath); fs.rmdirSync(root);
  }
});

test('stdin gate 对未保护 policy 固定脱敏失败且不回显路径或输入', () => {
  const fixture = createFixture();
  const root = fs.realpathSync(fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'runtime-gate-')));
  const policyPath = path.join(root, 'policy.json');
  const marker = 'SHOULD-NOT-APPEAR-IN-ERROR';
  try {
    fs.writeFileSync(policyPath, fixture.policyJson, { flag: 'wx', mode: 0o400 });
    const result = spawnSync(process.execPath, [
      'scripts/ci/check-ai-external-controller-preflight.mjs', '--policy', policyPath,
      '--policy-sha256', hash(Buffer.from(fixture.policyJson)),
    ], { cwd: process.cwd(), input: marker, encoding: 'utf8', timeout: 3_000, maxBuffer: 16 * 1024 });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr,
      '{"schemaVersion":1,"reportType":"codex-external-controller-attested-runtime-preflight-error","error":"external-preflight-verification-failed"}\n');
    assert.equal(result.stderr.includes(marker), false);
    assert.equal(result.stderr.includes(policyPath), false);
  } finally {
    fs.chmodSync(policyPath, 0o600); fs.unlinkSync(policyPath); fs.rmdirSync(root);
  }
});

test('pre-runtime fs 注入能伪造 path candidate，但仓内 Node gate 永不升级 trust', () => {
  const fixture = createFixture();
  const fakePath = '/usr/share/jsonutils-runtime-policy-not-installed.json';
  const policySha256 = hash(Buffer.from(fixture.policyJson));
  const fakeStat = `{dev:1n,ino:2n,mode:0o100400n,size:${Buffer.byteLength(fixture.policyJson)}n,mtimeNs:3n,ctimeNs:4n,uid:0n,nlink:1n,isFile:()=>true,isDirectory:()=>false,isSymbolicLink:()=>false}`;
  const preload = [
    "import fs from'node:fs'", `const p=${JSON.stringify(fakePath)}`,
    `const j=${JSON.stringify(fixture.policyJson)}`, `const s=${fakeStat}`,
    "const chain=new Set([p,'/usr/share','/usr','/'])",
    'const rr=fs.realpathSync,ls=fs.lstatSync,ac=fs.accessSync,rf=fs.readFileSync',
    'fs.realpathSync=x=>x===p?p:rr(x)', 'fs.lstatSync=(x,o)=>x===p?s:ls(x,o)',
    "fs.accessSync=(x,m)=>{if(chain.has(x)){const e=new Error('denied');e.code='EACCES';throw e}return ac(x,m)}",
    'fs.readFileSync=(x,o)=>x===p?j:rf(x,o)',
  ].join(';');
  const artifacts = fixture.signArtifacts();
  const request = JSON.stringify({ schemaVersion: 1,
    requestType: 'jsonutils-external-controller-attested-preflight-verification',
    ...artifacts, expectedBindings: fixture.expectedBindings });
  const result = spawnSync(process.execPath, [
    'scripts/ci/check-ai-external-controller-preflight.mjs', '--policy', fakePath,
    '--policy-sha256', policySha256,
  ], { cwd: process.cwd(), input: request, encoding: 'utf8', timeout: 3_000,
    maxBuffer: 256 * 1024, env: { ...process.env,
      NODE_OPTIONS: `--import=data:text/javascript,${encodeURIComponent(preload)}` } });
  assert.equal(result.status, 2, result.stderr);
  const verification = JSON.parse(result.stdout);
  assert.equal(verification.policyPathProtectionCandidateObserved, true);
  assert.equal(verification.trustPolicyProtected, false);
  assert.equal(verification.preRuntimeInjectionExcluded, false);
  assert.equal(verification.trustedSigners, 0);
  assert.equal(verification.registrationPreflightEligible, false);
});
