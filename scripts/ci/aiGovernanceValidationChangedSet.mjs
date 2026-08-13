// 将稳定 Git 控制面与工作树原始字节分类为权威 Validation 变更集。

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import {
  assertValidationChangedSetGitStateCurrent,
  captureValidationChangedSetGitState,
  ValidationChangedSetInventoryError,
} from './aiGovernanceValidationChangedSetGitInventory.mjs';
import {
  sameJsonutilsValidationStat,
  stableJsonutilsValidationStat,
} from './aiGovernanceValidationRuntimePrimitives.mjs';

const NORMAL_MODES = new Set(['100644', '100755']);
const CHANGE_ORDER = [
  'staged-added', 'staged-deleted', 'staged-content', 'staged-mode',
  'worktree-deleted', 'worktree-content', 'worktree-mode', 'untracked',
];
const INTENT_TO_ADD_FLAG = 0x20000000n;
const STATE_DIGEST_DOMAIN = 'jsonutils-validation-changed-set-state-v1\0';

const worktreeMode = stat => ((stat.mode & 0o111n) === 0n ? '100644' : '100755');

const readStableWorktreeEntry = (realRoot, file, addIssue) => {
  const absolute = path.join(realRoot, ...file.split('/'));
  let pathStat;
  try {
    pathStat = fs.lstatSync(absolute, { bigint: true });
  } catch (error) {
    if (error.code === 'ENOENT') return { kind: 'absent' };
    addIssue('worktree-read-failed', file, 'worktree');
    return { kind: 'unsupported' };
  }
  if (pathStat.isSymbolicLink()) {
    addIssue('symlink', file, 'worktree');
    return { kind: 'unsupported' };
  }
  if (!pathStat.isFile()) {
    addIssue('special-file', file, 'worktree');
    return { kind: 'unsupported' };
  }
  if (pathStat.nlink !== 1n) {
    addIssue('hardlinked-file', file, 'worktree');
    return { kind: 'unsupported' };
  }
  try {
    if (fs.realpathSync(absolute) !== absolute) {
      addIssue('symlink-ancestor', file, 'worktree');
      return { kind: 'unsupported' };
    }
    const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
    try {
      const before = fs.fstatSync(descriptor, { bigint: true });
      if (!before.isFile() || !sameJsonutilsValidationStat(pathStat, before)) throw new Error('unstable');
      const header = Buffer.from(`blob ${before.size.toString()}\0`, 'utf8');
      const rawDigest = createHash('sha256');
      const blobSha1 = createHash('sha1').update(header);
      const blobSha256 = createHash('sha256').update(header);
      const chunk = Buffer.allocUnsafe(64 * 1024);
      let total = 0n;
      for (;;) {
        const count = fs.readSync(descriptor, chunk, 0, chunk.length, null);
        if (count === 0) break;
        const bytes = chunk.subarray(0, count);
        rawDigest.update(bytes);
        blobSha1.update(bytes);
        blobSha256.update(bytes);
        total += BigInt(count);
      }
      const after = fs.fstatSync(descriptor, { bigint: true });
      const finalPathStat = fs.lstatSync(absolute, { bigint: true });
      if (!sameJsonutilsValidationStat(before, after)
        || !sameJsonutilsValidationStat(after, finalPathStat)
        || total !== after.size || fs.realpathSync(absolute) !== absolute) throw new Error('unstable');
      return {
        kind: 'file',
        mode: worktreeMode(after),
        rawSha256: rawDigest.digest('hex'),
        blobOids: { 40: blobSha1.digest('hex'), 64: blobSha256.digest('hex') },
        stat: stableJsonutilsValidationStat(after),
      };
    } finally {
      fs.closeSync(descriptor);
    }
  } catch {
    addIssue('unstable-or-unreadable-file', file, 'worktree');
    return { kind: 'unsupported' };
  }
};

const classifyGitEntry = (entry, source, addIssue) => {
  if (!entry) return false;
  if (entry.mode === '120000') addIssue('symlink', entry.path, source);
  else if (entry.mode === '160000') addIssue('gitlink', entry.path, source);
  else if (!NORMAL_MODES.has(entry.mode) || (source === 'head' && entry.type !== 'blob')) {
    addIssue('special-git-entry', entry.path, source);
  } else return true;
  return false;
};

const failedReport = code => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-changed-set',
  ok: false,
  changedFileCount: 0,
  counts: { staged: 0, worktree: 0, untracked: 0, blocked: 1 },
  allFiles: [],
  issues: [{ code, path: null, source: 'inventory' }],
  stateSha256: null,
});

