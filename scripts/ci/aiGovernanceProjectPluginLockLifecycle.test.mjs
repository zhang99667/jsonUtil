import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildProjectPluginLock,
  collectProjectPluginLockFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLockWriter.mjs';
import { withProjectPluginCopy as withCopy } from './aiGovernanceProjectPluginTestFixtures.mjs';

const inventoryFor = root => new Set(buildProjectPluginLock(root).plugins.flatMap(plugin => (
  plugin.files.map(file => `${plugin.source}/${file.path}`)
)));

test('write-lock 非法 rootDir 返回脱敏 blocked 报告且 inventory 零调用', async () => {
  for (const rootDir of [undefined, '/private/sensitive-project']) {
    let inventoryCalls = 0;
    const report = await writeProjectPluginLockLifecycle({
      rootDir, listInventory: async () => (inventoryCalls += 1, new Set()),
    });
    assert.equal(report.marketplace.expectedRoot, '<invalid-project-root>');
    assert.equal(JSON.stringify(report).includes('sensitive-project'), false);
    assert.deepEqual(report.failures, ['PROJECT_ROOT_INVALID']);
    assert.equal(inventoryCalls, 0);
  }
});

test('write-lock 的合作式 control lock 拒绝第二个并发 writer', () => withCopy(async (root) => {
  const inventory = inventoryFor(root);
  let entered;
  let release;
  const enteredPromise = new Promise(resolve => { entered = resolve; });
  const releasePromise = new Promise(resolve => { release = resolve; });
  const first = writeProjectPluginLockLifecycle({ rootDir: root, listInventory: async () => {
    entered();
    await releasePromise;
    return inventory;
  } });
  await enteredPromise;
  let secondInventoryCalls = 0;
  const second = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => (secondInventoryCalls += 1, inventory) });
  assert.deepEqual(second.failures, ['PROJECT_PLUGIN_LOCK_BUSY']);
  assert.equal(secondInventoryCalls, 0);
  release();
  assert.equal((await first).status, 'ready');
  assert.equal(fs.existsSync(`${path.join(root, PROJECT_PLUGIN_LOCK_PATH)}.writer-lock`), false);
}));

test('write-lock 主失败不被 control lock 接管覆盖，并保留接管者字节', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const controlFile = `${lockFile}.writer-lock`;
  const takeoverBytes = Buffer.from('third-party-control\n');
  const result = await writeProjectPluginLockLifecycle({ rootDir: root, listInventory: async () => {
    fs.unlinkSync(controlFile);
    fs.writeFileSync(controlFile, takeoverBytes);
    return new Set();
  } });
  assert.deepEqual(result.failures, [
    'PROJECT_PLUGIN_LOCK_SOURCE_NOT_IN_GIT_INVENTORY',
    'PROJECT_PLUGIN_LOCK_CONTROL_FAILED',
  ]);
  assert.deepEqual(fs.readFileSync(controlFile), takeoverBytes);
}));

test('lock writer no-op、同版本漂移拒绝且 ignored 文件不能进入 lock', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const original = fs.readFileSync(lockFile, 'utf8');
  const ready = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => inventoryFor(root) });
  assert.equal(ready.status, 'ready');
  assert.equal(fs.readFileSync(lockFile, 'utf8'), original);
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\ndrift\n');
  const drift = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => inventoryFor(root) });
  assert.match(drift.failures[0], /PROJECT_PLUGIN_VERSION_CHANGE_REQUIRED/);
  assert.equal(fs.readFileSync(lockFile, 'utf8'), original);
  fs.writeFileSync(path.join(root, 'plugins/codex-mcp-config-auditor/.DS_Store'), 'ignored');
  const ignored = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => new Set(JSON.parse(original).plugins.flatMap(plugin => (
      plugin.files.map(file => `${plugin.source}/${file.path}`)
    ))) });
  assert.deepEqual(ignored.failures, ['PROJECT_PLUGIN_LOCK_SOURCE_NOT_IN_GIT_INVENTORY']);
}));

