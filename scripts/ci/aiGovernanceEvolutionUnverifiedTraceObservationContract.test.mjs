import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES,
  normalizeEvolutionUnverifiedTraceObservation,
  parseEvolutionUnverifiedTraceObservation,
} from './aiGovernanceEvolutionUnverifiedTraceObservationContract.mjs';

const observation = () => ({
  schemaVersion: 1,
  artifactType: 'ai-evolution-unverified-trace-observation',
  dataClass: 'redacted',
  caseId: 'mcp-fixed-tool-selection',
  method: 'model',
  trace: {
    adapter: { id: 'codex-exec-jsonl', version: '1.2.1' },
    capture: {
      status: 'complete', sampling: 'all', droppedEvents: 0,
      droppedAttributes: 0, droppedLinks: 0, flushStatus: 'succeeded',
    },
    events: [
      { sequence: 1, type: 'session.start', actorId: 'root' },
      { sequence: 2, type: 'response.finish', actorId: 'root', sha256: 'a'.repeat(64), status: 'passed' },
      { sequence: 3, type: 'session.finish', actorId: 'root', status: 'passed' },
    ],
  },
});

test('observation contract 接受精确紧凑 JSON 并返回普通副本', () => {
  const input = observation();
  assert.deepEqual(parseEvolutionUnverifiedTraceObservation(JSON.stringify(input)), input);
  assert.deepEqual(normalizeEvolutionUnverifiedTraceObservation(input), input);
  assert.equal(AI_EVOLUTION_UNVERIFIED_TRACE_OBSERVATION_MAX_BYTES, 64 * 1024);
});

test('observation contract 在每一层拒绝额外字段和敏感数据', () => {
  const mutations = [
    value => { value.extra = true; },
    value => { value.trace.extra = true; },
    value => { value.trace.adapter.extra = true; },
    value => { value.trace.capture.extra = true; },
    value => { value.trace.events[0].extra = true; },
  ];
  mutations.forEach((mutate) => {
    const input = observation(); mutate(input);
    assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(input), /闭字段|非法字段/);
  });
  const sensitive = observation(); sensitive.trace.events[0].token = 'caller-controlled';
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(sensitive), /敏感字段名/);
});

test('observation contract 拒绝非法枚举、event 数量、断序、hole 与调用方 validation', () => {
  const invalidMethod = observation(); invalidMethod.method = 'deterministic';
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(invalidMethod), /基础字段/);
  const tooFew = observation(); tooFew.trace.events.length = 2;
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(tooFew), /数量/);
  const tooMany = observation(); tooMany.trace.events = Array.from({ length: 199 }, (_, index) => ({ sequence: index + 1, type: 'response.finish' }));
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(tooMany), /数量/);
  const outOfOrder = observation(); outOfOrder.trace.events[1].sequence = 9;
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(outOfOrder), /连续递增/);
  const sparse = observation(); delete sparse.trace.events[1];
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(sparse), /必须是对象/);
  const callerValidation = observation(); callerValidation.trace.events[1].type = 'validation.start';
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(callerValidation), /不接受调用方提供/);
});

test('observation contract 对非 JSON、非紧凑与两层字节上限 fail closed', () => {
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(''), /为空或超过/);
  assert.throws(() => parseEvolutionUnverifiedTraceObservation('{'), /不是合法 JSON/);
  assert.throws(() => parseEvolutionUnverifiedTraceObservation(JSON.stringify(observation(), null, 2)), /精确紧凑/);
  assert.throws(() => parseEvolutionUnverifiedTraceObservation('x'.repeat(64 * 1024 + 1)), /为空或超过/);
  const nonJson = observation(); nonJson.trace.events[0].keys = [1n];
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(nonJson), /不是合法 JSON 值/);
  const oversized = observation(); oversized.trace.events[0].path = 'x'.repeat(64 * 1024);
  assert.throws(() => normalizeEvolutionUnverifiedTraceObservation(oversized), /超过 64 KiB/);
});
