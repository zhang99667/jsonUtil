import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES,
  normalizeEvolutionPairedBatchArtifact,
  parseEvolutionPairedBatchArtifact,
} from './aiGovernanceEvolutionPairedReceiptV4BatchContract.mjs';
import {
  buildEvolutionPairedBatchFixture,
} from './aiGovernanceEvolutionPairedReceiptV4TestFixtures.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('paired v4 batch contract 接受精确紧凑 JSON 并归一化对象', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  const compact = JSON.stringify(fixture.batch);

  assert.equal(AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES, 512 * 1024);
  assert.deepEqual(parseEvolutionPairedBatchArtifact(compact), fixture.batch);
  assert.deepEqual(normalizeEvolutionPairedBatchArtifact(fixture.batch), fixture.batch);
  assert.notEqual(normalizeEvolutionPairedBatchArtifact(fixture.batch), fixture.batch);
});

test('paired v4 batch contract 拒绝 pretty JSON、额外字段和疑似凭据值', () => {
  const fixture = buildEvolutionPairedBatchFixture({ rootDir });
  assert.throws(() => parseEvolutionPairedBatchArtifact(
    JSON.stringify(fixture.batch, null, 2),
  ), /精确紧凑 JSON/);
  assert.throws(() => parseEvolutionPairedBatchArtifact(JSON.stringify({
    ...fixture.batch, verdict: 'pass',
  })), /闭字段/);

  const sensitive = structuredClone(fixture.batch);
  sensitive.trialResults[0].trace.events[0].status = 'Bearer abcdefghijklmnop';
  assert.throws(() => parseEvolutionPairedBatchArtifact(JSON.stringify(sensitive)), /疑似凭据值/);
});

test('paired v4 batch contract 拒绝超限和不可序列化对象', () => {
  assert.throws(() => parseEvolutionPairedBatchArtifact(
    ' '.repeat(AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES + 1),
  ), /至多/);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.throws(() => normalizeEvolutionPairedBatchArtifact(cyclic), /不是合法 JSON 值/);
});

test('paired v4 verifier 不代理 batch contract API', async () => {
  const verifier = await import('./aiGovernanceEvolutionPairedReceiptV4.mjs');
  assert.equal('AI_EVOLUTION_PAIRED_RECEIPT_V4_MAX_BYTES' in verifier, false);
  assert.equal('parseEvolutionPairedBatchArtifact' in verifier, false);
  assert.equal('normalizeEvolutionPairedBatchArtifact' in verifier, false);
});
