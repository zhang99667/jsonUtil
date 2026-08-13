// 独立维护项目 plugin-lock 的 Git inventory、稳定 endpoint 与原子写入/回滚事务。

import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { captureProjectPluginCommand } from './aiGovernanceProjectPluginCommand.mjs';
import {
  buildProjectPluginLock,
  collectProjectPluginLockShapeFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import {
  buildProjectPluginLifecycleReport as report,
  emptyProjectPluginDescriptors,
  projectPluginLifecycleFailure as failure,
  projectPluginLifecycleFailureCode as failureCode,
  projectPluginLifecycleReportRoot,
  readExpectedProjectPlugins,
} from './aiGovernanceProjectPluginLifecycleContract.mjs';
import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import { isStrictSemverIncrement } from './aiGovernanceSemver.mjs';
import {
  captureProjectPluginTree,
  sameProjectPluginTreeSnapshots,
} from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

const LOCK_STAT_FIELDS = ['dev', 'ino', 'mode', 'nlink', 'size', 'uid', 'gid', 'mtimeNs', 'ctimeNs'];
const MAX_LOCK_BYTES = 4 * 1024 * 1024;
const posixPath = value => value.split(path.sep).join('/');
const sameLockStat = (left, right) => LOCK_STAT_FIELDS.every(field => left[field] === right[field]);
const sameLockSnapshot = (left, right) => sameLockStat(left.stat, right.stat) && left.bytes.equals(right.bytes);

const projectRoot = (rootDir) => {
  try {
    const root = fs.realpathSync(rootDir);
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
    return root;
  } catch { throw failure('PROJECT_ROOT_INVALID'); }
};

const fsyncDirectory = (directory) => {
  const descriptor = fs.openSync(directory, fs.constants.O_RDONLY);
  try { fs.fsyncSync(descriptor); } finally { fs.closeSync(descriptor); }
};

const readStableLockSnapshot = (file, code) => {
  try {
    const pathStat = fs.lstatSync(file, { bigint: true });
    if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
      || pathStat.size < 1n || pathStat.size > BigInt(MAX_LOCK_BYTES)
      || fs.realpathSync(file) !== file) throw new Error();
    const descriptor = fs.openSync(file, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    try {
      const opened = fs.fstatSync(descriptor, { bigint: true });
      if (!opened.isFile() || opened.nlink !== 1n || !sameLockStat(pathStat, opened)) throw new Error();
      const bytes = Buffer.alloc(Number(opened.size));
      let offset = 0;
      while (offset < bytes.length) {
        const count = fs.readSync(descriptor, bytes, offset, bytes.length - offset, offset);
        if (count === 0) throw new Error();
        offset += count;
      }
      if (fs.readSync(descriptor, Buffer.alloc(1), 0, 1, bytes.length) !== 0) throw new Error();
      const after = fs.fstatSync(descriptor, { bigint: true });
      const finalPath = fs.lstatSync(file, { bigint: true });
      if (!sameLockStat(opened, after) || !sameLockStat(after, finalPath) || fs.realpathSync(file) !== file) {
        throw new Error();
      }
      return { bytes, stat: after };
    } finally { fs.closeSync(descriptor); }
  } catch { throw failure(code); }
};

const parseLock = (snapshot) => {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(snapshot.bytes)); }
  catch { throw failure('PROJECT_PLUGIN_LOCK_INVALID'); }
};

const writerControlPath = lockFile => `${lockFile}.writer-lock`;
const acquireWriterControl = (lockFile) => {
  const file = writerControlPath(lockFile);
  const bytes = Buffer.from(`${process.pid}:${randomUUID()}\n`);
  let descriptor;
  try {
    descriptor = fs.openSync(file, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o600);
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    const stat = fs.fstatSync(descriptor, { bigint: true });
    fs.closeSync(descriptor);
    descriptor = undefined;
    fsyncDirectory(path.dirname(file));
    return { file, stat };
  } catch (error) {
    if (descriptor !== undefined) try { fs.closeSync(descriptor); } catch {}
    if (error?.code === 'EEXIST') throw failure('PROJECT_PLUGIN_LOCK_BUSY');
    try { fs.rmSync(file, { force: true }); } catch {}
    throw failure('PROJECT_PLUGIN_LOCK_CONTROL_FAILED');
  }
};

