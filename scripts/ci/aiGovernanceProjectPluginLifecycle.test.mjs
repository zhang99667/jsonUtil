import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  inspectProjectPluginCache,
  runCodexJsonCommand,
  runProjectPluginLifecycle,
  writeProjectPluginLockLifecycle,
} from './aiGovernanceProjectPluginLifecycle.mjs';
import {
  buildProjectPluginLock,
  collectProjectPluginLockFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginFiles.mjs';

const sourceRoot = path.resolve(import.meta.dirname, '../..');
const noCacheMismatch = async () => new Set();
const makeWritable = (target) => {
  const stat = fs.lstatSync(target);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(target, 0o700);
    fs.readdirSync(target).forEach(name => makeWritable(path.join(target, name)));
  } else if (!stat.isSymbolicLink()) fs.chmodSync(target, 0o600);
};
const withProject = async (run) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils plugin & 生命周期-'));
  const codexHome = path.join(root, '用户 Codex & home');
  try {
    fs.cpSync(path.join(sourceRoot, '.agents'), path.join(root, '.agents'), { recursive: true });
    fs.cpSync(path.join(sourceRoot, 'plugins'), path.join(root, 'plugins'), { recursive: true });
    fs.mkdirSync(codexHome, { recursive: true });
    makeWritable(root);
    return await run({ root: fs.realpathSync(root), codexHome });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
};
const expectedVersions = root => Object.fromEntries(AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map((name) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, `plugins/${name}/.codex-plugin/plugin.json`), 'utf8'));
  return [name, manifest.version];
}));
const nextPatchVersion = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  assert.ok(match);
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
};
const inventoryFor = root => new Set(buildProjectPluginLock(root).plugins.flatMap(plugin => (
  plugin.files.map(file => `${plugin.source}/${file.path}`)
)));
const installCache = (root, codexHome) => {
  for (const plugin of buildProjectPluginLock(root).plugins) {
    const name = plugin.selector.split('@')[0];
    fs.cpSync(path.join(root, plugin.source), path.join(
      codexHome, 'plugins/cache/jsonutils-project', name, plugin.manifestVersion,
    ), { recursive: true });
  }
};

const createCodexRunner = ({ root, registered = true, marketplaceRoot = root, installed = [],
  disabled = [], versions = {}, personalEnabled = [] }) => {
  const calls = [];
  const state = { registered, marketplaceRoot, installed: new Set(installed), disabled: new Set(disabled) };
  const expected = expectedVersions(root);
  const runCommand = async ({ binary, cwd, args }) => {
    calls.push({ binary, cwd, args: [...args] });
    if (args.join(' ') === 'plugin marketplace list --json') {
      return { marketplaces: state.registered ? [{ name: 'jsonutils-project', root: state.marketplaceRoot }] : [] };
    }
    if (args.join(' ') === 'plugin list --available --json') {
      const projectInstalled = [...state.installed].map(name => ({
        pluginId: `${name}@jsonutils-project`, name, marketplaceName: 'jsonutils-project',
        version: versions[name] ?? expected[name], installed: true, enabled: !state.disabled.has(name),
      }));
      const projectAvailable = AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.filter(name => !state.installed.has(name))
        .map(name => ({ pluginId: `${name}@jsonutils-project`, name, marketplaceName: 'jsonutils-project',
          version: expected[name], installed: false, enabled: false }));
      const personal = personalEnabled.map(name => ({ pluginId: `${name}@personal`, name,
        marketplaceName: 'personal', version: '9.9.9', installed: true, enabled: true }));
      return { installed: [...projectInstalled, ...personal], available: projectAvailable };
    }
    if (args[0] === 'plugin' && args[1] === 'marketplace' && args[2] === 'add') {
      state.registered = true;
      state.marketplaceRoot = args[3];
      return { marketplaceName: 'jsonutils-project', installedRoot: args[3], alreadyAdded: false };
    }
    if (args[0] === 'plugin' && args[1] === 'add') {
      const name = args[2].split('@')[0];
      state.installed.add(name);
      state.disabled.delete(name);
      versions[name] = expected[name];
      return { pluginId: args[2], name, marketplaceName: 'jsonutils-project', version: expected[name] };
    }
    throw new Error('unexpected fake Codex argv');
  };
  return { calls, state, runCommand };
};

