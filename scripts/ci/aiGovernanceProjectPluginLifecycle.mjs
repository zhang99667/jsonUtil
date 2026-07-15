import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

export const PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE = 'jsonutils-project-plugin-lifecycle';
export const PROJECT_PLUGIN_MARKETPLACE = 'jsonutils-project';

const MAX_COMMAND_OUTPUT_BYTES = 1024 * 1024;
const COMMAND_TIMEOUT_MS = 30_000;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const MAX_FAILURES = 8;

class LifecycleFailure extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const failure = code => new LifecycleFailure(code);
const failureCode = error => error instanceof LifecycleFailure ? error.code : 'LIFECYCLE_INTERNAL_ERROR';
const posixPath = value => value.split(path.sep).join('/');

const captureCommand = ({ binary, args, cwd, spawnImpl = spawn, outputLimit = MAX_COMMAND_OUTPUT_BYTES }) => (
  new Promise((resolve, reject) => {
    let child;
    try {
      child = spawnImpl(binary, args, {
        cwd,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true,
        timeout: COMMAND_TIMEOUT_MS,
        killSignal: 'SIGKILL',
      });
    } catch {
      reject(failure('COMMAND_SPAWN_FAILED'));
      return;
    }
    const stdout = [];
    let bytes = 0;
    let settled = false;
    const stop = (code) => {
      if (settled) return;
      settled = true;
      try { child.kill('SIGKILL'); } catch {}
      reject(failure(code));
    };
    child.on('error', () => stop('COMMAND_SPAWN_FAILED'));
    for (const stream of [child.stdout, child.stderr]) {
      stream.on('error', () => stop('COMMAND_STREAM_FAILED'));
      stream.on('data', (chunk) => {
        const buffer = Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > outputLimit) return stop('COMMAND_OUTPUT_LIMIT');
        if (stream === child.stdout) stdout.push(buffer);
      });
    }
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (code !== 0) return reject(failure('COMMAND_FAILED'));
      resolve(Buffer.concat(stdout));
    });
  })
);

export const runCodexJsonCommand = async options => {
  let output;
  try { output = await captureCommand(options); }
  catch (error) { throw failure(`CODEX_${failureCode(error)}`); }
  try { return JSON.parse(output.toString('utf8')); }
  catch { throw failure('CODEX_INVALID_JSON'); }
};

export const resolveCodexBinary = (environment = process.env) => (
  environment.CODEX_BIN || environment.CODEX_BINARY || 'codex'
);

const projectRoot = (rootDir) => {
  try {
    const root = fs.realpathSync(rootDir);
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
    return root;
  } catch { throw failure('PROJECT_ROOT_INVALID'); }
};

const readExpectedPlugins = (root) => AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map((name) => {
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, `plugins/${name}/.codex-plugin/plugin.json`), 'utf8'));
    if (manifest.name !== name || !VERSION_PATTERN.test(manifest.version ?? '')) throw new Error();
    return Object.freeze({ name, selector: `${name}@${PROJECT_PLUGIN_MARKETPLACE}`, expectedVersion: manifest.version });
  } catch { throw failure(`PROJECT_PLUGIN_MANIFEST_INVALID:${name}`); }
});

const isPluginListEntry = (item, installed) => item && typeof item === 'object' && !Array.isArray(item)
  && typeof item.name === 'string' && item.name.length > 0
  && typeof item.marketplaceName === 'string' && item.marketplaceName.length > 0
  && item.pluginId === `${item.name}@${item.marketplaceName}`
  && typeof item.version === 'string' && item.version.length > 0
  && (!AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.includes(item.name) || VERSION_PATTERN.test(item.version))
  && item.installed === installed && typeof item.enabled === 'boolean';
const isMarketplaceEntry = entry => entry && typeof entry === 'object' && !Array.isArray(entry)
  && typeof entry.name === 'string' && entry.name.length > 0
  && typeof entry.root === 'string' && path.isAbsolute(entry.root);

