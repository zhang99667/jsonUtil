import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  collectEvolutionSensitiveFieldFailures,
  collectEvolutionSensitiveValueFailures,
} from './aiGovernanceEvolutionSensitiveData.mjs';

test('evolution sensitive scan 返回固定无值诊断', () => {
  const marker = 'authorizationSecretMarker';
  assert.deepEqual(
    collectEvolutionSensitiveFieldFailures({ [marker]: 'redacted' }, 'fixture'),
    ['fixture: 禁止敏感字段名'],
  );
  assert.deepEqual(
    collectEvolutionSensitiveValueFailures(`Bearer ${'x'.repeat(16)}`, 'fixture'),
    ['fixture: 禁止疑似凭据值'],
  );
  assert.equal(collectEvolutionSensitiveFieldFailures({ [marker]: marker }, 'fixture').join('\n').includes(marker), false);
});

test('evolution sensitive scan 对深度、节点数和循环引用 fail closed', () => {
  const deep = {};
  let cursor = deep;
  for (let depth = 0; depth < 65; depth += 1) {
    cursor.child = {};
    cursor = cursor.child;
  }
  assert.deepEqual(
    collectEvolutionSensitiveFieldFailures(deep, 'fixture'),
    ['fixture: 隐私扫描结构超过 64 层或 10000 节点'],
  );

  const wide = Array.from({ length: 10_001 }, () => null);
  assert.deepEqual(
    collectEvolutionSensitiveValueFailures(wide, 'fixture'),
    ['fixture: 隐私扫描结构超过 64 层或 10000 节点'],
  );

  const cyclic = {};
  cyclic.self = cyclic;
  assert.deepEqual(collectEvolutionSensitiveFieldFailures(cyclic, 'fixture'), []);
});
