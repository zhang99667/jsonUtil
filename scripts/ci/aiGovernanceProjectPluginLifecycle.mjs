import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { captureProjectPluginCommand } from './aiGovernanceProjectPluginCommand.mjs';
import { buildProjectPluginLock } from './aiGovernanceProjectPluginLock.mjs';
import {
  buildProjectPluginLifecycleReport as report,
  emptyProjectPluginDescriptors,
  PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE,
  PROJECT_PLUGIN_MARKETPLACE,
  projectPluginLifecycleFailure as failure,
  projectPluginLifecycleFailureCode as failureCode,
  projectPluginLifecycleReportRoot,
  readExpectedProjectPlugins,
} from './aiGovernanceProjectPluginLifecycleContract.mjs';
import { isStrictSemver } from './aiGovernanceSemver.mjs';
import {
  captureProjectPluginTree,
  sameProjectPluginTreeSnapshots,
} from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

export { PROJECT_PLUGIN_LIFECYCLE_REPORT_TYPE, PROJECT_PLUGIN_MARKETPLACE };
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
    if (failureCode(error) !== 'LIFECYCLE_INTERNAL_ERROR') throw error;
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
  let expected = emptyProjectPluginDescriptors();
  let inspection;
  let sourceSnapshot;
  const attempted = { count: 0 };
  const succeeded = { count: 0 };
  const addedRoots = new Map();
  try {
    root = projectRoot(rootDir);
    if (!['check', 'apply'].includes(mode)) throw failure('LIFECYCLE_MODE_INVALID');
    sourceSnapshot = await projectPluginSourceSnapshot(root, validateSource);
    expected = readExpectedProjectPlugins(sourceSnapshot.sourceSnapshot);
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
    return report({ root: projectPluginLifecycleReportRoot(root, rootDir), mode, status: 'blocked', inspection, expected,
      attempted: attempted.count, succeeded: succeeded.count, newTaskRequired: attempted.count > 0,
      failures: [failureCode(error)] });
  }
};
