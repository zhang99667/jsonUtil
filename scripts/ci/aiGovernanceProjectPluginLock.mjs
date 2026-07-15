import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import {
  capturePluginSourceTree,
  captureProjectPluginTree,
} from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

export const PROJECT_PLUGIN_LOCK_PATH = '.agents/plugins/plugin-lock.json';

const LOCK_FIELDS = ['schemaVersion', 'lockVersion', 'digestAlgorithm', 'trustBoundary', 'plugins'];
const PLUGIN_FIELDS = ['selector', 'manifestVersion', 'source', 'files', 'treeSha256'];
const FILE_FIELDS = ['path', 'gitMode', 'size', 'sha256'];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const exactFields = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(fields);
const buildPluginRecordFromSnapshot = ({ name, source, manifestVersion, files }) => {
  const lockFiles = files.map(({ path: filePath, gitMode, size, sha256: digest }) => ({
    path: filePath, gitMode, size, sha256: digest,
  }));
  return {
    selector: `${name}@jsonutils-project`,
    manifestVersion,
    source,
    files: lockFiles,
    treeSha256: sha256(`jsonutils.project-plugin-tree/v1\0${JSON.stringify(lockFiles)}`),
  };
};

export const buildProjectPluginLock = (rootDir, snapshot = captureProjectPluginTree(rootDir)) => ({
  schemaVersion: 1,
  lockVersion: '1.0.0',
  digestAlgorithm: 'sha256',
  trustBoundary: 'repository-content-locked',
  plugins: snapshot.plugins.map(buildPluginRecordFromSnapshot),
});

export const readProjectPluginLock = (rootDir, lockPath = PROJECT_PLUGIN_LOCK_PATH) => (
  JSON.parse(fs.readFileSync(resolveProjectPluginRepositoryPath(rootDir, lockPath), 'utf8'))
);

export const collectProjectPluginLockShapeFailures = (lock) => {
  const failures = [];
  if (!exactFields(lock, LOCK_FIELDS) || lock.schemaVersion !== 1 || lock.lockVersion !== '1.0.0'
    || lock.digestAlgorithm !== 'sha256' || lock.trustBoundary !== 'repository-content-locked'
    || !Array.isArray(lock.plugins)) failures.push(`${PROJECT_PLUGIN_LOCK_PATH}: 根契约或 trust boundary 非法`);
  for (const plugin of lock.plugins ?? []) {
    if (!exactFields(plugin, PLUGIN_FIELDS) || !Array.isArray(plugin.files)) failures.push(`${PROJECT_PLUGIN_LOCK_PATH}: plugin record 必须闭字段`);
    for (const file of plugin.files ?? []) if (!exactFields(file, FILE_FIELDS)) failures.push(`${PROJECT_PLUGIN_LOCK_PATH}: file record 必须闭字段`);
  }
  return failures;
};

export const collectProjectPluginLockFailures = (rootDir, { sourceSnapshot } = {}) => {
  let actual;
  try { actual = readProjectPluginLock(rootDir); }
  catch { return [`${PROJECT_PLUGIN_LOCK_PATH}: 必须是可读的合法 JSON`]; }
  const failures = collectProjectPluginLockShapeFailures(actual);
  let expected;
  try { expected = buildProjectPluginLock(rootDir, sourceSnapshot); }
  catch (error) { return [...failures, error.message]; }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${PROJECT_PLUGIN_LOCK_PATH}: 必须与三个项目插件的完整文件集、Git mode、size、SHA-256 和 tree digest 精确一致`);
  }
  return failures;
};

const installedPluginRoot = ({ codexHome, name, manifestVersion }) => {
  let current = fs.realpathSync(codexHome);
  for (const segment of ['plugins', 'cache', 'jsonutils-project', name]) {
    current = path.join(current, segment);
    const stat = fs.lstatSync(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
  }
  const pluginRoot = current;
  const entries = fs.readdirSync(pluginRoot, { withFileTypes: true });
  const allowed = new Set(['local', manifestVersion]);
  if (entries.length !== 1 || !allowed.has(entries[0].name)
    || !entries[0].isDirectory() || entries[0].isSymbolicLink()) throw new Error();
  return path.join(pluginRoot, entries[0].name);
};

export const collectInstalledProjectPluginFailures = ({ rootDir, codexHome }) => {
  const sourceFailures = collectProjectPluginLockFailures(rootDir);
  if (sourceFailures.length > 0) return sourceFailures;
  const lock = readProjectPluginLock(rootDir);
  const failures = collectProjectPluginLockShapeFailures(lock);
  for (const plugin of lock.plugins ?? []) {
    const selector = /^([a-z0-9-]+)@jsonutils-project$/.exec(plugin.selector ?? '');
    const name = selector?.[1];
    if (!name || !AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.includes(name)) {
      failures.push(`${plugin.selector}: selector 不在项目插件 allowlist`);
      continue;
    }
    let installed;
    try {
      const sourceRoot = installedPluginRoot({ codexHome, name, manifestVersion: plugin.manifestVersion });
      installed = buildPluginRecordFromSnapshot(capturePluginSourceTree({
        sourceRoot, name, source: plugin.source,
      }));
    }
    catch {
      failures.push(`${plugin.selector}: 安装副本缺失、路径不安全或 cache 布局不唯一`);
      continue;
    }
    if (JSON.stringify(installed) !== JSON.stringify(plugin)) failures.push(`${plugin.selector}: 安装副本与项目 content lock 不一致`);
  }
  return failures;
};
