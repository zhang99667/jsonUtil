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
    return await run({ root: fs.realpathSync(root), codexHome: fs.realpathSync(codexHome) });
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
};
const expectedVersions = root => Object.fromEntries(AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map((name) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, `plugins/${name}/.codex-plugin/plugin.json`), 'utf8'));
  return [name, manifest.version];
}));
const inventoryFor = root => new Set(buildProjectPluginLock(root).plugins.flatMap(plugin => (
  plugin.files.map(file => `${plugin.source}/${file.path}`)
)));
const installCache = (root, codexHome, layout = 'local') => {
  for (const plugin of buildProjectPluginLock(root).plugins) {
    const name = plugin.selector.split('@')[0];
    const leaf = layout === 'manifest-version' ? plugin.manifestVersion : 'local';
    fs.cpSync(path.join(root, plugin.source), path.join(
      codexHome, 'plugins/cache/jsonutils-project', name, leaf,
    ), { recursive: true });
  }
};

const createCodexRunner = ({ root, registered = true, marketplaceRoot = root, installed = [],
  disabled = [], versions = {}, personalEnabled = [], codexHome = path.join(root, '用户 Codex & home') }) => {
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
      const installedPath = path.join(codexHome, 'plugins/cache/jsonutils-project', name, 'local');
      fs.rmSync(path.dirname(installedPath), { recursive: true, force: true });
      fs.cpSync(path.join(root, `plugins/${name}`), installedPath, { recursive: true });
      return { pluginId: args[2], name, marketplaceName: 'jsonutils-project', version: expected[name],
        installedPath };
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
  assert.equal(result.trustBoundary, 'local-installation-component-only');
  assert.deepEqual([result.taskRegistrationVerified, result.runtimeTrustVerified,
    result.signerTrustVerified, result.attestationVerified, result.outcomeEligible], [false, false, false, false, false]);
  assert.equal(fake.calls.length, 4);
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
    ['plugin', 'marketplace', 'list'], ['plugin', 'list', '--available'],
  ]);
}));

test('显式 apply 注册项目根并安装三个固定 selector，重复执行零写入', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root, registered: false });
  const first = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: fake.runCommand });
  assert.equal(first.status, 'applied');
  assert.deepEqual(first.mutations, { attempted: 4, succeeded: 4 });
  assert.equal(first.newTaskRequired, true);
  const marketplaceAdd = fake.calls.find(call => call.args[2] === 'add' && call.args[1] === 'marketplace');
  assert.deepEqual(marketplaceAdd.args, ['plugin', 'marketplace', 'add', root, '--json']);
  assert.deepEqual(fake.calls.filter(call => call.args[1] === 'add').map(call => call.args[2]),
    AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => `${name}@jsonutils-project`));
  const before = fake.calls.length;
  const second = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: fake.runCommand });
  assert.equal(second.status, 'ready');
  assert.deepEqual(second.mutations, { attempted: 0, succeeded: 0 });
  assert.equal(fake.calls.length - before, 4);
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

test('项目 marketplace 的 CLI plugin state 必须是完整且互斥的闭集合', async () => {
  for (const drift of ['duplicate', 'unknown', 'missing']) await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
    const result = await runProjectPluginLifecycle({ rootDir: root, codexHome, inspectCache: noCacheMismatch,
      runCommand: async (options) => {
        const value = await fake.runCommand(options);
        if (options.args[1] !== 'list') return value;
        if (drift === 'duplicate') value.available.push({ ...value.installed[0], installed: false, enabled: false });
        if (drift === 'unknown') value.available.push({ pluginId: 'unexpected@jsonutils-project', name: 'unexpected',
          marketplaceName: 'jsonutils-project', version: '1.0.0', installed: false, enabled: false });
        if (drift === 'missing') value.installed.shift();
        return value;
      } });
    assert.deepEqual(result.failures, ['CODEX_PLUGIN_LIST_INVALID'], drift);
    assert.deepEqual(result.mutations, { attempted: 0, succeeded: 0 });
  });
});

test('doctor 绑定连续两次 CLI 与 cache inspection，漂移时不返回 ready', async () => {
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
    let pluginLists = 0;
    const result = await runProjectPluginLifecycle({ rootDir: root, codexHome, inspectCache: noCacheMismatch,
      runCommand: async (options) => {
        if (options.args[1] === 'list' && ++pluginLists === 2) fake.state.installed.delete(AI_GOVERNANCE_PROJECT_PLUGIN_NAMES[0]);
        return fake.runCommand(options);
      } });
    assert.deepEqual(result.failures, ['PROJECT_PLUGIN_STATE_CHANGED_DURING_LIFECYCLE']);
  });
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
    let cacheReads = 0;
    const result = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand,
      inspectCache: async () => ({ mismatches: new Set(++cacheReads === 1
        ? [] : [`${AI_GOVERNANCE_PROJECT_PLUGIN_NAMES[0]}@jsonutils-project`]), installedRoots: new Map() }) });
    assert.deepEqual(result.failures, ['PROJECT_PLUGIN_STATE_CHANGED_DURING_LIFECYCLE']);
  });
});