test('doctor 在特殊字符项目路径只读报告 ready', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
  const result = await runProjectPluginLifecycle({
    rootDir: root, codexHome, runCommand: fake.runCommand, inspectCache: noCacheMismatch,
  });
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.mutations, { attempted: 0, succeeded: 0 });
  assert.equal(result.newTaskRequired, false);
  assert.equal(fake.calls.length, 2);
  assert.match(result.marketplace.expectedRoot, /jsonutils plugin & 生命周期/);
}));

test('空用户 doctor 只报告 needs-apply，不注册或安装', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root, registered: false });
  const result = await runProjectPluginLifecycle({
    rootDir: root, codexHome, runCommand: fake.runCommand, inspectCache: noCacheMismatch,
  });
  assert.equal(result.status, 'needs-apply');
  assert.equal(result.plugins.every(plugin => plugin.action === 'add'), true);
  assert.deepEqual(fake.calls.map(call => call.args.slice(0, 3)), [
    ['plugin', 'marketplace', 'list'], ['plugin', 'list', '--available'],
  ]);
}));

test('显式 apply 注册项目根并安装三个固定 selector，重复执行零写入', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root, registered: false });
  const first = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: fake.runCommand, inspectCache: noCacheMismatch });
  assert.equal(first.status, 'applied');
  assert.deepEqual(first.mutations, { attempted: 4, succeeded: 4 });
  assert.equal(first.newTaskRequired, true);
  const marketplaceAdd = fake.calls.find(call => call.args[2] === 'add' && call.args[1] === 'marketplace');
  assert.deepEqual(marketplaceAdd.args, ['plugin', 'marketplace', 'add', root, '--json']);
  assert.deepEqual(fake.calls.filter(call => call.args[1] === 'add').map(call => call.args[2]),
    AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => `${name}@jsonutils-project`));
  const before = fake.calls.length;
  const second = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: fake.runCommand, inspectCache: noCacheMismatch });
  assert.equal(second.status, 'ready');
  assert.deepEqual(second.mutations, { attempted: 0, succeeded: 0 });
  assert.equal(fake.calls.length - before, 2);
}));

test('同名异源、个人启用和用户禁用均 fail closed', () => withProject(async ({ root, codexHome }) => {
  const fixtures = [
    createCodexRunner({ root, marketplaceRoot: path.dirname(root) }),
    createCodexRunner({ root, personalEnabled: ['jsonutils-governance-mcp'] }),
    createCodexRunner({ root, installed: ['jsonutils-governance-mcp'], disabled: ['jsonutils-governance-mcp'] }),
  ];
  for (const fake of fixtures) {
    const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
      runCommand: fake.runCommand, inspectCache: noCacheMismatch });
    assert.equal(result.status, 'blocked');
    assert.deepEqual(result.mutations, { attempted: 0, succeeded: 0 });
    assert.equal(fake.calls.some(call => call.args[1] === 'add'), false);
  }
}));

test('非法 Codex JSON shape 和项目 source 漂移均在写用户态前阻断', () => withProject(async ({ root, codexHome }) => {
  let calls = 0;
  const invalid = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    inspectCache: noCacheMismatch, runCommand: async ({ args }) => {
      calls += 1;
      return args[1] === 'marketplace' ? { marketplaces: [] } : { installed: [], available: [7] };
    } });
  assert.deepEqual(invalid.failures, ['CODEX_PLUGIN_LIST_INVALID']);
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nsource drift\n');
  calls = 0;
  const drift = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    inspectCache: noCacheMismatch, runCommand: async () => (calls += 1, {}) });
  assert.deepEqual(drift.failures, ['PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID']);
  assert.equal(calls, 0);
}));

test('mutation 返回 JSON 标量时阻断且不计 verified success', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root, registered: false });
  const runCommand = async (options) => options.args[1] === 'marketplace' && options.args[2] === 'add'
    ? 7
    : fake.runCommand(options);
  const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand, inspectCache: noCacheMismatch });
  assert.deepEqual(result.failures, ['CODEX_MARKETPLACE_ADD_INVALID']);
  assert.deepEqual(result.mutations, { attempted: 1, succeeded: 0 });
}));

