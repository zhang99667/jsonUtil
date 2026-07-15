import { createHash, generateKeyPairSync, sign as signBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { createDssePreAuthEncoding } from './aiGovernanceEvolutionTraceProof.mjs';
import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';
import { buildRegistrationCanaryAnchorStatement } from './aiGovernanceRegistrationCanaryAnchorReceipt.mjs';
import {
  REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE,
  hashRegistrationCanaryEd25519PublicKey,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import {
  buildRegistrationCanaryAuthorizationStatement,
} from './aiGovernanceRegistrationCanaryDisclosureAuthorization.mjs';
import {
  buildRegistrationCanaryConsumptionStatement,
  buildRegistrationCanaryRedemptionRequest,
} from './aiGovernanceRegistrationCanaryDisclosureConsumption.mjs';
import { buildRegistrationCanaryGradeCheckpointRequest } from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import {
  buildRegistrationCanaryPacketBundle,
  hashRegistrationCanaryPacketValue,
} from './aiGovernanceRegistrationCanaryPacket.mjs';
import { sealRegistrationCanaryBlindGradeSet } from './aiGovernanceRegistrationCanaryReview.mjs';

const rootDir = path.resolve(import.meta.dirname, '../..');
const corpus = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/cases.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'evals/ai-governance/experiments.json'), 'utf8'));
const caseItem = corpus.cases.find(item => item.id === 'mcp-project-registration-discovery');
const experiment = manifest.experiments.find(item => item.id === 'mcp-project-registration-canary');
const policyEntry = buildEvolutionTracePolicyRegistry({ rootDir }).policiesByCaseId.get(caseItem.id);
const fixtureRevision = resolveEvolutionWorktreeRevision(rootDir);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const repeatedDigest = character => character.repeat(64);
const executionOrder = [
  'mcp-registration-p1-baseline', 'mcp-registration-p1-candidate',
  'mcp-registration-p2-candidate', 'mcp-registration-p2-baseline',
  'mcp-registration-p3-baseline', 'mcp-registration-p3-candidate',
];
const packetPrivacy = {
  sourceUserContentStored: false,
  reasoningStored: false,
  toolPayloadStored: false,
  authMaterialStored: false,
  userConfigStored: false,
  absoluteUserPathStored: false,
};
const gradePrivacy = {
  ...packetPrivacy,
  responseBodyStored: false,
  traceBodyStored: false,
  armStored: false,
  rubricStored: false,
};
const recordPrivacy = {
  ...packetPrivacy,
  responseBodyStored: false,
  traceBodyStored: false,
};
const ledger = (name, character) => ({
  path: `evals/ai-governance/${name}`,
  records: 1,
  headSequence: 1,
  headSha256: repeatedDigest(character),
  fileSha256: repeatedDigest(character),
});
const bindings = {
  fixtureRevision,
  artifacts: {
    caseDescriptor: { path: 'evals/ai-governance/cases.json', sha256: repeatedDigest('a') },
    experimentDescriptor: { path: 'evals/ai-governance/experiments.json', sha256: repeatedDigest('b') },
    projectMcp: { path: '.mcp.json', sha256: repeatedDigest('c') },
    projectHooks: { path: '.codex/hooks.json', sha256: repeatedDigest('d') },
  },
  ledgers: {
    outcomes: ledger('outcomes.jsonl', 'e'),
    receipts: ledger('trial-receipts.jsonl', 'f'),
    feedback: ledger('feedback-inbox.jsonl', '1'),
  },
};
const rubricSha256 = hashRegistrationCanaryPacketValue('jsonutils.registration-canary.rubric/v1', {
  expectedOutcome: caseItem.expectedOutcome,
  graders: caseItem.graders,
});

const signStatement = (statement, signer) => {
  const payloadBytes = Buffer.from(JSON.stringify(statement), 'utf8');
  const pae = createDssePreAuthEncoding(REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE, payloadBytes);
  return JSON.stringify({
    payloadType: REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE,
    payload: payloadBytes.toString('base64'),
    signatures: [{
      keyid: signer.keyid,
      sig: signBytes(null, pae, signer.privateKey).toString('base64'),
    }],
  });
};

const createSigner = keyid => ({ keyid, ...generateKeyPairSync('ed25519') });