test('check 与 apply 都绑定稳定 source snapshot，首个漂移立即停止', async () => {
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
    const check = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand,
      inspectCache: async () => {
        fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\ncheck race\n');
        return new Set();
      } });
    assert.deepEqual(check.failures, ['PROJECT_PLUGIN_SOURCE_CHANGED_DURING_LIFECYCLE']);
  });
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root });
    const apply = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
      runCommand: async (options) => {
        const value = await fake.runCommand(options);
        if (options.args[0] === 'plugin' && options.args[1] === 'add') {
          fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\napply race\n');
        }
        return value;
      } });
    assert.deepEqual(apply.failures, ['PROJECT_PLUGIN_SOURCE_CHANGED_DURING_LIFECYCLE']);
    assert.deepEqual(apply.mutations, { attempted: 1, succeeded: 0 });
    assert.equal(fake.calls.filter(call => call.args[1] === 'add').length, 1);
  });
});

test('apply 每次 mutation 前后复核 CLI/cache，首个未注册或既有路径漂移即停止', async () => {
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root });
    const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
      runCommand: async (options) => {
        const value = await fake.runCommand(options);
        if (options.args[1] === 'add') fake.state.installed.delete(options.args[2].split('@')[0]);
        return value;
      } });
    assert.deepEqual(result.failures, ['PROJECT_PLUGIN_ADD_POSTCHECK_FAILED']);
    assert.deepEqual(result.mutations, { attempted: 1, succeeded: 0 });
    assert.equal(fake.calls.filter(call => call.args[1] === 'add').length, 1);
  });
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root, registered: false });
    let marketplaceLists = 0;
    const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
      runCommand: async (options) => {
        if (options.args[1] === 'marketplace' && options.args[2] === 'list' && ++marketplaceLists === 3) {
          fake.state.registered = true;
          fake.state.marketplaceRoot = path.dirname(root);
        }
        return fake.runCommand(options);
      }, inspectCache: noCacheMismatch });
    assert.deepEqual(result.failures, ['PROJECT_PLUGIN_STATE_CHANGED_DURING_LIFECYCLE']);
    assert.deepEqual(result.mutations, { attempted: 0, succeeded: 0 });
  });
  await withProject(async ({ root, codexHome }) => {
    const fake = createCodexRunner({ root });
    const first = AI_GOVERNANCE_PROJECT_PLUGIN_NAMES[0];
    let pluginLists = 0;
    const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
      runCommand: async (options) => {
        const value = await fake.runCommand(options);
        if (options.args[1] === 'list' && ++pluginLists === 5) {
          const local = path.join(codexHome, 'plugins/cache/jsonutils-project', first, 'local');
          fs.renameSync(local, path.join(path.dirname(local), expectedVersions(root)[first]));
        }
        return value;
      } });
    assert.deepEqual(result.failures, ['PROJECT_PLUGIN_STATE_CHANGED_DURING_LIFECYCLE']);
    assert.deepEqual(result.mutations, { attempted: 1, succeeded: 1 });
    assert.equal(fake.calls.filter(call => call.args[1] === 'add').length, 1);
  });
});

test('mutation 返回 JSON 标量时阻断且不计 verified success', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root, registered: false });
  const runCommand = async (options) => options.args[1] === 'marketplace' && options.args[2] === 'add'
    ? 7
    : fake.runCommand(options);
  const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand, inspectCache: noCacheMismatch });
  assert.deepEqual(result.failures, ['CODEX_MARKETPLACE_ADD_INVALID']);
  assert.deepEqual(result.mutations, { attempted: 1, succeeded: 0 });

  const missingPath = createCodexRunner({ root });
  const invalidAdd = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: async (options) => {
      const value = await missingPath.runCommand(options);
      if (options.args[0] === 'plugin' && options.args[1] === 'add') delete value.installedPath;
      return value;
    } });
  assert.deepEqual(invalidAdd.failures, ['CODEX_PLUGIN_ADD_INVALID']);
  assert.deepEqual(invalidAdd.mutations, { attempted: 1, succeeded: 0 });
}));

test('真实 cache 漂移被 doctor 发现，enabled 安装项可由显式 apply 修复', () => withProject(async ({ root, codexHome }) => {
  installCache(root, codexHome);
  const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
  const stale = path.join(codexHome, 'plugins/cache/jsonutils-project/jsonutils-governance-mcp/local/README.md');
  fs.appendFileSync(stale, '\nstale\n');
  const check = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand });
  assert.equal(check.status, 'needs-apply');
  assert.equal(check.plugins.find(plugin => plugin.selector.startsWith('jsonutils-governance'))?.state, 'cache-mismatch');
  const repairingRunner = async (options) => {
    if (options.args[0] === 'plugin' && options.args[1] === 'add') {
      const name = options.args[2].split('@')[0];
      fs.rmSync(path.join(codexHome, 'plugins/cache/jsonutils-project', name), { recursive: true, force: true });
      fs.cpSync(path.join(root, `plugins/${name}`), path.join(
        codexHome, 'plugins/cache/jsonutils-project', name, 'local',
      ), { recursive: true });
    }
    return fake.runCommand(options);
  };
  const applied = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: repairingRunner, inspectCache: inspectProjectPluginCache });
  assert.equal(applied.status, 'applied');
  assert.deepEqual(applied.mutations, { attempted: 1, succeeded: 1 });
}));

