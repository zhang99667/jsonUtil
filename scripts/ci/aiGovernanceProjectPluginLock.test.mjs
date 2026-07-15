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

test('安装副本核验只报告匹配状态，不升级 trust boundary', () => withCopy((root) => {
  const cacheRoot = path.join(root, 'cache');
  const lock = buildProjectPluginLock(root);
  for (const plugin of lock.plugins) {
    const name = plugin.selector.split('@')[0];
    fs.cpSync(path.join(root, plugin.source), path.join(cacheRoot, name, plugin.manifestVersion), { recursive: true });
  }
  assert.deepEqual(collectInstalledProjectPluginFailures({ rootDir: root, cacheRoot }), []);
  const auditorVersion = lock.plugins.find(plugin => plugin.selector.startsWith('codex-mcp-config-auditor@'))?.manifestVersion;
  assert.ok(auditorVersion);
  fs.appendFileSync(path.join(cacheRoot, 'codex-mcp-config-auditor', auditorVersion, 'README.md'), '\nstale\n');
  assert.match(collectInstalledProjectPluginFailures({ rootDir: root, cacheRoot }).join('\n'), /安装副本与项目 content lock 不一致/);
}));
