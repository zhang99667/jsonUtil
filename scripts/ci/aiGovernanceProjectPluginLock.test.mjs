import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildProjectPluginLock,
  collectInstalledProjectPluginFailures,
  collectProjectPluginLockFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import { collectProjectPluginFailures } from './aiGovernanceProjectPlugins.mjs';
import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import {
  captureProjectPluginTree,
  sameProjectPluginTreeSnapshots,
} from './aiGovernanceProjectPluginTreeSnapshot.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const makeWritable = (target) => {
  const stat = fs.lstatSync(target);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(target, 0o700);
    fs.readdirSync(target).forEach(name => makeWritable(path.join(target, name)));
  } else if (!stat.isSymbolicLink()) fs.chmodSync(target, 0o600);
};
const withCopy = (run) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-plugin-lock-'));
  try {
    fs.cpSync(path.join(projectRoot, '.agents'), path.join(root, '.agents'), { recursive: true });
    fs.cpSync(path.join(projectRoot, 'plugins'), path.join(root, 'plugins'), { recursive: true });
    makeWritable(root);
    return run(root);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
};

test('项目插件 lock 精确绑定完整文件集与内容', () => {
  assert.deepEqual(collectProjectPluginLockFailures(projectRoot), []);
  const lock = buildProjectPluginLock(projectRoot);
  assert.deepEqual(lock.plugins.map(item => item.selector), [
    'ai-infra-controller-probe@jsonutils-project',
    'jsonutils-governance-mcp@jsonutils-project',
    'codex-mcp-config-auditor@jsonutils-project',
  ]);
  assert.ok(lock.plugins.every(item => item.files.length > 0 && /^[a-f0-9]{64}$/.test(item.treeSha256)));
});

test('项目插件快照比较绑定原始 bytes，不只信任摘要', () => {
  const baseline = captureProjectPluginTree(projectRoot);
  const changed = captureProjectPluginTree(projectRoot);
  changed.plugins[0].files[0].content[0] ^= 1;
  assert.equal(sameProjectPluginTreeSnapshots(baseline, changed), false);
});

test('项目插件仓内路径拒绝非 canonical 和越界语法', () => {
  assert.throws(() => resolveProjectPluginRepositoryPath(projectRoot, 'plugins/a/../b'), /canonical POSIX/);
  assert.throws(() => resolveProjectPluginRepositoryPath(projectRoot, '../outside'), /canonical POSIX|\u4ed3\u5e93\u5185/);
});

test('项目插件 lock 拒绝同版本内容漂移、增删文件和 digest 篡改', () => withCopy((root) => {
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\ndrift\n');
  fs.writeFileSync(path.join(root, 'plugins/codex-mcp-config-auditor/extra.txt'), 'extra');
  const lockPath = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.plugins[0].treeSha256 = '0'.repeat(64);
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  assert.match(collectProjectPluginLockFailures(root).join('\n'), /完整文件集/);
}));

test('项目插件 lock 拒绝符号链接替换普通文件', () => withCopy((root) => {
  const readme = path.join(root, 'plugins/jsonutils-governance-mcp/README.md');
  fs.rmSync(readme);
  fs.symlinkSync('.mcp.json', readme);
  assert.match(collectProjectPluginLockFailures(root).join('\n'), /不接受符号链接/);
}));

test('项目插件拒绝祖先符号链接逃逸仓库', () => withCopy((root) => {
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-plugin-outside-'));
  try {
    const source = path.join(root, 'plugins/jsonutils-governance-mcp');
    const target = path.join(outside, 'jsonutils-governance-mcp');
    fs.cpSync(source, target, { recursive: true });
    fs.rmSync(source, { recursive: true });
    fs.symlinkSync(target, source, 'dir');
    assert.throws(() => buildProjectPluginLock(root), /祖先不得是符号链接/);
    assert.match(collectProjectPluginFailures(root).join('\n'), /祖先不得是符号链接/);
  } finally { fs.rmSync(outside, { recursive: true, force: true }); }
}));

test('安装副本核验只报告匹配状态，不升级 trust boundary', () => withCopy((root) => {
  const codexHome = path.join(root, 'codex-home');
  const cacheRoot = path.join(codexHome, 'plugins/cache/jsonutils-project');
  const lock = buildProjectPluginLock(root);
  for (const plugin of lock.plugins) {
    const name = plugin.selector.split('@')[0];
    fs.cpSync(path.join(root, plugin.source), path.join(cacheRoot, name, 'local'), { recursive: true });
  }
  assert.deepEqual(collectInstalledProjectPluginFailures({ rootDir: root, codexHome }), []);
  const extra = path.join(cacheRoot, 'codex-mcp-config-auditor', '0.0.1');
  fs.mkdirSync(extra);
  assert.match(collectInstalledProjectPluginFailures({ rootDir: root, codexHome }).join('\n'), /布局不唯一/);
  fs.rmSync(extra, { recursive: true });
  fs.appendFileSync(path.join(cacheRoot, 'codex-mcp-config-auditor', 'local', 'README.md'), '\nstale\n');
  assert.match(collectInstalledProjectPluginFailures({ rootDir: root, codexHome }).join('\n'), /安装副本与项目 content lock 不一致/);
  const linkedCache = path.join(root, 'linked-cache');
  fs.renameSync(cacheRoot, linkedCache);
  fs.symlinkSync(linkedCache, cacheRoot, 'dir');
  assert.match(collectInstalledProjectPluginFailures({ rootDir: root, codexHome }).join('\n'), /路径不安全/);
}));

test('安装副本核验先拒绝被篡改的项目 lock，不用 selector 遍历 cache', () => withCopy((root) => {
  const file = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const lock = JSON.parse(fs.readFileSync(file, 'utf8'));
  lock.plugins[0].selector = '../../outside@jsonutils-project';
  fs.writeFileSync(file, `${JSON.stringify(lock, null, 2)}\n`);
  assert.match(collectInstalledProjectPluginFailures({ rootDir: root, codexHome: root }).join('\n'), /必须与三个项目插件/);
}));
