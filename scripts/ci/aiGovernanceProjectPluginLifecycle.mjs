import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { captureProjectPluginCommand } from './aiGovernanceProjectPluginCommand.mjs';
import { buildProjectPluginLock } from './aiGovernanceProjectPluginLock.mjs';
import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import { isStrictSemver, isStrictSemverIncrement } from './aiGovernanceSemver.mjs';
import {
  captureProjectPluginTree,
  sameProjectPluginTreeSnapshots,
} from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

export const PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE = 'jsonutils-project-plugin-lifecycle';
export const PROJECT_PLUGIN_MARKETPLACE = 'jsonutils-project';

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
const lstatIfExists = (target) => {
  try { return fs.lstatSync(target); }
  catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
  }
};
const projectPluginCacheRoot = (codexHome) => {
  const absolute = path.resolve(codexHome);
  let canonicalHome = absolute;
  try { canonicalHome = fs.realpathSync(absolute); }
  catch (error) {
    if (error?.code !== 'ENOENT') throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
  }
  return path.join(canonicalHome, 'plugins/cache', PROJECT_PLUGIN_MARKETPLACE);
};

export const runCodexJsonCommand = async options => {
  let output;
  try { output = await captureProjectPluginCommand(options); }
  catch (error) { throw failure(`CODEX_${typeof error?.code === 'string' ? error.code : 'COMMAND_INTERNAL_ERROR'}`); }
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

const readExpectedPlugins = (sourceSnapshot) => AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map((name) => {
  const plugin = sourceSnapshot.plugins.find(candidate => candidate.name === name);
  if (!plugin || plugin.manifestName !== name || !isStrictSemver(plugin.manifestVersion)) {
    throw failure(`PROJECT_PLUGIN_MANIFEST_INVALID:${name}`);
  }
  return Object.freeze({
    name, selector: `${name}@${PROJECT_PLUGIN_MARKETPLACE}`, expectedVersion: plugin.manifestVersion,
  });
});

const isPluginListEntry = (item, installed) => item && typeof item === 'object' && !Array.isArray(item)
  && typeof item.name === 'string' && item.name.length > 0
  && typeof item.marketplaceName === 'string' && item.marketplaceName.length > 0
  && item.pluginId === `${item.name}@${item.marketplaceName}`
  && typeof item.version === 'string' && item.version.length > 0
  && (!AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.includes(item.name) || isStrictSemver(item.version))
  && item.installed === installed && typeof item.enabled === 'boolean';
const isMarketplaceEntry = entry => entry && typeof entry === 'object' && !Array.isArray(entry)
  && typeof entry.name === 'string' && entry.name.length > 0
  && typeof entry.root === 'string' && path.isAbsolute(entry.root);

export const validateProjectPluginSource = async (root, { sourceSnapshot } = {}) => {
  const { collectProjectPluginFailures } = await import('./aiGovernanceProjectPlugins.mjs');
  if (collectProjectPluginFailures(root, { checkEntryVersions: false, sourceSnapshot }).length > 0) {
    throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID');
  }
};
const projectPluginSourceSnapshot = async (root, validateSource) => {
  try {
    const sourceSnapshot = captureProjectPluginTree(root);
    await validateSource(root, { sourceSnapshot });
    return Object.freeze({ sourceSnapshot, lock: JSON.stringify(buildProjectPluginLock(root, sourceSnapshot)) });
  } catch (error) {
    if (error instanceof LifecycleFailure) throw error;
    throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID');
  }
};
const assertProjectPluginSourceStable = async (root, snapshot, validateSource) => {
  let current;
  try {
    current = await projectPluginSourceSnapshot(root, validateSource);
  } catch {
    throw failure('PROJECT_PLUGIN_SOURCE_CHANGED_DURING_LIFECYCLE');
  }
  if (current.lock !== snapshot.lock
    || !sameProjectPluginTreeSnapshots(current.sourceSnapshot, snapshot.sourceSnapshot)) {
    throw failure('PROJECT_PLUGIN_SOURCE_CHANGED_DURING_LIFECYCLE');
  }
};

const queryCodexState = async ({ root, expected, binary, runCommand }) => {
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
  const projectEntries = [...plugins.installed, ...plugins.available]
    .filter(item => item.marketplaceName === PROJECT_PLUGIN_MARKETPLACE);
  if (projectEntries.some(item => !expected.some(plugin => plugin.selector === item.pluginId))) {
    throw failure('CODEX_PLUGIN_LIST_INVALID');
  }
  for (const plugin of expected) {
    const matches = projectEntries.filter(item => item.pluginId === plugin.selector);
    if (matches.length !== 1 || (!matches[0].installed && matches[0].version !== plugin.expectedVersion)) {
      throw failure('CODEX_PLUGIN_LIST_INVALID');
    }
  }
  return { marketplaces: marketplaces.marketplaces, installed: plugins.installed, available: plugins.available };
};

export const inspectProjectPluginCache = async ({ root, expected, codexHome }) => {
  const { collectInstalledProjectPluginFailures, collectProjectPluginLockFailures } = await import(
    './aiGovernanceProjectPluginLock.mjs'
  );
  if (collectProjectPluginLockFailures(root).length > 0) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
  const cacheRoot = projectPluginCacheRoot(codexHome);
  const canonicalHome = path.dirname(path.dirname(path.dirname(cacheRoot)));
  for (const ancestor of [path.join(canonicalHome, 'plugins'), path.dirname(cacheRoot), cacheRoot]) {
    const ancestorStat = lstatIfExists(ancestor);
    if (!ancestorStat) continue;
    if (!ancestorStat.isDirectory() || ancestorStat.isSymbolicLink()) throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
  }
  const installedRoots = new Map();
  if (lstatIfExists(cacheRoot)) {
    for (const plugin of expected) {
      const pluginRoot = path.join(cacheRoot, plugin.name);
      const pluginStat = lstatIfExists(pluginRoot);
      if (pluginStat) {
        if (!pluginStat.isDirectory() || pluginStat.isSymbolicLink()) {
          throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
        }
      }
      if (!pluginStat) continue;
      const entries = fs.readdirSync(pluginRoot, { withFileTypes: true });
      if (entries.length > 1 || entries.some(entry => (entry.name !== 'local' && !isStrictSemver(entry.name))
        || !entry.isDirectory() || entry.isSymbolicLink())) {
        throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
      }
      if (entries.length === 1) installedRoots.set(plugin.selector, path.join(pluginRoot, entries[0].name));
    }
  }
  let failures;
  try { failures = collectInstalledProjectPluginFailures({ rootDir: root, codexHome }); }
  catch { throw failure('PROJECT_PLUGIN_CACHE_UNKNOWN'); }
  const mismatches = new Set();
  for (const item of failures) {
    const plugin = expected.find(candidate => item.startsWith(`${candidate.selector}:`));
    if (!plugin) throw failure('PROJECT_PLUGIN_CACHE_UNKNOWN');
    mismatches.add(plugin.selector);
  }
  return { mismatches, installedRoots };
};

const inspectState = async ({ root, expected, binary, runCommand, inspectCache, codexHome }) => {
  const state = await queryCodexState({ root, expected, binary, runCommand });
  const cacheInspection = await inspectCache({ root, expected, codexHome });
  const cacheMismatches = cacheInspection instanceof Set ? cacheInspection : cacheInspection?.mismatches;
  const installedRoots = cacheInspection instanceof Set ? new Map() : cacheInspection?.installedRoots;
  if (!(cacheMismatches instanceof Set) || !(installedRoots instanceof Map)) {
    throw failure('PROJECT_PLUGIN_CACHE_UNKNOWN');
  }
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
    if (matches.length === 0) return { ...plugin, installedVersion: null, installedRoot: null, enabled: null,
      cacheState: cacheMismatches.has(plugin.selector) ? 'mismatch' : 'matched', state: 'missing', action: 'add' };
    const installed = matches[0];
    if (installed.installed !== true || typeof installed.enabled !== 'boolean'
      || typeof installed.version !== 'string' || installed.pluginId !== plugin.selector) {
      throw failure('CODEX_PLUGIN_LIST_INVALID');
    }
    if (!installed.enabled) {
      blockers.push(`PROJECT_PLUGIN_DISABLED:${plugin.selector}`);
      return { ...plugin, installedVersion: installed.version, installedRoot: installedRoots.get(plugin.selector) ?? null, enabled: false,
        cacheState: cacheMismatches.has(plugin.selector) ? 'mismatch' : 'matched', state: 'disabled', action: 'blocked' };
    }
    if (installed.version !== plugin.expectedVersion) {
      return { ...plugin, installedVersion: installed.version, installedRoot: installedRoots.get(plugin.selector) ?? null, enabled: true,
        cacheState: cacheMismatches.has(plugin.selector) ? 'mismatch' : 'matched', state: 'version-mismatch', action: 'add' };
    }
    if (cacheMismatches.has(plugin.selector)) {
      return { ...plugin, installedVersion: installed.version, installedRoot: installedRoots.get(plugin.selector) ?? null, enabled: true,
        cacheState: 'mismatch', state: 'cache-mismatch', action: 'add' };
    }
    return { ...plugin, installedVersion: installed.version, installedRoot: installedRoots.get(plugin.selector) ?? null, enabled: true,
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
  trustBoundary: 'local-installation-component-only',
  taskRegistrationVerified: false,
  runtimeTrustVerified: false,
  signerTrustVerified: false,
  attestationVerified: false,
  outcomeEligible: false,
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

const runMutation = async ({ command, validate, before, after, attempted, succeeded }) => {
  await before();
  attempted.count += 1;
  const value = await command();
  await after();
  const validated = await validate(value);
  await after();
  succeeded.count += 1;
  return validated;
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
const validatePluginAdd = async (value, plugin, root, expected, codexHome) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || value.pluginId !== plugin.selector || value.name !== plugin.name
    || value.marketplaceName !== PROJECT_PLUGIN_MARKETPLACE
    || value.version !== plugin.expectedVersion || typeof value.installedPath !== 'string') {
    throw failure('CODEX_PLUGIN_ADD_INVALID');
  }
  let installedRoot;
  try { installedRoot = fs.realpathSync(value.installedPath); }
  catch { throw failure('CODEX_PLUGIN_ADD_INVALID'); }
  const cacheRoot = projectPluginCacheRoot(codexHome);
  const allowedRoots = [...new Set(['local', plugin.expectedVersion])]
    .map(item => path.join(cacheRoot, plugin.name, item));
  if (!allowedRoots.includes(installedRoot)) throw failure('CODEX_PLUGIN_ADD_INVALID');
  const cacheInspection = await inspectProjectPluginCache({ root, expected, codexHome });
  if (cacheInspection.mismatches.has(plugin.selector)
    || cacheInspection.installedRoots.get(plugin.selector) !== installedRoot) {
    throw failure('CODEX_PLUGIN_ADD_INVALID');
  }
  return installedRoot;
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
  let sourceSnapshot;
  const attempted = { count: 0 };
  const succeeded = { count: 0 };
  const addedRoots = new Map();
  try {
    root = projectRoot(rootDir);
    if (!['check', 'apply'].includes(mode)) throw failure('LIFECYCLE_MODE_INVALID');
    sourceSnapshot = await projectPluginSourceSnapshot(root, validateSource);
    expected = readExpectedPlugins(sourceSnapshot.sourceSnapshot);
    const inspectNow = () => inspectState({
      root, expected, binary: codexBinary, runCommand, inspectCache, codexHome,
    });
    const addedRootDrifted = current => [...addedRoots].some(([selector, installedRoot]) => (
      current.pluginStates.find(plugin => plugin.selector === selector)?.installedRoot !== installedRoot
    ));
    const inspectStable = async () => {
      await assertProjectPluginSourceStable(root, sourceSnapshot, validateSource);
      const first = await inspectNow();
      await assertProjectPluginSourceStable(root, sourceSnapshot, validateSource);
      const second = await inspectNow();
      await assertProjectPluginSourceStable(root, sourceSnapshot, validateSource);
      if (JSON.stringify(first) !== JSON.stringify(second)) {
        throw failure('PROJECT_PLUGIN_STATE_CHANGED_DURING_LIFECYCLE');
      }
      return second;
    };
    const beforeMutation = async predicate => {
      await assertProjectPluginSourceStable(root, sourceSnapshot, validateSource);
      const current = await inspectNow();
      await assertProjectPluginSourceStable(root, sourceSnapshot, validateSource);
      if (current.blockers.length > 0 || addedRootDrifted(current) || !predicate(current)) {
        throw failure('PROJECT_PLUGIN_STATE_CHANGED_DURING_LIFECYCLE');
      }
    };
    inspection = await inspectStable();
    if (inspection.blockers.length > 0) {
      return report({ root, mode, status: 'blocked', inspection, expected, failures: inspection.blockers });
    }
    if (inspection.ready) return report({ root, mode, status: 'ready', inspection, expected });
    if (mode === 'check') return report({ root, mode, status: 'needs-apply', inspection, expected });
    if (inspection.marketplaceState === 'missing') {
      inspection = await runMutation({ attempted, succeeded, validate: async (value) => {
        validateMarketplaceAdd(value, root);
        const current = await inspectNow();
        if (current.blockers.length > 0 || current.marketplaceState !== 'ready') {
          throw failure('PROJECT_MARKETPLACE_POSTCHECK_FAILED');
        }
        return current;
      },
        before: () => beforeMutation(current => current.marketplaceState === 'missing'),
        after: () => assertProjectPluginSourceStable(root, sourceSnapshot, validateSource),
        command: () => runCommand({
        binary: codexBinary,
        cwd: root,
        args: ['plugin', 'marketplace', 'add', root, '--json'],
      }) });
    }
    for (const plugin of inspection.pluginStates.filter(item => item.action === 'add')) {
      const verified = await runMutation({ attempted, succeeded,
        validate: async (value) => {
          const installedRoot = await validatePluginAdd(value, plugin, root, expected, codexHome);
          const current = await inspectNow();
          const installed = current.pluginStates.find(item => item.selector === plugin.selector);
          if (current.blockers.length > 0 || current.marketplaceState !== 'ready'
            || installed?.state !== 'ready' || installed.installedRoot !== installedRoot
            || addedRootDrifted(current)) throw failure('PROJECT_PLUGIN_ADD_POSTCHECK_FAILED');
          return { current, installedRoot };
        },
        before: () => beforeMutation(current => current.marketplaceState === 'ready'
          && current.pluginStates.find(item => item.selector === plugin.selector)?.action === 'add'),
        after: () => assertProjectPluginSourceStable(root, sourceSnapshot, validateSource),
        command: () => runCommand({
        binary: codexBinary,
        cwd: root,
        args: ['plugin', 'add', plugin.selector, '--json'],
      }) });
      inspection = verified.current;
      addedRoots.set(plugin.selector, verified.installedRoot);
    }
    inspection = await inspectStable();
    if (addedRootDrifted(inspection)) {
      return report({ root, mode, status: 'blocked', inspection, expected,
        attempted: attempted.count, succeeded: succeeded.count, newTaskRequired: true,
        failures: ['PROJECT_PLUGIN_ADD_PATH_POSTCHECK_FAILED'] });
    }
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
    output = await captureProjectPluginCommand({
      binary: 'git',
      args: ['ls-files', '--cached', '--others', '--exclude-standard', '-z', '--',
        ...AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => `plugins/${name}`)],
      cwd: rootDir,
      spawnImpl,
    });
  } catch { throw failure('GIT_PLUGIN_INVENTORY_FAILED'); }
  return new Set(output.toString('utf8').split('\0').filter(Boolean).map(posixPath));
};

const atomicReplaceBytes = (file, bytes) => {
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}-${randomUUID()}`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, 'wx', 0o644);
    fs.writeFileSync(descriptor, bytes);
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
const atomicWriteJson = (file, value) => atomicReplaceBytes(file, serializeProjectPluginLock(value));

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
    let sourceSnapshot;
    try { sourceSnapshot = captureProjectPluginTree(root); }
    catch { throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID'); }
    expected = readExpectedPlugins(sourceSnapshot);
    const { collectProjectPluginSourceFailures } = await import('./aiGovernanceProjectPlugins.mjs');
    if (collectProjectPluginSourceFailures(root, {
      checkEntryVersions: false, sourceSnapshot,
    }).length > 0) {
      throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID');
    }
    const { collectProjectPluginLockShapeFailures, PROJECT_PLUGIN_LOCK_PATH } = await import(
      './aiGovernanceProjectPluginLock.mjs'
    );
    const lockFile = resolveProjectPluginRepositoryPath(root, PROJECT_PLUGIN_LOCK_PATH);
    const stat = fs.lstatSync(lockFile);
    if (!stat.isFile() || stat.isSymbolicLink()) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
    let previous, previousBytes;
    try {
      previousBytes = fs.readFileSync(lockFile);
      previous = JSON.parse(previousBytes.toString('utf8'));
    }
    catch { throw failure('PROJECT_PLUGIN_LOCK_INVALID'); }
    if (collectProjectPluginLockShapeFailures(previous).length > 0) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
    const candidate = buildProjectPluginLock(root, sourceSnapshot);
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
    const stableSnapshot = captureProjectPluginTree(root);
    if (collectProjectPluginSourceFailures(root, {
      checkEntryVersions: false, sourceSnapshot: stableSnapshot,
    }).length > 0) throw failure('PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE');
    const stableCandidate = buildProjectPluginLock(root, stableSnapshot);
    if (!sameProjectPluginTreeSnapshots(sourceSnapshot, stableSnapshot)
      || JSON.stringify(stableCandidate) !== JSON.stringify(candidate)) {
      throw failure('PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE');
    }
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
        && !isStrictSemverIncrement(previousPlugin?.manifestVersion, plugin.manifestVersion);
    });
    if (invalidVersion) throw failure(`PROJECT_PLUGIN_VERSION_CHANGE_REQUIRED:${invalidVersion.selector}`);
    atomicWriteJson(lockFile, candidate);
    let postWriteFailure = null;
    try {
      const postWriteSnapshot = captureProjectPluginTree(root);
      if (!sameProjectPluginTreeSnapshots(stableSnapshot, postWriteSnapshot)
        || collectProjectPluginSourceFailures(root, {
          checkEntryVersions: false, sourceSnapshot: postWriteSnapshot,
        }).length > 0) postWriteFailure = 'PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE';
    } catch { postWriteFailure = 'PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE'; }
    try {
      const postWriteInventory = await listInventory({ rootDir: root });
      if (!(postWriteInventory instanceof Set)
        || candidateFiles.size !== postWriteInventory.size
        || [...candidateFiles].some(file => !postWriteInventory.has(file))) {
        postWriteFailure ??= 'PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE';
      }
    } catch { postWriteFailure ??= 'GIT_PLUGIN_INVENTORY_FAILED'; }
    try {
      if (JSON.stringify(JSON.parse(fs.readFileSync(lockFile, 'utf8'))) !== JSON.stringify(candidate)) {
        postWriteFailure ??= 'PROJECT_PLUGIN_LOCK_POSTCHECK_FAILED';
      }
    } catch { postWriteFailure ??= 'PROJECT_PLUGIN_LOCK_POSTCHECK_FAILED'; }
    if (postWriteFailure) {
      try {
        atomicReplaceBytes(lockFile, previousBytes);
        if (!fs.readFileSync(lockFile).equals(previousBytes)) throw new Error();
      } catch { throw failure('PROJECT_PLUGIN_LOCK_ROLLBACK_FAILED'); }
      throw failure(postWriteFailure);
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
