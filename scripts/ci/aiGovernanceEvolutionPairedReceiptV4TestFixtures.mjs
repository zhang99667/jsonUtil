import { generateKeyPairSync, sign as signBytes } from 'node:crypto';
import path from 'node:path';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';
import { readEvolutionExperiments } from './aiGovernanceEvolutionExperiments.mjs';
import {
  buildEvolutionPairedCaseRef,
  buildEvolutionPairedExperimentRef,
  hashEvolutionPairedRubric,
} from './aiGovernanceEvolutionPairedReceiptV4.mjs';
import { buildEvolutionPairedExpectedAssignments } from './aiGovernanceEvolutionPairedReceiptV4Assignment.mjs';
import {
  buildEvolutionPairedAssignmentStatement,
  buildEvolutionPairedBatchStatement,
  buildEvolutionPairedCheckpointStatement,
  hashEvolutionPairedGrade,
  hashEvolutionPairedGradeSet,
} from './aiGovernanceEvolutionPairedReceiptV4Proof.mjs';
import { buildEvolutionTracePolicyRegistry } from './aiGovernanceEvolutionTracePolicies.mjs';
import { createDssePreAuthEncoding } from './aiGovernanceEvolutionTraceProof.mjs';
import {
  hashRegistrationCanaryExactBytes,
  REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE,
} from './aiGovernanceRegistrationCanaryDsseEnvelope.mjs';
import { resolveEvolutionWorktreeRevision } from './aiGovernanceEvolutionWorktreeRevision.mjs';

const CASE_ID = 'skill-jsonutils-ai-infra-evolver-trigger';
const EXPERIMENT_ID = 'skill-evolver-fresh-context-paired';
const digest = value => value.toString(16).padStart(64, '0').slice(-64);

const createSigner = (keyid) => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  return { keyid, publicKey, privateKey };
};

const signStatement = (statement, signer) => {
  const payloadBytes = Buffer.from(JSON.stringify(statement), 'utf8');
  const signature = signBytes(
    null,
    createDssePreAuthEncoding(REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE, payloadBytes),
    signer.privateKey,
  );
  return JSON.stringify({
    payloadType: REGISTRATION_CANARY_DSSE_PAYLOAD_TYPE,
    payload: payloadBytes.toString('base64'),
    signatures: [{ keyid: signer.keyid, sig: signature.toString('base64') }],
  });
};

const traceFor = ({ arm, policyEntry, caseRef, revision, responseSha256 }) => {
  const actorId = 'root-agent';
  const events = [
    { type: 'session.start', actorId },
    ...(policyEntry.policy.requiredReads ?? [])
      .filter(read => arm === 'candidate' || !read.path.endsWith('/SKILL.md'))
      .map(read => ({
      type: 'context.read', actorId, path: read.path, sha256: read.sha256,
      })),
    {
      type: 'skill.decision', actorId,
      name: policyEntry.policy.requiredSkillDecision.name,
      status: arm === 'candidate' ? 'selected' : 'skipped',
    },
    { type: 'response.finish', actorId, sha256: responseSha256, status: 'passed' },
    { type: 'session.finish', actorId, status: 'passed' },
  ].map((event, index) => ({ sequence: index + 1, ...event }));
  return {
    schemaVersion: 1,
    adapter: structuredClone(policyEntry.policy.adapter),
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    caseSha256: caseRef.sha256,
    policy: structuredClone(policyEntry.descriptor),
    beforeRevision: revision,
    afterRevision: revision,
    events,
  };
};

const executionFor = index => ({
  modelId: 'gpt-5',
  cliVersion: '1.0.0',
  binarySha256: digest(100),
  stdoutSha256: digest(200 + index),
  exitCode: 0,
  stdoutDrained: true,
  timedOut: false,
  binaryStable: true,
  execArgsSha256: digest(300),
  adapterBundleSha256: digest(400),
  leaseKeySha256: digest(500 + index),
  taskInstanceSha256: digest(600 + index),
  leaseAcquireCount: 1,
  executionCount: 1,
  retryCount: 0,
  freshTaskObserved: true,
  armIsolationObserved: true,
  artifactBindingsStable: true,
  ledgerBindingsStable: true,
});