export const validateProjectPluginSource = async (root) => {
  const { collectProjectPluginFailures } = await import('./aiGovernanceProjectPlugins.mjs');
  if (collectProjectPluginFailures(root).length > 0) throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID');
};

const queryCodexState = async ({ root, binary, runCommand }) => {
  const marketplaces = await runCommand({
    binary, cwd: root, args: ['plugin', 'marketplace', 'list', '--json'],
  });
  const plugins = await runCommand({
    binary, cwd: root, args: ['plugin', 'list', '--available', '--json'],
  });
  if (!marketplaces || !Array.isArray(marketplaces.marketplaces)
    || !marketplaces.marketplaces.every(isMarketplaceEntry)) throw failure('CODEX_MARKETPLACE_LIST_INVALID');
  if (!plugins || !Array.isArray(plugins.installed) || !Array.isArray(plugins.available)) {
    throw failure('CODEX_PLUGIN_LIST_INVALID');
  }
  if (!plugins.installed.every(item => isPluginListEntry(item, true))
    || !plugins.available.every(item => isPluginListEntry(item, false))) throw failure('CODEX_PLUGIN_LIST_INVALID');
  return { marketplaces: marketplaces.marketplaces, installed: plugins.installed, available: plugins.available };
};

export const inspectProjectPluginCache = async ({ root, expected, codexHome }) => {
  const { collectInstalledProjectPluginFailures, collectProjectPluginLockFailures } = await import(
    './aiGovernanceProjectPluginLock.mjs'
  );
  if (collectProjectPluginLockFailures(root).length > 0) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
  const cacheRoot = path.join(path.resolve(codexHome), 'plugins/cache', PROJECT_PLUGIN_MARKETPLACE);
  for (const ancestor of [path.join(path.resolve(codexHome), 'plugins'), path.dirname(cacheRoot), cacheRoot]) {
    if (!fs.existsSync(ancestor)) continue;
    const ancestorStat = fs.lstatSync(ancestor);
    if (!ancestorStat.isDirectory() || ancestorStat.isSymbolicLink()) throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
  }
  if (fs.existsSync(cacheRoot)) {
    for (const plugin of expected) {
      const pluginRoot = path.join(cacheRoot, plugin.name);
      if (fs.existsSync(pluginRoot)) {
        const pluginStat = fs.lstatSync(pluginRoot);
        if (!pluginStat.isDirectory() || pluginStat.isSymbolicLink()) {
          throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
        }
      }
      const installedRoot = path.join(cacheRoot, plugin.name, plugin.expectedVersion);
      if (!fs.existsSync(installedRoot)) continue;
      const installedStat = fs.lstatSync(installedRoot);
      if (!installedStat.isDirectory() || installedStat.isSymbolicLink()) {
        throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
      }
    }
  }
  let failures;
  try { failures = collectInstalledProjectPluginFailures({ rootDir: root, cacheRoot }); }
  catch { throw failure('PROJECT_PLUGIN_CACHE_UNKNOWN'); }
  const mismatches = new Set();
  for (const item of failures) {
    const plugin = expected.find(candidate => item.startsWith(`${candidate.selector}:`));
    if (!plugin) throw failure('PROJECT_PLUGIN_CACHE_UNKNOWN');
    mismatches.add(plugin.selector);
  }
  return mismatches;
};

