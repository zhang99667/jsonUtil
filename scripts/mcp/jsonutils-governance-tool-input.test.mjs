import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertJsonutilsGovernanceToolInput,
  JsonutilsGovernanceToolInputError,
} from './jsonutils-governance-tool-input.mjs';

test('MCP tool input validator accepts declared defaults and bounded integers', () => {
  assert.equal(assertJsonutilsGovernanceToolInput('ai_evaluation_summary', {}).name, 'ai_evaluation_summary');
  assert.equal(assertJsonutilsGovernanceToolInput('ai_evaluation_summary', { limit: 50 }).name, 'ai_evaluation_summary');
});

test('MCP tool input validator rejects unknown tools, extra fields and out-of-range values', () => {
  const invalidCalls = [
    ['unknown-tool', {}],
    ['ai_evaluation_summary', { limit: 0 }],
    ['ai_evaluation_summary', { limit: 1, extra: true }],
    ['ai_evaluation_summary', []],
  ];
  invalidCalls.forEach(([name, args]) => assert.throws(
    () => assertJsonutilsGovernanceToolInput(name, args),
    JsonutilsGovernanceToolInputError,
  ));
});