const releaseWriterControl = (control) => {
  try {
    const current = fs.lstatSync(control.file, { bigint: true });
    if (!current.isFile() || current.isSymbolicLink() || current.nlink !== 1n
      || !sameLockStat(control.stat, current)) throw new Error();
    fs.unlinkSync(control.file);
    fsyncDirectory(path.dirname(control.file));
  } catch { throw failure('PROJECT_PLUGIN_LOCK_CONTROL_FAILED'); }
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
    descriptor = fs.openSync(temporary, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY, 0o644);
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
    fsyncDirectory(path.dirname(file));
  } catch {
    if (descriptor !== undefined) try { fs.closeSync(descriptor); } catch {}
    try { fs.rmSync(temporary, { force: true }); } catch {}
    throw failure('PROJECT_PLUGIN_LOCK_ATOMIC_WRITE_FAILED');
  }
};

const inlineRecord = value => `{ ${Object.entries(value).map(([key, item]) => (
  `${JSON.stringify(key)}: ${JSON.stringify(item)}`
)).join(', ')} }`;

const serializeProjectPluginLock = lock => Buffer.from([
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
].join('\n'));

const lockInspection = (expected, state) => ({
  marketplaceState: 'not-queried',
  pluginStates: expected.map(plugin => ({
    ...plugin,
    installedVersion: null,
    enabled: null,
    cacheState: 'not-queried',
    state,
    action: 'none',
  })),
});

