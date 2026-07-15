import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { readStableEvolutionSnapshotFile } from './aiGovernanceEvolutionSnapshotPrimitives.mjs';
import { validateProjectPluginManifestBytes } from './aiGovernanceProjectPluginManifestContract.mjs';
import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

const MAX_FILES = 4096;
const MAX_ENTRIES = 8192;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 64 * 1024 * 1024;
const SNAPSHOT_PROFILE = 'jsonutils-project-plugin-tree-snapshot/v2';
const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');

export const capturePluginSourceTree = ({ sourceRoot, name, source }) => {
  const files = [], directories = [];
  const caseFoldedPaths = new Set();
  let entryCount = 0;
  let totalBytes = 0;
  const walk = (directory) => {
    let entries;
    try { entries = fs.readdirSync(directory).sort(compareUtf8); }
    catch { throw new Error(`${source}: plugin lock 源码树必须可读`); }
    entries.forEach((entryName) => {
      const absolute = path.join(directory, entryName);
      const relative = path.relative(sourceRoot, absolute).split(path.sep).join('/');
      const label = `${source}/${relative}`;
      entryCount += 1;
      if (entryCount > MAX_ENTRIES) throw new Error(`${source}: plugin lock 目录项超出上限`);
      if (relative !== relative.normalize('NFC') || relative.includes('\\') || relative.includes('\0')) {
        throw new Error(`${label}: plugin lock 路径必须是 NFC POSIX 相对路径`);
      }
      const caseFolded = relative.toLocaleLowerCase('en-US');
      if (caseFoldedPaths.has(caseFolded)) throw new Error(`${label}: plugin lock 拒绝大小写冲突路径`);
      caseFoldedPaths.add(caseFolded);
      let stat;
      try { stat = fs.lstatSync(absolute); }
      catch { throw new Error(`${label}: plugin lock 路径必须可读`); }
      if (stat.isSymbolicLink()) throw new Error(`${label}: plugin lock 不接受符号链接`);
      if (stat.isDirectory()) { directories.push(relative); return walk(absolute); }
      if (!stat.isFile()) throw new Error(`${label}: plugin lock 只接受普通文件`);
      let captured;
      try { captured = readStableEvolutionSnapshotFile(sourceRoot, relative, MAX_FILE_BYTES); }
      catch { throw new Error(`${label}: plugin lock 只接受稳定的受限普通文件`); }
      totalBytes += captured.bytes.length;
      if (files.length >= MAX_FILES || totalBytes > MAX_TOTAL_BYTES) {
        throw new Error(`${source}: plugin lock 文件数或总字节超出上限`);
      }
      files.push(Object.freeze({
        path: relative,
        gitMode: (captured.stat.mode & 0o111n) === 0n ? '100644' : '100755',
        size: captured.bytes.length,
        sha256: sha256(captured.bytes),
        content: captured.bytes,
      }));
    });
  };
  walk(sourceRoot);
  files.sort((left, right) => compareUtf8(left.path, right.path));
  directories.sort(compareUtf8);
  const manifestFile = '.codex-plugin/plugin.json';
  const manifestEntry = files.find(file => file.path === manifestFile);
  const manifestResult = validateProjectPluginManifestBytes({
    bytes: manifestEntry?.content, name, file: `${source}/${manifestFile}`,
  });
  if (manifestResult.failures.length > 0) throw new Error(manifestResult.failures[0]);
  const { manifest } = manifestResult;
  return Object.freeze({
    name, source, manifestName: manifest.name, manifestVersion: manifest.version,
    directories: Object.freeze(directories), files: Object.freeze(files),
  });
};

const captureProjectPluginTreeOnce = rootDir => Object.freeze({
  profile: SNAPSHOT_PROFILE,
  plugins: Object.freeze(AI_GOVERNANCE_PROJECT_PLUGIN_NAMES.map((name) => {
    const source = `plugins/${name}`;
    return capturePluginSourceTree({
      sourceRoot: resolveProjectPluginRepositoryPath(rootDir, source), name, source,
    });
  })),
});

export const captureProjectPluginTree = (rootDir) => {
  const first = captureProjectPluginTreeOnce(rootDir);
  const second = captureProjectPluginTreeOnce(rootDir);
  if (!sameProjectPluginTreeSnapshots(first, second)) {
    throw new Error('plugins/: 项目插件源码树在连续快照期间发生变化');
  }
  return first;
};

export const sameProjectPluginTreeSnapshots = (left, right) => {
  if (left?.profile !== SNAPSHOT_PROFILE || right?.profile !== SNAPSHOT_PROFILE
    || left.plugins.length !== right.plugins.length) return false;
  return left.plugins.every((plugin, pluginIndex) => {
    const candidate = right.plugins[pluginIndex];
    return plugin.name === candidate.name && plugin.source === candidate.source
      && plugin.manifestName === candidate.manifestName
      && plugin.manifestVersion === candidate.manifestVersion
      && plugin.directories.length === candidate.directories.length
      && plugin.directories.every((directory, index) => directory === candidate.directories[index])
      && plugin.files.length === candidate.files.length
      && plugin.files.every((file, fileIndex) => {
        const current = candidate.files[fileIndex];
        return file.path === current.path && file.gitMode === current.gitMode
          && file.size === current.size && file.sha256 === current.sha256
          && file.content.equals(current.content);
      });
  });
};