export const collectAuthoritativeValidationChangedSet = (rootDir) => {
  try {
    const realRoot = fs.realpathSync(rootDir);
    const gitState = captureValidationChangedSetGitState(realRoot);
    const {
      head, index, typeFlags, assumeFlags, debugFlags, untracked,
    } = gitState;

    const issues = [];
    const issueKeys = new Set();
    const addIssue = (code, file, source) => {
      const key = `${source}\0${code}\0${file ?? ''}`;
      if (!issueKeys.has(key)) {
        issueKeys.add(key);
        issues.push({ code, path: file, source });
      }
    };
    const paths = new Set([...head.keys(), ...index.keys(), ...untracked]);

    index.forEach((entries, file) => {
      if (entries.length !== 1 || entries[0].stage !== 0) addIssue('unmerged-index', file, 'index');
      if (entries.some(entry => /^0+$/.test(entry.oid))
        || (debugFlags.get(file) & INTENT_TO_ADD_FLAG) !== 0n) addIssue('intent-to-add', file, 'index');
      if ([...(typeFlags.get(file) ?? [])].includes('S')) addIssue('skip-worktree', file, 'index');
      if ([...(assumeFlags.get(file) ?? [])].some(tag => /^[a-z]$/.test(tag))) {
        addIssue('assume-unchanged', file, 'index');
      }
    });

    const allFiles = [];
    const stateRecords = [];
    [...paths].sort().forEach((file) => {
      const changes = new Set();
      const headEntry = head.get(file);
      const indexGroup = index.get(file) ?? [];
      const indexEntry = indexGroup.length === 1 && indexGroup[0].stage === 0 ? indexGroup[0] : null;
      const headSupported = classifyGitEntry(headEntry, 'head', addIssue);
      const indexSupported = classifyGitEntry(indexEntry, 'index', addIssue)
        && !/^0+$/.test(indexEntry?.oid ?? '')
        && (debugFlags.get(file) & INTENT_TO_ADD_FLAG) === 0n;
      const worktree = readStableWorktreeEntry(realRoot, file, addIssue);

      if (!headEntry && indexSupported) changes.add('staged-added');
      else if (headSupported && !indexEntry) changes.add('staged-deleted');
      else if (headSupported && indexSupported) {
        if (headEntry.oid !== indexEntry.oid) changes.add('staged-content');
        if (headEntry.mode !== indexEntry.mode) changes.add('staged-mode');
      }

      if (indexSupported && worktree.kind === 'absent') changes.add('worktree-deleted');
      else if (indexSupported && worktree.kind === 'file') {
        if (worktree.blobOids[indexEntry.oid.length] !== indexEntry.oid) changes.add('worktree-content');
        if (worktree.mode !== indexEntry.mode) changes.add('worktree-mode');
      } else if (!indexEntry && worktree.kind !== 'absent' && (untracked.has(file) || headEntry)) {
        changes.add('untracked');
      }
      if (untracked.has(file) && indexEntry) addIssue('tracked-untracked-overlap', file, 'inventory');

      stateRecords.push({
        path: file,
        head: headEntry ? { mode: headEntry.mode, oid: headEntry.oid, type: headEntry.type } : null,
        index: indexGroup.map(entry => ({ mode: entry.mode, oid: entry.oid, stage: entry.stage })),
        typeTags: [...(typeFlags.get(file) ?? [])].sort(),
        assumeTags: [...(assumeFlags.get(file) ?? [])].sort(),
        debugFlags: debugFlags.has(file) ? debugFlags.get(file).toString(16) : null,
        untracked: untracked.has(file),
        worktree: worktree.kind === 'file' ? {
          kind: worktree.kind,
          mode: worktree.mode,
          rawSha256: worktree.rawSha256,
          stat: worktree.stat,
        } : { kind: worktree.kind },
      });

      const hasIssue = issues.some(issue => issue.path === file);
      if (changes.size > 0 || hasIssue) {
        allFiles.push({ path: file, changes: CHANGE_ORDER.filter(change => changes.has(change)) });
      }
    });
    issues.sort((left, right) => {
      const leftKey = `${left.source}\0${left.code}\0${left.path ?? ''}`;
      const rightKey = `${right.source}\0${right.code}\0${right.path ?? ''}`;
      return leftKey < rightKey ? -1 : Number(leftKey > rightKey);
    });
    assertValidationChangedSetGitStateCurrent(realRoot, gitState);
    const stateSha256 = createHash('sha256').update(STATE_DIGEST_DOMAIN, 'utf8')
      .update(JSON.stringify({
        headOid: gitState.headOid,
        indexControl: gitState.indexControl,
        records: stateRecords,
        issues,
      }), 'utf8').digest('hex');
    const blockedPaths = new Set(issues.map(issue => issue.path ?? '<inventory>'));
    return {
      schemaVersion: 1,
      reportType: 'ai-governance-validation-changed-set',
      ok: issues.length === 0,
      changedFileCount: allFiles.length,
      counts: {
        staged: allFiles.filter(file => file.changes.some(change => change.startsWith('staged-'))).length,
        worktree: allFiles.filter(file => file.changes.some(change => change.startsWith('worktree-'))).length,
        untracked: allFiles.filter(file => file.changes.includes('untracked')).length,
        blocked: blockedPaths.size,
      },
      allFiles,
      issues,
      stateSha256,
    };
  } catch (error) {
    return failedReport(error instanceof ValidationChangedSetInventoryError
      ? error.code : 'git-or-filesystem-inventory-failed');
  }
};