const inspectState = async ({ root, expected, binary, runCommand, inspectCache, codexHome }) => {
  const state = await queryCodexState({ root, binary, runCommand });
  const cacheMismatches = await inspectCache({ root, expected, codexHome });
  if (!(cacheMismatches instanceof Set)) throw failure('PROJECT_PLUGIN_CACHE_UNKNOWN');
  const marketplaceEntries = state.marketplaces.filter(entry => entry?.name === PROJECT_PLUGIN_MARKETPLACE);
  if (marketplaceEntries.length > 1) throw failure('PROJECT_MARKETPLACE_DUPLICATE');
  let marketplaceState = 'missing';
  if (marketplaceEntries.length === 1) {
    const registeredRoot = marketplaceEntries[0].root;
    if (typeof registeredRoot !== 'string' || !path.isAbsolute(registeredRoot)) {
      throw failure('CODEX_MARKETPLACE_LIST_INVALID');
    }
    let canonicalRegisteredRoot;
    try { canonicalRegisteredRoot = fs.realpathSync(registeredRoot); }
    catch { canonicalRegisteredRoot = null; }
    marketplaceState = canonicalRegisteredRoot === root ? 'ready' : 'root-conflict';
  }
  const blockers = marketplaceState === 'root-conflict' ? ['PROJECT_MARKETPLACE_ROOT_CONFLICT'] : [];
  const allPlugins = [...state.installed, ...state.available];
  for (const item of allPlugins) {
    if (item?.marketplaceName === 'personal' && AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.includes(item.name)) {
      if (typeof item.enabled !== 'boolean') throw failure('CODEX_PLUGIN_LIST_INVALID');
      if (item.enabled) blockers.push(`PERSONAL_PLUGIN_ENABLED_CONFLICT:${item.name}`);
    }
  }
  const pluginStates = expected.map((plugin) => {
    const matches = state.installed.filter(item => item?.marketplaceName === PROJECT_PLUGIN_MARKETPLACE
      && item?.name === plugin.name);
    if (matches.length > 1) throw failure(`PROJECT_PLUGIN_DUPLICATE:${plugin.selector}`);
    if (matches.length === 0) return { ...plugin, installedVersion: null, enabled: null,
      cacheState: cacheMismatches.has(plugin.selector) ? 'mismatch' : 'matched', state: 'missing', action: 'add' };
    const installed = matches[0];
    if (installed.installed !== true || typeof installed.enabled !== 'boolean'
      || typeof installed.version !== 'string' || installed.pluginId !== plugin.selector) {
      throw failure('CODEX_PLUGIN_LIST_INVALID');
    }
    if (!installed.enabled) {
      blockers.push(`PROJECT_PLUGIN_DISABLED:${plugin.selector}`);
      return { ...plugin, installedVersion: installed.version, enabled: false,
        cacheState: cacheMismatches.has(plugin.selector) ? 'mismatch' : 'matched', state: 'disabled', action: 'blocked' };
    }
    if (installed.version !== plugin.expectedVersion) {
      return { ...plugin, installedVersion: installed.version, enabled: true,
        cacheState: cacheMismatches.has(plugin.selector) ? 'mismatch' : 'matched', state: 'version-mismatch', action: 'add' };
    }
    if (cacheMismatches.has(plugin.selector)) {
      return { ...plugin, installedVersion: installed.version, enabled: true,
        cacheState: 'mismatch', state: 'cache-mismatch', action: 'add' };
    }
    return { ...plugin, installedVersion: installed.version, enabled: true,
      cacheState: 'matched', state: 'ready', action: 'none' };
  });
  return {
    marketplaceState,
    pluginStates,
    blockers: [...new Set(blockers)],
    ready: marketplaceState === 'ready' && blockers.length === 0
      && pluginStates.every(plugin => plugin.state === 'ready'),
  };
};

const report = ({ root, mode, status, inspection, expected, attempted = 0, succeeded = 0,
  newTaskRequired = false, failures = [] }) => ({
  schemaVersion: 1,
  reportType: PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE,
  mode,
  status,
  ok: ['ready', 'applied', 'lock-written'].includes(status),
  marketplace: {
    name: PROJECT_PLUGIN_MARKETPLACE,
    expectedRoot: root,
    state: inspection?.marketplaceState ?? (mode === 'write-lock' ? 'not-queried' : 'unknown'),
  },
  plugins: (inspection?.pluginStates ?? expected.map(plugin => ({
    ...plugin, installedVersion: null, enabled: null, cacheState: 'unknown', state: 'unknown', action: 'none',
  }))).map(plugin => ({
    selector: plugin.selector,
    expectedVersion: plugin.expectedVersion,
    installedVersion: plugin.installedVersion,
    enabled: plugin.enabled,
    cacheState: plugin.cacheState,
    state: plugin.state,
    action: plugin.action,
  })),
  mutations: { attempted, succeeded },
  newTaskRequired,
  failures: failures.slice(0, MAX_FAILURES),
});

