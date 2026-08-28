import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { buildProjectPluginLock, PROJECT_PLUGIN_LOCK_PATH } from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLockWriter.mjs';
import {
  rewriteProjectPluginJson as rewriteJson,
  rewriteProjectPluginText as rewriteText,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';

const prepareVersionedChange = (root) => {
  rewriteJson(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json', (value) => {
    value.version = '0.2.3';
  });
  rewriteText(root, 'plugins/jsonutils-governance-mcp/README.md', content => (
    `${content}\nversioned change\n`
  ));
  return new Set(buildProjectPluginLock(root).plugins.flatMap(plugin => (
    plugin.files.map(file => `${plugin.source}/${file.path}`)
  )));
};

test('write-lock 获取 control 失败不得删除已接管 endpoint', () => withCopy(async (root) => {
  const controlFile = `${path.join(root, PROJECT_PLUGIN_LOCK_PATH)}.writer-lock`;
  const takeoverBytes = Buffer.from('third-party-control\n');
  const writeFileSync = fs.writeFileSync;
  let injected = false;
  fs.writeFileSync = (target, bytes, ...args) => {
    if (!injected && typeof target === 'number') {
      injected = true;
      fs.closeSync(target);
      fs.unlinkSync(controlFile);
      writeFileSync(controlFile, takeoverBytes);
      throw new Error('injected control takeover');
    }
    return writeFileSync(target, bytes, ...args);
  };
  try {
    const report = await writeProjectPluginLockLifecycle({
      rootDir: root, listInventory: async () => new Set(),
    });
    assert.deepEqual(report.failures, ['PROJECT_PLUGIN_LOCK_CONTROL_FAILED']);
    assert.deepEqual(fs.readFileSync(controlFile), takeoverBytes);
  } finally {
    fs.writeFileSync = writeFileSync;
  }
}));

test('candidate rename 后目录 fsync 失败必须恢复原 lock', () => withCopy(async (root) => {
  const inventory = prepareVersionedChange(root);
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const before = fs.readFileSync(lockFile);
  const fsyncSync = fs.fsyncSync;
  let fsyncCalls = 0;
  fs.fsyncSync = (descriptor) => {
    fsyncCalls += 1;
    if (fsyncCalls === 4) throw new Error('injected post-rename directory fsync failure');
    return fsyncSync(descriptor);
  };
  try {
    const report = await writeProjectPluginLockLifecycle({
      rootDir: root, listInventory: async () => inventory,
    });
    assert.deepEqual(report.failures, ['PROJECT_PLUGIN_LOCK_ATOMIC_WRITE_FAILED']);
    assert.deepEqual(fs.readFileSync(lockFile), before);
    assert.equal(fs.existsSync(`${lockFile}.writer-lock`), false);
  } finally {
    fs.fsyncSync = fsyncSync;
  }
}));