export const createRegistrationCanaryAnchorProtocolFixture = () => {
  const packetBundles = executionOrder.map(trialId => buildRegistrationCanaryPacketBundle({
    corpusVersion: corpus.corpusVersion,
    manifestVersion: manifest.manifestVersion,
    caseItem,
    experiment,
    trialId,
    runNonce: repeatedDigest('3'),
    environmentSha256: repeatedDigest('2'),
    bindings,
  }));
  const blindGrades = packetBundles.map((bundle, index) => ({
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-blind-grade',
    dataClass: 'redacted',
    gradeVersion: '1.0.0',
    blindTrialAlias: bundle.agent.blindTrialAlias,
    bindings: {
      agentPacketSha256: bundle.host.projectionDigests.agentSha256,
      graderPacketSha256: bundle.host.projectionDigests.graderSha256,
      fixtureRevision,
      environmentSha256: bundle.host.bindings.environmentSha256,
      observationSha256: sha256(`observation-${index}`),
      traceSha256: sha256(`trace-${index}`),
    },
    resultSha256: sha256(`result-${index}`),
    rubricSha256,
    grade: { status: 'graded', verdict: 'pass', score: 100 },
    reasonCodes: ['registration-and-tool-discovered'],
    traceReview: { structureStatus: 'accepted', completenessStatus: 'complete', policyStatus: 'verified' },
    claims: {
      armKnown: false,
      callerVerdictAccepted: false,
      automaticLedgerWrites: false,
      outcomeEligible: false,
      trusted: false,
    },
    privacy: { ...gradePrivacy },
  }));
  const gradeSet = sealRegistrationCanaryBlindGradeSet(blindGrades);
  const checkpointRequest = buildRegistrationCanaryGradeCheckpointRequest({
    gradeSet,
    blindGrades,
    caseItem,
    experimentRef: { id: experiment.id, manifestVersion: manifest.manifestVersion },
    policyEntry,
    expectedFixtureRevision: fixtureRevision,
  });
  const checkpointRequestJson = JSON.stringify(checkpointRequest);
  const hostRunRecords = packetBundles.map((bundle, index) => ({
    schemaVersion: 1,
    artifactType: 'ai-registration-canary-host-run-record',
    dataClass: 'redacted',
    recordVersion: '1.0.0',
    blindTrialAlias: bundle.host.blindTrialAlias,
    hostPacketSha256: hashRegistrationCanaryPacketValue('jsonutils.registration-canary.host-packet/v1', bundle.host),
    hostBindingsSha256: hashRegistrationCanaryPacketValue('jsonutils.registration-canary.host-bindings/v1', bundle.host.bindings),
    leaseKeySha256: bundle.host.lease.keySha256,
    taskInstanceSha256: sha256(`task-${index}`),
    executionOrdinal: bundle.host.trial.executionOrdinal,
    leaseAcquireCount: 1,
    executionCount: 1,
    retryCount: 0,
    freshTaskObserved: true,
    armIsolationObserved: true,
    registryObserved: true,
    pluginStateObserved: bundle.host.treatment.personalPluginExpectedEnabled ? 'enabled' : 'disabled',
    artifactBindingsStable: true,
    ledgerBindingsStable: true,
    claims: {
      executionReported: true,
      executionVerified: false,
      automaticLedgerWrites: false,
      outcomeEligible: false,
    },
    privacy: { ...recordPrivacy },
  }));
  const hostRunRecordJsons = hostRunRecords.map(JSON.stringify);
  const signers = {
    anchor: createSigner('external-anchor-key'),
    authorization: createSigner('external-authorization-key'),
    consumer: createSigner('external-consumer-key'),
  };
  const anchorStatement = buildRegistrationCanaryAnchorStatement({
    checkpointRequestJson,
    batchId: `batch-${'4'.repeat(32)}`,
    authority: { id: 'external-checkpoint-authority', epoch: 'epoch-1' },
    controller: {
      bundleSha256: repeatedDigest('5'),
      policy: { id: 'external-anchor-policy', version: '1.0.0', sha256: repeatedDigest('6') },
    },
  });
  const anchorReceiptJson = signStatement(anchorStatement, signers.anchor);
  const anchorExpectedBindings = {
    batchId: anchorStatement.predicate.batchId,
    authority: structuredClone(anchorStatement.predicate.authority),
    controller: structuredClone(anchorStatement.predicate.controller),
    signerKeyId: signers.anchor.keyid,
    signerPublicKeySha256: hashRegistrationCanaryEd25519PublicKey(signers.anchor.publicKey),
  };
  const authorizationStatement = buildRegistrationCanaryAuthorizationStatement({
    checkpointRequestJson,
    anchorReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    grantId: `grant-${'7'.repeat(32)}`,
    senderConstraint: {
      type: 'ed25519-spki-sha256',
      thumbprintSha256: hashRegistrationCanaryEd25519PublicKey(signers.consumer.publicKey),
    },
    policy: { id: 'external-disclosure-policy', version: '1.0.0', sha256: repeatedDigest('9') },
  });
  const authorizationReceiptJson = signStatement(authorizationStatement, signers.authorization);
  const redemptionRequest = buildRegistrationCanaryRedemptionRequest({
    checkpointRequestJson,
    anchorReceiptJson,
    authorizationReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    nonceSha256: repeatedDigest('0'),
  });
  const redemptionRequestJson = JSON.stringify(redemptionRequest);
  const consumptionStatement = buildRegistrationCanaryConsumptionStatement({
    checkpointRequestJson,
    anchorReceiptJson,
    authorizationReceiptJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    redemptionRequestJson,
    policy: { id: 'external-consumption-policy', version: '1.0.0', sha256: repeatedDigest('a') },
  });
  const consumptionReceiptJson = signStatement(consumptionStatement, signers.consumer);
  return {
    checkpointRequestJson,
    packetBundles,
    blindGrades,
    hostRunRecordJsons,
    signers,
    anchorStatement,
    anchorReceiptJson,
    anchorExpectedBindings,
    authorizationStatement,
    authorizationReceiptJson,
    redemptionRequest,
    redemptionRequestJson,
    consumptionStatement,
    consumptionReceiptJson,
    signStatement,
  };
};