test('doctor 兼容唯一版本目录，但 local 与版本目录并存时 fail closed', () => withProject(async ({ root, codexHome }) => {
  installCache(root, codexHome, 'manifest-version');
  const fake = createCodexRunner({ root, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES });
  const compatible = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand });
  assert.equal(compatible.status, 'ready');
  const unexpected = path.join(codexHome, 'plugins/cache/jsonutils-project/jsonutils-governance-mcp/unexpected.txt');
  fs.writeFileSync(unexpected, 'unexpected');
  const extra = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: fake.runCommand });
  assert.deepEqual(extra.failures, ['PROJECT_PLUGIN_CACHE_PATH_UNSAFE']);
  fs.rmSync(unexpected);
  installCache(root, codexHome, 'local');
  const ambiguous = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome,
    runCommand: fake.runCommand });
  assert.deepEqual(ambiguous.failures, ['PROJECT_PLUGIN_CACHE_PATH_UNSAFE']);
  assert.deepEqual(ambiguous.mutations, { attempted: 0, succeeded: 0 });
}));

test('doctor 将唯一旧版本 leaf 标为可升级，显式 apply 后收敛', () => withProject(async ({ root, codexHome }) => {
  installCache(root, codexHome, 'manifest-version');
  const name = 'jsonutils-governance-mcp';
  const current = expectedVersions(root)[name];
  const previous = '0.2.0';
  const pluginRoot = path.join(codexHome, 'plugins/cache/jsonutils-project', name);
  fs.renameSync(path.join(pluginRoot, current), path.join(pluginRoot, previous));
  const manifestFile = path.join(pluginRoot, previous, '.codex-plugin/plugin.json');
  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  manifest.version = previous; fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  const fake = createCodexRunner({ root, codexHome, installed: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES, versions: { [name]: previous } });
  const check = await runProjectPluginLifecycle({ rootDir: root, codexHome, runCommand: fake.runCommand });
  assert.equal(check.status, 'needs-apply'); assert.equal(check.plugins.find(item => item.selector.startsWith(name)).state, 'version-mismatch');
  const applied = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome, runCommand: fake.runCommand });
  assert.equal(applied.status, 'applied'); assert.deepEqual(applied.mutations, { attempted: 1, succeeded: 1 });
}));

test('apply 将 add 返回路径绑定到最终唯一 cache 副本', () => withProject(async ({ root, codexHome }) => {
  const fake = createCodexRunner({ root });
  let moved = false;
  const runCommand = async (options) => {
    if (!moved && options.args.join(' ') === 'plugin list --available --json'
      && fake.state.installed.size === AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.length) {
      const name = AI_GOVERNANCE_PROJECT_PLUGIN_NAMES[0];
      const version = expectedVersions(root)[name];
      const pluginRoot = path.join(codexHome, 'plugins/cache/jsonutils-project', name);
      fs.renameSync(path.join(pluginRoot, 'local'), path.join(pluginRoot, version));
      moved = true;
    }
    return fake.runCommand(options);
  };
  const result = await runProjectPluginLifecycle({ rootDir: root, mode: 'apply', codexHome, runCommand });
  assert.deepEqual(result.failures, ['PROJECT_PLUGIN_ADD_POSTCHECK_FAILED']);
  assert.deepEqual(result.mutations, { attempted: 3, succeeded: 2 });
}));

test('cache 中间层符号链接在读取插件字节前 fail closed', () => withProject(async ({ root, codexHome }) => {
  installCache(root, codexHome);
  const pluginRoot = path.join(codexHome, 'plugins/cache/jsonutils-project/jsonutils-governance-mcp');
  const escaped = path.join(root, 'escaped-cache');
  fs.rmSync(pluginRoot, { recursive: true, force: true });
  fs.mkdirSync(escaped, { recursive: true });
  fs.cpSync(path.join(root, 'plugins/jsonutils-governance-mcp'), path.join(escaped, 'local'), { recursive: true });
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
  manifest.version = '0.2.2';
  fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.appendFileSync(path.join(root, 'plugins/jsonutils-governance-mcp/README.md'), '\nversioned change\n');
  const written = await writeProjectPluginLockLifecycle({ rootDir: root,
    listInventory: async () => inventoryFor(root) });
  assert.equal(written.status, 'lock-written');
  assert.deepEqual(collectProjectPluginLockFailures(root), []);
  assert.ok(fs.readFileSync(path.join(root, PROJECT_PLUGIN_LOCK_PATH), 'utf8').split('\n').length <= 110);

  const nextManifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  nextManifest.version = '0.2.3';
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

test('lock writer 在 Git inventory 前拒绝 symlink manifest', () => withProject(async ({ root }) => {
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
