import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  collectProjectPluginLockFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLockWriter.mjs';
import {
  parseProjectPluginLockSnapshot,
  PROJECT_PLUGIN_LOCK_MAX_BYTES,
} from './aiGovernanceProjectPluginLockSource.mjs';
import { withProjectPluginCopy as withCopy } from './aiGovernanceProjectPluginTestFixtures.mjs';

const assertRejectedBeforeInventory = async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const before = fs.readFileSync(lockFile);
  assert.ok(collectProjectPluginLockFailures(root).length > 0);
  let inventoryCalls = 0;
  const report = await writeProjectPluginLockLifecycle({
    rootDir: root,
    listInventory: async () => (inventoryCalls += 1, new Set()),
  });
  assert.deepEqual(report.failures, ['PROJECT_PLUGIN_LOCK_INVALID']);
  assert.equal(inventoryCalls, 0);
  assert.deepEqual(fs.readFileSync(lockFile), before);
};

test('plugin lock 顶层、嵌套与转义等价重复 authority 必须在 inventory 前失败', async () => {
  const mutations = [
    content => content.replace(
      '  "schemaVersion": 1,',
      '  "schemaVersion": 999,\n  "schemaVersion": 1,',
    ),
    content => content.replace(
      '      "selector": "ai-infra-controller-probe@jsonutils-project",',
      '      "selector": "attacker@jsonutils-project",\n'
        + '      "\\u0073elector": "ai-infra-controller-probe@jsonutils-project",',
    ),
    content => content.replace(
      '        { "path": ".codex-plugin/plugin.json",',
      '        { "path": "attacker", "path": ".codex-plugin/plugin.json",',
    ),
  ];
  for (const mutate of mutations) await withCopy(async (root) => {
    const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
    fs.writeFileSync(lockFile, mutate(fs.readFileSync(lockFile, 'utf8')));
    await assertRejectedBeforeInventory(root);
  });
});

test('plugin lock checker 与 writer 统一拒绝超过 4 MiB 的输入', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const original = fs.readFileSync(lockFile);
  fs.writeFileSync(lockFile, Buffer.concat([
    original,
    Buffer.alloc(PROJECT_PLUGIN_LOCK_MAX_BYTES + 1 - original.length, 0x20),
  ]));
  await assertRejectedBeforeInventory(root);
}));

test('plugin lock authority parser 拒绝损坏 UTF-8 而不做替换字符容错', () => {
  const bytes = Buffer.from('{"value":"ok"}');
  bytes[10] = 0xff;
  assert.throws(() => parseProjectPluginLockSnapshot({ bytes }), /encoded data|UTF-8/);
});

test('plugin lock checker 与 writer 统一拒绝 hardlink endpoint', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  fs.linkSync(lockFile, `${lockFile}.alias`);
  await assertRejectedBeforeInventory(root);
}));
