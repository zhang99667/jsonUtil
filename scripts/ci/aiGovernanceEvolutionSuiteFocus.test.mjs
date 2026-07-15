import assert from 'node:assert/strict';
import { test } from 'node:test';

import { buildAiGovernanceEvolutionSuiteFocus } from './aiGovernanceEvolutionSuiteFocus.mjs';

const namedFocus = id => ({ id, nextAction: `next:${id}`, caseIds: [`case:${id}`] });
const buildInput = ({
  baseFailures = [],
  baseFocus = namedFocus('base'),
  learningFailures = [],
  learningFocus = namedFocus('learning'),
  graderOk = true,
  componentCaseId = 'grader-case',
} = {}) => ({
  base: { failures: baseFailures, nextFocus: baseFocus },
  learning: { failures: learningFailures, nextFocus: learningFocus },
  graderHealth: {
    ok: graderOk,
    bindings: componentCaseId === null ? {} : { componentCase: { id: componentCaseId } },
  },
});

test('suite focus 以 learning contract failure 覆盖其余失败信号', () => {
  const focus = buildAiGovernanceEvolutionSuiteFocus(buildInput({
    baseFailures: ['base failed'], learningFailures: ['learning failed'], graderOk: false,
  }));
  assert.deepEqual(focus, {
    id: 'fix-learning-contract',
    nextAction: '修复 feedback/experiment 数据契约',
    caseIds: [],
  });
  assert.deepEqual(Object.keys(focus), ['id', 'nextAction', 'caseIds']);
});

test('suite focus 以 grader failure 覆盖 base failure 并过滤缺失 case binding', () => {
  const focus = buildAiGovernanceEvolutionSuiteFocus(buildInput({ baseFailures: ['base failed'], graderOk: false }));
  assert.deepEqual(focus, {
    id: 'fix-grader-calibration',
    nextAction: '修复生产 grader 的独立校准契约或分类漂移',
    caseIds: ['grader-case'],
  });
  assert.deepEqual(Object.keys(focus), ['id', 'nextAction', 'caseIds']);
  assert.deepEqual(buildAiGovernanceEvolutionSuiteFocus(buildInput({ graderOk: false, componentCaseId: '' })).caseIds, []);
  assert.deepEqual(buildAiGovernanceEvolutionSuiteFocus(buildInput({ graderOk: false, componentCaseId: null })).caseIds, []);
});

test('suite focus 在 base failure 时保持原焦点引用', () => {
  const baseFocus = namedFocus('record-first-outcomes');
  const focus = buildAiGovernanceEvolutionSuiteFocus(buildInput({
    baseFailures: ['base failed'], baseFocus, learningFocus: namedFocus('must-not-win'),
  }));
  assert.strictEqual(focus, baseFocus);
});

test('suite focus 只把两个 outcome coverage 焦点切换到 learning', () => {
  for (const id of ['increase-outcome-coverage', 'record-first-outcomes']) {
    const learningFocus = namedFocus(`learning-for-${id}`);
    const focus = buildAiGovernanceEvolutionSuiteFocus(buildInput({ baseFocus: namedFocus(id), learningFocus }));
    assert.strictEqual(focus, learningFocus);
  }
});

test('suite focus 对其它或空 base 焦点保持透传', () => {
  for (const baseFocus of [namedFocus('refresh-stale-deterministic-evidence'), null]) {
    const focus = buildAiGovernanceEvolutionSuiteFocus(buildInput({ baseFocus }));
    assert.strictEqual(focus, baseFocus);
  }
});
