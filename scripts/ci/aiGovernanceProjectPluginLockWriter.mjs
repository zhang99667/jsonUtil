// 编排项目 plugin-lock 的 source、SemVer、Git inventory、endpoint 事务与报告。

import { spawn } from 'node:child_process';
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
import {
  parseProjectPluginLockSnapshot,
  readStableProjectPluginLockSnapshot,
  sameProjectPluginLockSnapshots,
  serializeProjectPluginLock,
} from './aiGovernanceProjectPluginLockSource.mjs';
import {
  acquireProjectPluginLockControl,
  releaseProjectPluginLockControl,
  replaceProjectPluginLockBytes,
} from './aiGovernanceProjectPluginLockTransaction.mjs';
import { isStrictSemverIncrement } from './aiGovernanceSemver.mjs';
import {
  captureProjectPluginTree,
  sameProjectPluginTreeSnapshots,
} from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { AI_GOVERNANCE_PROJECT_PLUGIN_NAMES } from './aiGovernanceRequiredProjectPluginLifecycleFiles.mjs';

const posixPath = value => value.split(path.sep).join('/');

const projectRoot = (rootDir) => {
  try {
    const root = fs.realpathSync(rootDir);
    const stat = fs.lstatSync(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
    return root;
  } catch { throw failure('PROJECT_ROOT_INVALID'); }
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
    const control = acquireProjectPluginLockControl(lockFile);
    let operationFailed = false;
    try {
      let previousSnapshot;
      let previous;
      try {
        previousSnapshot = readStableProjectPluginLockSnapshot(root);
        previous = parseProjectPluginLockSnapshot(previousSnapshot);
      } catch { throw failure('PROJECT_PLUGIN_LOCK_INVALID'); }
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
      let currentLock;
      try { currentLock = readStableProjectPluginLockSnapshot(root); }
      catch { throw failure('PROJECT_PLUGIN_LOCK_CHANGED_DURING_WRITE'); }
      if (!sameProjectPluginLockSnapshots(previousSnapshot, currentLock)) {
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
      const replaceState = replaceProjectPluginLockBytes(lockFile, candidateBytes);
      let candidateSnapshot;
      let lockPostcheckFailure = null;
      let postWriteFailure = replaceState === 'durable'
        ? null : 'PROJECT_PLUGIN_LOCK_ATOMIC_WRITE_FAILED';
      try {
        candidateSnapshot = readStableProjectPluginLockSnapshot(root);
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
          const rollbackBase = readStableProjectPluginLockSnapshot(root);
          if (!candidateSnapshot || !candidateSnapshot.bytes.equals(candidateBytes)
            || !sameProjectPluginLockSnapshots(candidateSnapshot, rollbackBase)) throw new Error();
          if (replaceProjectPluginLockBytes(lockFile, previousSnapshot.bytes) !== 'durable') throw new Error();
          const restored = readStableProjectPluginLockSnapshot(root);
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
      try { releaseProjectPluginLockControl(control); }
      catch (error) {
        controlFailureCode = failureCode(error);
        if (!operationFailed) throw error;
      }
    }
  } catch (error) {
    const failures = [failureCode(error)];
    if (controlFailureCode && controlFailureCode !== failures[0]) failures.push(controlFailureCode);
    return report({ root: projectPluginLifecycleReportRoot(root), mode: 'write-lock',
      status: 'blocked', expected, attempted, succeeded, failures });
  }
};