const runMutation = async ({ command, validate, attempted, succeeded }) => {
  attempted.count += 1;
  const value = await command();
  validate(value);
  succeeded.count += 1;
  return value;
};

const validateMarketplaceAdd = (value, root) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.marketplaceName !== PROJECT_PLUGIN_MARKETPLACE || typeof value.installedRoot !== 'string'
    || typeof value.alreadyAdded !== 'boolean') throw failure('CODEX_MARKETPLACE_ADD_INVALID');
  let installedRoot;
  try { installedRoot = fs.realpathSync(value.installedRoot); }
  catch { throw failure('CODEX_MARKETPLACE_ADD_INVALID'); }
  if (installedRoot !== root) throw failure('CODEX_MARKETPLACE_ADD_INVALID');
};
const validatePluginAdd = (value, plugin) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.pluginId !== plugin.selector || value.name !== plugin.name
    || value.marketplaceName !== PROJECT_PLUGIN_MARKETPLACE
    || value.version !== plugin.expectedVersion) throw failure('CODEX_PLUGIN_ADD_INVALID');
};

export const runProjectPluginLifecycle = async ({
  rootDir,
  mode = 'check',
  codexBinary = resolveCodexBinary(),
  runCommand = runCodexJsonCommand,
  codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex'),
  inspectCache = inspectProjectPluginCache,
  validateSource = validateProjectPluginSource,
}) => {
  let root;
  let expected = AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => ({
    name, selector: `${name}@${PROJECT_PLUGIN_MARKETPLACE}`, expectedVersion: null,
  }));
  let inspection;
  const attempted = { count: 0 };
  const succeeded = { count: 0 };
  try {
    root = projectRoot(rootDir);
    expected = readExpectedPlugins(root);
    if (!['check', 'apply'].includes(mode)) throw failure('LIFECYCLE_MODE_INVALID');
    await validateSource(root);
    inspection = await inspectState({ root, expected, binary: codexBinary, runCommand, inspectCache, codexHome });
    if (inspection.blockers.length > 0) {
      return report({ root, mode, status: 'blocked', inspection, expected, failures: inspection.blockers });
    }
    if (inspection.ready) return report({ root, mode, status: 'ready', inspection, expected });
    if (mode === 'check') return report({ root, mode, status: 'needs-apply', inspection, expected });
    if (inspection.marketplaceState === 'missing') {
      await runMutation({ attempted, succeeded, validate: value => validateMarketplaceAdd(value, root),
        command: () => runCommand({
        binary: codexBinary,
        cwd: root,
        args: ['plugin', 'marketplace', 'add', root, '--json'],
      }) });
      inspection = await inspectState({ root, expected, binary: codexBinary, runCommand, inspectCache, codexHome });
      if (inspection.blockers.length > 0 || inspection.marketplaceState !== 'ready') {
        return report({ root, mode, status: 'blocked', inspection, expected,
          attempted: attempted.count, succeeded: succeeded.count, newTaskRequired: true,
          failures: [...inspection.blockers, 'PROJECT_MARKETPLACE_POSTCHECK_FAILED'] });
      }
    }
    for (const plugin of inspection.pluginStates.filter(item => item.action === 'add')) {
      await runMutation({ attempted, succeeded, validate: value => validatePluginAdd(value, plugin),
        command: () => runCommand({
        binary: codexBinary,
        cwd: root,
        args: ['plugin', 'add', plugin.selector, '--json'],
      }) });
    }
    inspection = await inspectState({ root, expected, binary: codexBinary, runCommand, inspectCache, codexHome });
    if (!inspection.ready) {
      return report({ root, mode, status: 'blocked', inspection, expected,
        attempted: attempted.count, succeeded: succeeded.count, newTaskRequired: attempted.count > 0,
        failures: [...inspection.blockers, 'PROJECT_PLUGIN_POSTCHECK_FAILED'] });
    }
    return report({ root, mode, status: 'applied', inspection, expected,
      attempted: attempted.count, succeeded: succeeded.count, newTaskRequired: attempted.count > 0 });
  } catch (error) {
    return report({ root: root ?? path.resolve(rootDir), mode, status: 'blocked', inspection, expected,
      attempted: attempted.count, succeeded: succeeded.count, newTaskRequired: attempted.count > 0,
      failures: [failureCode(error)] });
  }
};

