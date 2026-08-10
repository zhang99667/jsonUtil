import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  AI_EVOLUTION_PAIRED_ASSIGNMENT_PREDICATE_TYPE,
  AI_EVOLUTION_PAIRED_BATCH_PREDICATE_TYPE,
  AI_EVOLUTION_PAIRED_CHECKPOINT_PREDICATE_TYPE,
  buildEvolutionPairedAssignmentStatement,
  buildEvolutionPairedBatchStatement,
  buildEvolutionPairedCheckpointStatement,
  hashEvolutionPairedGrade,
  hashEvolutionPairedGradeSet,
  hashEvolutionPairedValue,
} from './aiGovernanceEvolutionPairedReceiptV4Commitments.mjs';

const digest = value => value.repeat(64);
const sharedBinding = {
  experimentRef: { id: 'exp' },
  caseRef: { id: 'case' },
  fixtureRef: { path: 'fixture' },
  environmentRef: { revision: 'rev' },
  policyRef: { id: 'policy' },
  rubricSha256: digest('a'),
};
const batch = {
  schemaVersion: 1,
  artifactType: 'ai-evolution-paired-trial-batch',
  dataClass: 'synthetic',
  ...sharedBinding,
  assignment: { nonce: 'nonce', trials: [{ trialId: 'trial-1', arm: 'candidate' }] },
  checkpoint: {
    gradeCount: 2,
    gradeSetSha256: digest('b'),
    assignmentEnvelopeSha256: digest('c'),
  },
  trialResults: [
    {
      trialId: 'trial-1', pair: 1, arm: 'candidate', executionOrdinal: 2,
      blindAlias: 'b-beta', resultSha256: digest('d'), gradeSha256: digest('e'),
    },
    {
      trialId: 'trial-0', pair: 1, arm: 'baseline', executionOrdinal: 1,
      blindAlias: 'b-alpha', resultSha256: digest('f'), gradeSha256: digest('0'),
    },
  ],
  proof: {
    assignmentEnvelope: 'assignment-envelope',
    checkpointEnvelope: 'checkpoint-envelope',
  },
};

test('paired v4 commitments 使用固定域分离与 grade 投影', () => {
  assert.equal(
    hashEvolutionPairedValue('domain-a', { value: 1 }),
    'b880f452abbeaf1e6ab539416533f1ec1cdc317165db1fba4b408e59661cf22f',
  );
  assert.notEqual(
    hashEvolutionPairedValue('domain-a', { value: 1 }),
    hashEvolutionPairedValue('domain-b', { value: 1 }),
  );
  assert.equal(hashEvolutionPairedGrade({
    status: 'graded', verdict: 'pass', score: 100, reasonCodes: [], ignored: true,
  }), '9d0a99ea52a70236cdb493f46d974e90ed99c0f713f52a7a4203ece79248d2bb');
  assert.equal(
    hashEvolutionPairedGradeSet(batch.trialResults),
    'efe910b34fa5e7bc785b7dd8d371d2e11fe1fc6f7457999e93ade7d5ac420906',
  );
});

test('paired v4 assignment/checkpoint/final Statement 精确绑定当前 batch', () => {
  const assignment = buildEvolutionPairedAssignmentStatement(batch);
  assert.deepEqual(assignment, {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [{
      name: 'ai-evolution-paired-trial-assignment',
      digest: { sha256: '62d8cb87f6bce2566a1e33da24b4a42281a2aebd19ab361893525a3822f822a5' },
    }],
    predicateType: AI_EVOLUTION_PAIRED_ASSIGNMENT_PREDICATE_TYPE,
    predicate: {
      protocolVersion: '1.0.0', role: 'pre-execution-arm-assignment',
      ...sharedBinding, assignment: batch.assignment,
    },
  });
  assert.deepEqual(buildEvolutionPairedCheckpointStatement(batch), {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [{ name: 'ai-evolution-paired-grade-set', digest: { sha256: digest('b') } }],
    predicateType: AI_EVOLUTION_PAIRED_CHECKPOINT_PREDICATE_TYPE,
    predicate: {
      protocolVersion: '1.0.0', role: 'pre-unblind-grade-checkpoint',
      ...sharedBinding,
      gradeSet: { count: 2, sha256: digest('b') },
      assignmentEnvelopeSha256: digest('c'),
    },
  });
  assert.deepEqual(buildEvolutionPairedBatchStatement(batch), {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [{
      name: 'ai-evolution-paired-trial-batch',
      digest: { sha256: '6ddd8201987135c9e5df516fb56412a59c9a8d6ec28dac3ec7ee75ce29ea52a7' },
    }],
    predicateType: AI_EVOLUTION_PAIRED_BATCH_PREDICATE_TYPE,
    predicate: {
      protocolVersion: '1.0.0', role: 'paired-batch-finalizer',
      ...sharedBinding,
      assignmentEnvelopeSha256: '186de618b6b776f310b86fc4b3af119417f1e3d4af2582c1dcbd9c463a658b16',
      checkpointEnvelopeSha256: '1efb7cb7758a12722c201e808f588614daeb394b0483fa7d88b89e101e54f402',
      trialMapSha256: '8e13cf473425af73bafa7426d15b074908b2ca76834547410cb208d4ade922c6',
    },
  });
});

test('proof 验证模块不再代理 commitment API', () => {
  const source = fs.readFileSync(
    new URL('./aiGovernanceEvolutionPairedReceiptV4Proof.mjs', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(source, /^export[^\n]*hashEvolutionPaired/m);
  assert.doesNotMatch(source, /^export[^\n]*buildEvolutionPaired/m);
});