test('lock no-op 也复核 TOCTOU，manifest 版本只允许严格递增', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const original = fs.readFileSync(lockFile, 'utf8');
  const raced = await writeProjectPluginLockLifecycle({ rootDir: root, listInventory: async () => {
    const inventory = inventoryFor(root);
    fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nno-op race\n');
    return inventory;
  } });
  assert.deepEqual(raced.failures, ['PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE']);
  assert.equal(fs.readFileSync(lockFile, 'utf8'), original);
  const manifestFile = path.join(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.version = '0.1.9';
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const downgraded = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => inventoryFor(root) });
  assert.match(downgraded.failures[0], /PROJECT_PLUGIN_VERSION_CHANGE_REQUIRED/);
  assert.equal(fs.readFileSync(lockFile, 'utf8'), original);
}));

test('manifest 版本递增后原子写 canonical lock，并拒绝写入中的 TOCTOU 漂移', () => withCopy(async (root) => {
  const manifestFile = path.join(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.version = '0.2.3';
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nversioned change\n');
  const written = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => inventoryFor(root) });
  assert.equal(written.status, 'lock-written');
  assert.deepEqual(collectProjectPluginLockFailures(root), []);
  assert.ok(fs.readFileSync(path.join(root, PROJECT_PLUGIN_LOCK_PATH), 'utf8').split('\n').length <= 110);
  const nextManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  nextManifest.version = '0.2.4';
  fs.writeFileSync(manifestFile, `${JSON.stringify(nextManifest, null, 2)}\n`);
  const before = fs.readFileSync(path.join(root, PROJECT_PLUGIN_LOCK_PATH), 'utf8');
  const raced = await writeProjectPluginLockLifecycle({ rootDir: root, listInventory: async () => {
    const inventory = inventoryFor(root);
    fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nrace\n');
    return inventory;
  } });
  assert.deepEqual(raced.failures, ['PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE']);
  assert.equal(fs.readFileSync(path.join(root, PROJECT_PLUGIN_LOCK_PATH), 'utf8'), before);
}));

test('lock writer 在 Git inventory 前拒绝 symlink manifest', () => withCopy(async (root) => {
  const manifest = path.join(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json');
  fs.renameSync(manifest, `${manifest}.real`);
  fs.symlinkSync('plugin.json.real', manifest);
  let inventoryCalls = 0;
  const result = await writeProjectPluginLockLifecycle({
    rootDir: root, listInventory: async () => (inventoryCalls += 1, new Set()),
  });
  assert.deepEqual(result.failures, ['PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID']);
  assert.equal(inventoryCalls, 0);
}));

test('write-lock 在 Git inventory 前将缺失 lock 归一为固定诊断', () => withCopy(async (root) => {
  fs.rmSync(path.join(root, PROJECT_PLUGIN_LOCK_PATH));
  let inventoryCalls = 0;
  const report = await writeProjectPluginLockLifecycle({
    rootDir: root,
    listInventory: async () => (inventoryCalls += 1, new Set()),
  });
  assert.deepEqual(report.failures, ['PROJECT_PLUGIN_LOCK_INVALID']);
  assert.equal(inventoryCalls, 0);
}));

test('write-lock 在 inventory 窗口拒绝覆盖并发 lock 字节', () => withCopy(async (root) => {
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const inventory = inventoryFor(root);
  const manifestFile = path.join(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.version = '0.2.3';
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nversioned change\n');
  const concurrentBytes = Buffer.from('{"concurrent":true}\n');
  const report = await writeProjectPluginLockLifecycle({ rootDir: root, listInventory: async () => {
    fs.writeFileSync(lockFile, concurrentBytes);
    return inventory;
  } });
  assert.deepEqual(report.failures, ['PROJECT_PLUGIN_LOCK_CHANGED_DURING_WRITE']);
  assert.deepEqual(fs.readFileSync(lockFile), concurrentBytes);
}));
