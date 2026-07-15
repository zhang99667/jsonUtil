import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { buildProjectPluginLock, PROJECT_PLUGIN_LOCK_PATH } from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLifecycle.mjs';
import {
  rewriteProjectPluginJson as rewriteJson,
  rewriteProjectPluginText as rewriteText,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';

const inventoryFor = root => new Set(buildProjectPluginLock(root).plugins.flatMap(plugin => (
  plugin.files.map(file => `${plugin.source}/${file.path}`)
)));

test('write-lock 原子替换后的 source race 必须回滚原 lock', () => withCopy(async (root) => {
  const manifestFile = 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json';
  const sourceFile = 'plugins/jsonutils-governance-mcp/README.md';
  rewriteJson(root, manifestFile, value => { value.version = '0.2.2'; });
  rewriteText(root, sourceFile, content => `${content}\nversioned change\n`);
  const inventory = inventoryFor(root);
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  fs.writeFileSync(lockFile, JSON.stringify(JSON.parse(fs.readFileSync(lockFile, 'utf8'))));
  const before = fs.readFileSync(lockFile);
  const canonicalLockFile = fs.realpathSync(lockFile);
  const renameSync = fs.renameSync;
  let injected = false;
  fs.renameSync = (source, destination) => {
    renameSync(source, destination);
    if (!injected && fs.realpathSync(destination) === canonicalLockFile) {
      injected = true;
      fs.appendFileSync(path.join(root, sourceFile), '\npost-rename race\n');
    }
  };
  try {
    const report = await writeProjectPluginLockLifecycle({
      rootDir: root, listInventory: async () => inventory,
    });
    assert.equal(injected, true);
    assert.deepEqual(report.failures, ['PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE']);
    assert.deepEqual(fs.readFileSync(lockFile), before);
  } finally {
    fs.renameSync = renameSync;
  }
}));
