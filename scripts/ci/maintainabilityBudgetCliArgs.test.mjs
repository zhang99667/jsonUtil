import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseMaintainabilityBudgetCliArgs } from './maintainabilityBudgetCliArgs.mjs';

test('可维护性预算 CLI 参数支持 top 和 threshold 的等号写法', () => {
  assert.deepEqual(parseMaintainabilityBudgetCliArgs(['--top=5', '--threshold=85']), {
    highUsageLimit: 5,
    highUsageMinRatio: 0.85,
    printAllSummaries: false,
  });
});

test('可维护性预算 CLI 参数支持空格写法和关闭候选输出', () => {
  assert.deepEqual(parseMaintainabilityBudgetCliArgs(['--top', '0', '--threshold', '0.75']), {
    highUsageLimit: 0,
    highUsageMinRatio: 0.75,
    printAllSummaries: false,
  });
});

test('可维护性预算 CLI 参数支持单独关闭全量输出', () => {
  assert.deepEqual(parseMaintainabilityBudgetCliArgs(['--no-all']), {
    printAllSummaries: false,
  });
});