export const resignEvolutionPairedBatchFixture = (batch, signers) => {
  batch.proof.assignmentEnvelope = signStatement(
    buildEvolutionPairedAssignmentStatement(batch), signers.assignment,
  );
  batch.checkpoint.assignmentEnvelopeSha256 = hashRegistrationCanaryExactBytes(
    Buffer.from(batch.proof.assignmentEnvelope, 'utf8'),
  );
  batch.checkpoint.gradeSetSha256 = hashEvolutionPairedGradeSet(batch.trialResults);
  batch.proof.checkpointEnvelope = signStatement(
    buildEvolutionPairedCheckpointStatement(batch), signers.checkpoint,
  );
  return resignEvolutionPairedFinalBatchFixture(batch, signers);
};

export const resignEvolutionPairedFinalBatchFixture = (batch, signers) => {
  batch.proof.batchEnvelope = signStatement(
    buildEvolutionPairedBatchStatement(batch), signers.batch,
  );
  return batch;
};

export const buildEvolutionPairedBatchFixture = ({
  rootDir,
  signers = {
    assignment: createSigner('external-assignment-key'),
    checkpoint: createSigner('external-checkpoint-key'),
    batch: createSigner('external-batch-key'),
  },
} = {}) => {
  const revision = resolveEvolutionWorktreeRevision(rootDir);
  const corpusResult = readEvolutionEvalCorpus(path.join(rootDir, 'evals/ai-governance/cases.json'));
  if (corpusResult.failures.length > 0) throw new Error(corpusResult.failures[0]);
  const casesById = new Map(corpusResult.cases.map(item => [item.id, item]));
  const experiments = readEvolutionExperiments(
    path.join(rootDir, 'evals/ai-governance/experiments.json'), { casesById },
  );
  if (experiments.failures.length > 0) throw new Error(experiments.failures[0]);
  const policies = buildEvolutionTracePolicyRegistry({ rootDir });
  if (policies.failures.length > 0) throw new Error(policies.failures[0]);
  const caseItem = casesById.get(CASE_ID);
  const experiment = experiments.experiments.find(item => item.id === EXPERIMENT_ID);
  const policyEntry = policies.policiesByCaseId.get(CASE_ID);
  const caseRef = buildEvolutionPairedCaseRef({ corpus: corpusResult.corpus, caseItem });
  const trialResults = experiment.design.trialPlan.map((plan, index) => {
    const resultSha256 = digest(700 + index);
    const grade = { status: 'graded', verdict: 'pass', score: 100, reasonCodes: ['rubric-pass'] };
    return {
      trialId: plan.id,
      pair: plan.pair,
      arm: plan.arm,
      executionOrdinal: index + 1,
      blindAlias: `b-${(800 + index).toString(16).padStart(16, '0')}`,
      resultSha256,
      gradeSha256: hashEvolutionPairedGrade(grade),
      infrastructure: { status: 'valid', reasonCodes: [] },
      grade,
      execution: executionFor(index),
      trace: traceFor({
        arm: plan.arm, policyEntry, caseRef, revision, responseSha256: resultSha256,
      }),
    };
  });
  const batch = {
    schemaVersion: 1,
    artifactType: 'ai-evolution-paired-trial-batch',
    dataClass: 'redacted',
    experimentRef: buildEvolutionPairedExperimentRef({ manifest: experiments.manifest, experiment }),
    caseRef,
    fixtureRef: structuredClone(experiment.fixtureRef),
    environmentRef: { sha256: digest(900), manifestSha256: digest(901), revision },
    policyRef: structuredClone(policyEntry.descriptor),
    rubricSha256: hashEvolutionPairedRubric(caseItem),
    assignment: { schemaVersion: 1, batchNonce: digest(950), trialAssignments: [] },
    checkpoint: {
      schemaVersion: 1, gradeCount: 6, gradeSetSha256: digest(0),
      assignmentEnvelopeSha256: digest(0),
    },
    trialResults,
    proof: { assignmentEnvelope: '', checkpointEnvelope: '', batchEnvelope: '' },
  };
  batch.assignment.trialAssignments = buildEvolutionPairedExpectedAssignments({ batch, experiment });
  resignEvolutionPairedBatchFixture(batch, signers);
  return {
    batch,
    signers,
    pairedTrustPolicy: {
      assignmentTrustedSigners: new Map([[signers.assignment.keyid, signers.assignment.publicKey]]),
      checkpointTrustedSigners: new Map([[signers.checkpoint.keyid, signers.checkpoint.publicKey]]),
      batchTrustedSigners: new Map([[signers.batch.keyid, signers.batch.publicKey]]),
    },
    context: { revision, corpusResult, experiments, experiment, caseItem, policyEntry },
  };
};
