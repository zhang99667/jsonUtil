import fs from 'node:fs';
import path from 'node:path';

import {
  collectInstalledProjectPluginFailures,
  collectProjectPluginLockFailures,
} from './aiGovernanceProjectPluginLock.mjs';
import {
  PROJECT_PLUGIN_MARKETPLACE,
  projectPluginLifecycleFailure as failure,
} from './aiGovernanceProjectPluginLifecycleContract.mjs';
import { isStrictSemver } from './aiGovernanceSemver.mjs';

const lstatIfExists = (target) => {
  try { return fs.lstatSync(target); }
  catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
  }
};

const readDirectory = (target) => {
  try { return fs.readdirSync(target, { withFileTypes: true }); }
  catch { throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE'); }
};

export const projectPluginCacheRoot = (codexHome) => {
  let absolute;
  try { absolute = path.resolve(codexHome); }
  catch { throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE'); }
  let canonicalHome = absolute;
  try { canonicalHome = fs.realpathSync(absolute); }
  catch (error) {
    if (error?.code !== 'ENOENT') throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
  }
  return path.join(canonicalHome, 'plugins/cache', PROJECT_PLUGIN_MARKETPLACE);
};

export const inspectProjectPluginCache = async ({ root, expected, codexHome }) => {
  if (collectProjectPluginLockFailures(root).length > 0) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
  const cacheRoot = projectPluginCacheRoot(codexHome);
  const canonicalHome = path.dirname(path.dirname(path.dirname(cacheRoot)));
  for (const ancestor of [path.join(canonicalHome, 'plugins'), path.dirname(cacheRoot), cacheRoot]) {
    const stat = lstatIfExists(ancestor);
    if (stat && (!stat.isDirectory() || stat.isSymbolicLink())) {
      throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
    }
  }

  const installedRoots = new Map();
  if (lstatIfExists(cacheRoot)) {
    const expectedNames = new Set(expected.map(plugin => plugin.name));
    const cacheEntries = readDirectory(cacheRoot);
    if (cacheEntries.some(entry => !expectedNames.has(entry.name)
      || !entry.isDirectory() || entry.isSymbolicLink())) {
      throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
    }
    for (const plugin of expected) {
      const pluginRoot = path.join(cacheRoot, plugin.name);
      const pluginStat = lstatIfExists(pluginRoot);
      if (!pluginStat) continue;
      if (!pluginStat.isDirectory() || pluginStat.isSymbolicLink()) {
        throw failure('PROJECT_PLUGIN_CACHE_PATH_UNSAFE');
      }
      const entries = readDirectory(pluginRoot);
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