export const listGitProjectPluginFiles = async ({ rootDir, spawnImpl = spawn }) => {
  let output;
  try {
    output = await captureCommand({
      binary: 'git',
      args: ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--',
        ...AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => `plugins/${name}`)],
      cwd: rootDir,
      spawnImpl,
    });
  } catch { throw failure('GIT_PLUGIN_INVENTORY_FAILED'); }
  return new Set(output.toString('utf8').split('\0').filter(Boolean).map(posixPath));
};

const atomicWriteJson = (file, value) => {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}-${randomUUID()}`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o644);
    fs.writeFileSync(descriptor, serializeProjectPluginLock(value));
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
  } catch {
    if (descriptor !== undefined) try { fs.closeSync(descriptor); } catch {}
    try { fs.rmSync(temporary, { force: true }); } catch {}
    throw failure('PROJECT_PLUGIN_LOCK_ATOMIC_WRITE_FAILED');
  }
};

const inlineRecord = value => `{ ${Object.entries(value).map(([key, item]) => (
  `${JSON.stringify(key)}: ${JSON.stringify(item)}`
)).join(', ')} }`;

const serializeProjectPluginLock = lock => [
  '{',
  `  "schemaVersion": ${JSON.stringify(lock.schemaVersion)},`,
  `  "lockVersion": ${JSON.stringify(lock.lockVersion)},`,
  `  "digestAlgorithm": ${JSON.stringify(lock.digestAlgorithm)},`,
  `  "trustBoundary": ${JSON.stringify(lock.trustBoundary)},`,
  '  "plugins": [',
  ...lock.plugins.flatMap((plugin, pluginIndex) => [
    '    {',
    `      "selector": ${JSON.stringify(plugin.selector)},`,
    `      "manifestVersion": ${JSON.stringify(plugin.manifestVersion)},`,
    `      "source": ${JSON.stringify(plugin.source)},`,
    '      "files": [',
    ...plugin.files.map((fileRecord, fileIndex) => (
      `        ${inlineRecord(fileRecord)}${fileIndex === plugin.files.length - 1 ? '' : ','}`
    )),
    '      ],',
    `      "treeSha256": ${JSON.stringify(plugin.treeSha256)}`,
    `    }${pluginIndex === lock.plugins.length - 1 ? '' : ','}`,
  ]),
  '  ]',
  '}',
  '',
].join('\n');

const parseSemver = (value) => {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value ?? '');
  if (!match) return null;
  return { core: match.slice(1, 4).map(Number), prerelease: match[4]?.split('.') ?? null };
};
const comparePrerelease = (left, right) => {
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (left[index] === undefined || right[index] === undefined) return left[index] === undefined ? -1 : 1;
    if (left[index] === right[index]) continue;
    const leftNumeric = /^\d+$/.test(left[index]);
    const rightNumeric = /^\d+$/.test(right[index]);
    if (leftNumeric && rightNumeric) return Number(left[index]) > Number(right[index]) ? 1 : -1;
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return left[index] > right[index] ? 1 : -1;
  }
  return 0;
};
const isSemverIncrement = (previous, candidate) => {
  const left = parseSemver(previous);
  const right = parseSemver(candidate);
  if (!left || !right) return false;
  for (let index = 0; index < 3; index += 1) {
    if (left.core[index] !== right.core[index]) return right.core[index] > left.core[index];
  }
  return comparePrerelease(right.prerelease, left.prerelease) > 0;
};

export const writeProjectPluginLockLifecycle = async ({
  rootDir,
  listInventory = listGitProjectPluginFiles,
}) => {
  let root;
  let expected = AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => ({
    name, selector: `${name}@${PROJECT_PLUGIN_MARKETPLACE}`, expectedVersion: null,
  }));
  try {
    root = projectRoot(rootDir);
    expected = readExpectedPlugins(root);
    const { buildProjectPluginLock, collectProjectPluginLockShapeFailures, PROJECT_PLUGIN_LOCK_PATH } = await import(
      './aiGovernanceProjectPluginLock.mjs'
    );
    const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
    const stat = fs.lstatSync(lockFile);
    if (!stat.isFile() || stat.isSymbolicLink()) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
    let previous;
    try { previous = JSON.parse(fs.readFileSync(lockFile, 'utf8')); }
    catch { throw failure('PROJECT_PLUGIN_LOCK_INVALID'); }
    if (collectProjectPluginLockShapeFailures(previous).length > 0) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
    const candidate = buildProjectPluginLock(root);
    const selectors = candidate.plugins.map(plugin => plugin.selector);
    if (JSON.stringify(previous.plugins.map(plugin => plugin.selector)) !== JSON.stringify(selectors)) {
      throw failure('PROJECT_PLUGIN_LOCK_INVALID');
    }
    const inventory = await listInventory({ rootDir: root });
    if (!(inventory instanceof Set)) throw failure('GIT_PLUGIN_INVENTORY_INVALID');
    const candidateFiles = new Set(candidate.plugins.flatMap(plugin => (
      plugin.files.map(file => `${plugin.source}/${file.path}`)
    )));
    if (candidateFiles.size !== inventory.size || [...candidateFiles].some(file => !inventory.has(file))) {
      throw failure('PROJECT_PLUGIN_LOCK_SOURCE_NOT_IN_GIT_INVENTORY');
    }
    const stableCandidate = buildProjectPluginLock(root);
    if (JSON.stringify(stableCandidate) !== JSON.stringify(candidate)) throw failure('PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE');
    if (JSON.stringify(previous) === JSON.stringify(candidate)) {
      const inspection = { marketplaceState: 'not-queried', pluginStates: expected.map(plugin => ({
        ...plugin, installedVersion: null, enabled: null, cacheState: 'not-queried', state: 'lock-unchanged', action: 'none',
      })) };
      return report({ root, mode: 'write-lock', status: 'ready', inspection, expected });
    }
    const previousBySelector = new Map(previous.plugins.map(plugin => [plugin.selector, plugin]));
    const invalidVersion = candidate.plugins.find((plugin) => {
      const previousPlugin = previousBySelector.get(plugin.selector);
      return JSON.stringify(previousPlugin) !== JSON.stringify(plugin)
        && !isSemverIncrement(previousPlugin?.manifestVersion, plugin.manifestVersion);
    });
    if (invalidVersion) throw failure(`PROJECT_PLUGIN_VERSION_CHANGE_REQUIRED:${invalidVersion.selector}`);
    atomicWriteJson(lockFile, candidate);
    if (JSON.stringify(JSON.parse(fs.readFileSync(lockFile, 'utf8'))) !== JSON.stringify(candidate)) {
      throw failure('PROJECT_PLUGIN_LOCK_POSTCHECK_FAILED');
    }
    const inspection = { marketplaceState: 'not-queried', pluginStates: expected.map(plugin => ({
      ...plugin, installedVersion: null, enabled: null, cacheState: 'not-queried', state: 'lock-written', action: 'none',
    })) };
    return report({ root, mode: 'write-lock', status: 'lock-written', inspection, expected,
      attempted: 1, succeeded: 1 });
  } catch (error) {
    return report({ root: root ?? path.resolve(rootDir), mode: 'write-lock', status: 'blocked', expected,
      failures: [failureCode(error)] });
  }
};