export const writeProjectPluginLockLifecycle = async ({
  rootDir,
  listInventory = listGitProjectPluginFiles,
}) => {
  let root;
  let expected = emptyProjectPluginDescriptors();
  let attempted = 0;
  let succeeded = 0;
  let controlFailureCode = null;
  try {
    root = projectRoot(rootDir);
    let sourceSnapshot;
    try { sourceSnapshot = captureProjectPluginTree(root); }
    catch { throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID'); }
    expected = readExpectedProjectPlugins(sourceSnapshot);
    const { collectProjectPluginSourceFailures } = await import('./aiGovernanceProjectPlugins.mjs');
    if (collectProjectPluginSourceFailures(root, {
      checkEntryVersions: false, sourceSnapshot,
    }).length > 0) throw failure('PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID');

    let lockFile;
    try { lockFile = resolveProjectPluginRepositoryPath(root, PROJECT_PLUGIN_LOCK_PATH); }
    catch { throw failure('PROJECT_PLUGIN_LOCK_INVALID'); }
    const control = acquireWriterControl(lockFile);
    let operationFailed = false;
    try {
      const previousSnapshot = readStableLockSnapshot(lockFile, 'PROJECT_PLUGIN_LOCK_INVALID');
      const previous = parseLock(previousSnapshot);
      if (collectProjectPluginLockShapeFailures(previous).length > 0) throw failure('PROJECT_PLUGIN_LOCK_INVALID');
      const candidate = buildProjectPluginLock(root, sourceSnapshot);
      const candidateBytes = serializeProjectPluginLock(candidate);
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
      const currentLock = readStableLockSnapshot(lockFile, 'PROJECT_PLUGIN_LOCK_CHANGED_DURING_WRITE');
      if (!sameLockSnapshot(previousSnapshot, currentLock)) {
        throw failure('PROJECT_PLUGIN_LOCK_CHANGED_DURING_WRITE');
      }
      if (JSON.stringify(previous) === JSON.stringify(candidate)) {
        return report({ root, mode: 'write-lock', status: 'ready',
          inspection: lockInspection(expected, 'lock-unchanged'), expected });
      }
      const previousBySelector = new Map(previous.plugins.map(plugin => [plugin.selector, plugin]));
      const invalidVersion = candidate.plugins.find((plugin) => {
        const previousPlugin = previousBySelector.get(plugin.selector);
        return JSON.stringify(previousPlugin) !== JSON.stringify(plugin)
          && !isStrictSemverIncrement(previousPlugin?.manifestVersion, plugin.manifestVersion);
      });
      if (invalidVersion) throw failure(`PROJECT_PLUGIN_VERSION_CHANGE_REQUIRED:${invalidVersion.selector}`);

      attempted = 1;
      atomicReplaceBytes(lockFile, candidateBytes);
      let candidateSnapshot;
      let lockPostcheckFailure = null;
      let postWriteFailure = null;
      try {
        candidateSnapshot = readStableLockSnapshot(lockFile, 'PROJECT_PLUGIN_LOCK_POSTCHECK_FAILED');
        if (!candidateSnapshot.bytes.equals(candidateBytes)) lockPostcheckFailure = 'PROJECT_PLUGIN_LOCK_POSTCHECK_FAILED';
      } catch { lockPostcheckFailure = 'PROJECT_PLUGIN_LOCK_POSTCHECK_FAILED'; }
      try {
        const postWriteSnapshot = captureProjectPluginTree(root);
        if (!sameProjectPluginTreeSnapshots(stableSnapshot, postWriteSnapshot)
          || collectProjectPluginSourceFailures(root, {
            checkEntryVersions: false, sourceSnapshot: postWriteSnapshot,
          }).length > 0) postWriteFailure ??= 'PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE';
      } catch { postWriteFailure ??= 'PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE'; }
      try {
        const postWriteInventory = await listInventory({ rootDir: root });
        if (!(postWriteInventory instanceof Set)
          || candidateFiles.size !== postWriteInventory.size
          || [...candidateFiles].some(file => !postWriteInventory.has(file))) {
          postWriteFailure ??= 'PROJECT_PLUGIN_LOCK_SOURCE_CHANGED_DURING_WRITE';
        }
      } catch { postWriteFailure ??= 'GIT_PLUGIN_INVENTORY_FAILED'; }
      postWriteFailure ??= lockPostcheckFailure;
      if (postWriteFailure) {
        try {
          const rollbackBase = readStableLockSnapshot(lockFile, 'PROJECT_PLUGIN_LOCK_ROLLBACK_FAILED');
          if (!candidateSnapshot || !candidateSnapshot.bytes.equals(candidateBytes)
            || !sameLockSnapshot(candidateSnapshot, rollbackBase)) throw new Error();
          atomicReplaceBytes(lockFile, previousSnapshot.bytes);
          const restored = readStableLockSnapshot(lockFile, 'PROJECT_PLUGIN_LOCK_ROLLBACK_FAILED');
          if (!restored.bytes.equals(previousSnapshot.bytes)) throw new Error();
        } catch { throw failure('PROJECT_PLUGIN_LOCK_ROLLBACK_FAILED'); }
        throw failure(postWriteFailure);
      }
      succeeded = 1;
      return report({ root, mode: 'write-lock', status: 'lock-written',
        inspection: lockInspection(expected, 'lock-written'), expected, attempted, succeeded });
    } catch (error) {
      operationFailed = true;
      throw error;
    } finally {
      try { releaseWriterControl(control); }
      catch (error) {
        controlFailureCode = failureCode(error);
        if (!operationFailed) throw error;
      }
    }
  } catch (error) {
    const failures = [failureCode(error)];
    if (controlFailureCode && controlFailureCode !== failures[0]) failures.push(controlFailureCode);
    return report({ root: projectPluginLifecycleReportRoot(root, rootDir), mode: 'write-lock',
      status: 'blocked', expected, attempted, succeeded, failures });
  }
};
