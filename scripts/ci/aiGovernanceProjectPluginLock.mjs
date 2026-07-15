import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginFiles.mjs';

export const PROJECT_PLUGIN_LOCK_PATH = '.agents/plugins/plugin-lock.json';

const LOCK_FIELDS = ['schemaVersion', 'lockVersion', 'digestAlgorithm', 'trustBoundary', 'plugins'];
const PLUGIN_FIELDS = ['selector', 'manifestVersion', 'source', 'files', 'treeSha256'];
const FILE_FIELDS = ['path', 'gitMode', 'size', 'sha256'];
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));
const exactFields = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && JSON.stringify(Object.keys(value)) === JSON.stringify(fields);

const listPluginFiles = (sourceRoot, sourceLabel) => {
  const files = [];
  const caseFoldedPaths = new Set();
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => compareUtf8(left.name, right.name))
    .forEach((entry) => {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(sourceRoot, absolute).split(path.sep).join('/');
      const label = `${sourceLabel}/${relative}`;
      if (relative !== relative.normalize('NFC') || relative.includes('\\') || relative.includes('\0')) {
        throw new Error(`${label}: plugin lock 路径必须是 NFC POSIX 相对路径`);
      }
      const caseFolded = relative.toLocaleLowerCase('en-US');
      if (caseFoldedPaths.has(caseFolded)) throw new Error(`${label}: plugin lock 拒绝大小写冲突路径`);
      caseFoldedPaths.add(caseFolded);
      if (entry.isSymbolicLink()) throw new Error(`${label}: plugin lock 不接受符号链接`);
      if (entry.isDirectory()) return walk(absolute);
      if (!entry.isFile()) throw new Error(`${label}: plugin lock 只接受普通文件`);
      const stat = fs.statSync(absolute);
      const content = fs.readFileSync(absolute);
      files.push({
        path: relative,
        gitMode: (stat.mode & 0o111) === 0 ? '100644' : '100755',
        size: stat.size,
        sha256: sha256(content),
      });
    });
  walk(sourceRoot);
  return files.sort((left, right) => compareUtf8(left.path, right.path));
};

const buildPluginRecordFromSource = ({ sourceRoot, name, source }) => {
  const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, '.codex-plugin/plugin.json'), 'utf8'));
  const files = listPluginFiles(sourceRoot, source);
  return {
    selector: `${name}@jsonutils-project`,
    manifestVersion: manifest.version,
    source,
    files,
    treeSha256: sha256(`jsonutils.project-plugin-tree/v1\0${JSON.stringify(files)}`),
  };
};

const buildPluginRecord = (rootDir, name) => {
  const source = `plugins/${name}`;
  return buildPluginRecordFromSource({ sourceRoot: path.join(rootDir, source), name, source });
};

export const buildProjectPluginLock = rootDir => ({
  schemaVersion: 1,
  lockVersion: '1.0.0',
  digestAlgorithm: 'sha256',
  trustBoundary: 'repository-content-locked',
  plugins: AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map(name => buildPluginRecord(rootDir, name)),
});

export const readProjectPluginLock = (rootDir, lockPath = PROJECT_PLUGIN_LOCK_PATH) => (
  JSON.parse(fs.readFileSync(path.join(rootDir, lockPath), 'utf8'))
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

export const collectProjectPluginLockFailures = (rootDir) => {
  let actual;
  try { actual = readProjectPluginLock(rootDir); }
  catch { return [`${PROJECT_PLUGIN_LOCK_PATH}: 必须是可读的合法 JSON`]; }
  const failures = collectProjectPluginLockShapeFailures(actual);
  let expected;
  try { expected = buildProjectPluginLock(rootDir); }
  catch (error) { return [...failures, error.message]; }
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures.push(`${PROJECT_PLUGIN_LOCK_PATH}: 必须与三个项目插件的完整文件集、Git mode、size、SHA-256 和 tree digest 精确一致`);
  }
  return failures;
};

export const collectInstalledProjectPluginFailures = ({ rootDir, cacheRoot }) => {
  const lock = readProjectPluginLock(rootDir);
  const failures = collectProjectPluginLockShapeFailures(lock);
  for (const plugin of lock.plugins ?? []) {
    const name = plugin.selector?.split('@')[0];
    const installedRoot = path.join(cacheRoot, name ?? '', plugin.manifestVersion ?? '');
    let installed;
    try { installed = buildPluginRecordFromSource({ sourceRoot: installedRoot, name, source: plugin.source }); }
    catch {
      failures.push(`${plugin.selector}: 安装副本缺失或不可读`);
      continue;
    }
    if (JSON.stringify(installed) !== JSON.stringify(plugin)) failures.push(`${plugin.selector}: 安装副本与项目 content lock 不一致`);
  }
  return failures;
};