test('真实 cache 漂移被 doctor 发现，enabled 安装项可由显式 apply 修复', () => withProject(async ({ root, codexHome }) => {
  installCache(root, codexHome);
  const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
  const governanceVersion = expectedVersions(root)['jsonutils-governance-mcp'];
  const stale = path.join(codexHome, 'plugins/cache/jsonutils-project/jsonutils-governance-mcp', governanceVersion, 'README.md');
  fs.appendFileSync(stale, '\nstale\n');
  const check = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand });
  assert.equal(check.status, 'needs-apply');
  assert.equal(check.plugins.find(plugin => plugin.selector.startsWith('jsonutils-governance'))?.state, 'cache-mismatch');
  const repairingRunner = async (options) => {
    if (options.args[0] === 'plugin' && options.args[1] === 'add') {
      const name = options.args[2].split('@')[0];
      fs.rmSync(path.join(codexHome, 'plugins/cache/jsonutils-project', name), { recursive: true, force: true });
      const version = expectedVersions(root)[name];
      fs.cpSync(path.join(root, `plugins/${name}`), path.join(
        codexHome, 'plugins/cache/jsonutils-project', name, version,
      ), { recursive: true });
    }
    return fake.runCommand(options);
  };
  const applied = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: repairingRunner, inspectCache: inspectProjectPluginCache });
  assert.equal(applied.status, 'applied');
  assert.deepEqual(applied.mutations, { attempted: 1, succeeded: 1 });
}));

test('cache 中间层符号链接在读取插件字节前 fail closed', () => withProject(async ({ root, codexHome }) => {
  installCache(root, codexHome);
  const pluginRoot = path.join(codexHome, 'plugins/cache/jsonutils-project/jsonutils-governance-mcp');
  const escaped = path.join(root, 'escaped-cache');
  fs.rmSync(pluginRoot, { recursive: true, force: true });
  fs.mkdirSync(escaped, { recursive: true });
  const governanceVersion = expectedVersions(root)['jsonutils-governance-mcp'];
  fs.cpSync(path.join(root, 'plugins/jsonutils-governance-mcp'), path.join(escaped, governanceVersion), { recursive: true });
  fs.symlinkSync(escaped, pluginRoot);
  const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
  const result = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand });
  assert.deepEqual(result.failures, ['PROJECT_PLUGIN_CACHE_PATH_UNSAFE']);
  assert.deepEqual(result.mutations, { attempted: 0, succeeded: 0 });
}));

test('spawn 始终使用 argv 与 shell:false，特殊路径保持单一参数', async () => {
  let observed;
  const spawnImpl = (binary, args, options) => {
    observed = { binary, args, options };
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    child.kill = () => true;
    queueMicrotask(() => {
      child.stdout.emit('data', Buffer.from('{"ok":true}'));
      child.emit('close', 0);
    });
    return child;
  };
  const specialRoot = '/tmp/JSON 项目 & plugins';
  assert.deepEqual(await runCodexJsonCommand({ binary: '/tmp/Codex App',
    args: ['plugin', 'marketplace', 'add', specialRoot, '--json'], cwd: '/tmp', spawnImpl }), { ok: true });
  assert.equal(observed.options.shell, false);
  assert.equal(observed.args[3], specialRoot);
  assert.equal(observed.args.length, 5);
});

test('lock writer no-op、同版本漂移拒绝且 ignored 文件不能进入 lock', () => withProject(async ({ root }) => {
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

test('lock no-op 也复核 TOCTOU，manifest 版本只允许严格递增', () => withProject(async ({ root }) => {
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

test('manifest 版本递增后原子写 canonical lock，并拒绝写入中的 TOCTOU 漂移', () => withProject(async ({ root }) => {
  const manifestFile = path.join(root, 'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.version = nextPatchVersion(manifest.version);
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nversioned change\n');
  const written = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => inventoryFor(root) });
  assert.equal(written.status, 'lock-written');
  assert.deepEqual(collectProjectPluginLockFailures(root), []);
  assert.ok(fs.readFileSync(path.join(root, PROJECT_PLUGIN_LOCK_PATH), 'utf8').split('\n').length <= 110);

  const nextManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  nextManifest.version = nextPatchVersion(nextManifest.version);
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
