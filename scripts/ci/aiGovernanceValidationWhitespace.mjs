// 对 HEAD、index 和工作树的原始字节做三视图空白检查。

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  collectAuthoritativeValidationChangedSet,
  parseValidationHeadEntries,
  parseValidationIndexEntries,
} from './aiGovernanceValidationChangedSet.mjs';
import {
  buildHermeticGitEnvironment,
  isSafeHermeticGitPath,
  resolveHermeticGitExecutable,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';

const PROFILE = 'raw-head-index-worktree-whitespace-v1';
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const MAX_RAW_FILE_BYTES = 16 * 1024 * 1024;
const ALLOWED_CHANGES = new Set([
  'staged-added', 'staged-deleted', 'staged-content', 'staged-mode',
  'worktree-deleted', 'worktree-content', 'worktree-mode', 'untracked',
]);
const EMPTY_BYTES = Buffer.alloc(0);

class WhitespaceCheckError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const emptyChecks = () => ({
  staged: { checked: 0, affectedComparisons: 0, binarySkipped: 0 },
  worktree: { checked: 0, affectedComparisons: 0, binarySkipped: 0 },
  untracked: { checked: 0, affectedComparisons: 0, binarySkipped: 0 },
});

const renderReport = ({
  ok, stateSha256, changedFileCount, checks, blockers, comparisonsCompleted = false,
}) => ({
  schemaVersion: 1,
  reportType: 'ai-governance-validation-whitespace',
  profile: PROFILE,
  ok,
  status: ok ? 'passed' : 'failed',
  evidenceScope: 'component-only',
  outcomeEligible: false,
  changedSet: { stateSha256, changedFileCount },
  checks,
  blockers,
  claims: {
    applicableRawComparisonsCompleted: comparisonsCompleted,
    launcherShellUsed: false,
    repositoryFiltersExecuted: false,
    repositoryAttributeDriversExecuted: false,
    commandOutputReported: false,
    behaviorValidated: false,
  },
});

const failedReport = code => renderReport({
  ok: false,
  stateSha256: null,
  changedFileCount: 0,
  checks: emptyChecks(),
  blockers: [{ code, count: 1 }],
});

const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative)
    && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

const createPrivateTempRoot = (rootDir) => {
  const candidate = process.platform === 'win32'
    ? path.join(path.parse(process.execPath).root, 'Windows', 'Temp')
    : '/tmp';
  let base, baseStat, tempRoot;
  try {
    base = fs.realpathSync(candidate);
    baseStat = fs.lstatSync(base);
    if (!baseStat.isDirectory() || baseStat.isSymbolicLink()
      || (process.platform !== 'win32'
        && (baseStat.uid !== 0 || ((baseStat.mode & 0o022) !== 0 && (baseStat.mode & 0o1000) === 0)))) {
      throw new Error('unsafe base');
    }
    tempRoot = fs.mkdtempSync(path.join(base, 'jsonutils-validation-whitespace-'));
    fs.chmodSync(tempRoot, 0o700);
    const stat = fs.lstatSync(tempRoot);
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(tempRoot) !== tempRoot
      || isWithin(rootDir, tempRoot)
      || (process.platform !== 'win32'
        && ((stat.mode & 0o777) !== 0o700
          || (typeof process.getuid === 'function' && stat.uid !== process.getuid())))) {
      throw new Error('unsafe root');
    }
    return tempRoot;
  } catch {
    if (tempRoot) {
      try { fs.rmdirSync(tempRoot); } catch { /* 不递归删除未经复核的路径。 */ }
    }
    throw new WhitespaceCheckError('RAW_WHITESPACE_TEMP_UNAVAILABLE');
  }
};

const removePrivateTempRoot = (temp) => {
  try {
    const stat = fs.lstatSync(temp);
    if (!stat.isDirectory() || stat.isSymbolicLink() || fs.realpathSync(temp) !== temp
      || fs.readdirSync(temp).length !== 0) {
      throw new Error('unsafe root');
    }
    fs.rmdirSync(temp);
  } catch {
    throw new WhitespaceCheckError('RAW_WHITESPACE_TEMP_CLEANUP_FAILED');
  }
};

const writePrivateTempFile = (target, bytes) => {
  try {
    fs.writeFileSync(target, bytes, { mode: 0o600, flag: 'wx' });
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1
      || stat.size !== bytes.length || fs.realpathSync(target) !== target) throw new Error('unsafe input');
  } catch {
    try { fs.unlinkSync(target); } catch { /* 外层只执行非递归安全清理。 */ }
    throw new WhitespaceCheckError('RAW_WHITESPACE_TEMP_WRITE_FAILED');
  }
};

const removePrivateTempFile = (target) => {
  try {
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1
      || fs.realpathSync(target) !== target) {
      throw new Error('unstable input');
    }
    fs.unlinkSync(target);
  } catch {
    throw new WhitespaceCheckError('RAW_WHITESPACE_TEMP_CLEANUP_FAILED');
  }
};

const validateChangedSet = (report) => {
  if (!report || report.ok !== true || typeof report.stateSha256 !== 'string'
    || !SHA256_PATTERN.test(report.stateSha256)
    || !Number.isSafeInteger(report.changedFileCount) || report.changedFileCount < 0
    || !Array.isArray(report.issues) || report.issues.length !== 0
    || !Array.isArray(report.allFiles) || report.allFiles.length !== report.changedFileCount) {
    throw new WhitespaceCheckError('AUTHORITATIVE_CHANGED_SET_INVALID');
  }
  const seen = new Set();
  report.allFiles.forEach((item) => {
    if (!item || !isSafeHermeticGitPath(item.path) || seen.has(item.path)
      || !Array.isArray(item.changes) || item.changes.length === 0
      || new Set(item.changes).size !== item.changes.length
      || item.changes.some(change => !ALLOWED_CHANGES.has(change))) {
      throw new WhitespaceCheckError('AUTHORITATIVE_CHANGED_SET_INVALID');
    }
    seen.add(item.path);
  });
  return report;
};

const mapHeadEntries = (rootDir) => {
  const entries = parseValidationHeadEntries(runHermeticGitInventory(rootDir, [
    'ls-tree', '-r', '-z', '--full-tree', '--format=%(objectmode) %(objecttype) %(objectname) %(path)', 'HEAD', '--',
  ]));
  const result = new Map();
  entries.forEach((entry) => {
    if (result.has(entry.path) || entry.type !== 'blob' || !['100644', '100755'].includes(entry.mode)) {
      throw new WhitespaceCheckError('RAW_VIEW_INVENTORY_INVALID');
    }
    result.set(entry.path, entry);
  });
  return result;
};

const mapIndexEntries = (rootDir) => {
  const entries = parseValidationIndexEntries(runHermeticGitInventory(rootDir, [
    'ls-files', '-z', '--cached', '--full-name', '--format=%(objectmode) %(objectname) %(stage) %(path)', '--',
  ]));
  const result = new Map();
  entries.forEach((entry) => {
    if (result.has(entry.path) || entry.stage !== 0 || !['100644', '100755'].includes(entry.mode)) {
      throw new WhitespaceCheckError('RAW_VIEW_INVENTORY_INVALID');
    }
    result.set(entry.path, entry);
  });
  return result;
};

const sameStableStat = (left, right) => left.dev === right.dev && left.ino === right.ino
  && left.mode === right.mode && left.size === right.size && left.nlink === right.nlink
  && left.uid === right.uid && left.gid === right.gid
  && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;

const readStableFile = (rootDir, file) => {
  const absolute = path.join(rootDir, ...file.split('/'));
  const pathStat = fs.lstatSync(absolute, { bigint: true });
  if (!pathStat.isFile() || pathStat.isSymbolicLink() || pathStat.nlink !== 1n
    || fs.realpathSync(absolute) !== absolute) throw new WhitespaceCheckError('RAW_VIEW_READ_FAILED');
  if (pathStat.size > BigInt(MAX_RAW_FILE_BYTES)) {
    throw new WhitespaceCheckError('RAW_VIEW_SIZE_LIMIT_EXCEEDED');
  }
  const descriptor = fs.openSync(absolute, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
  try {
    const before = fs.fstatSync(descriptor, { bigint: true });
    if (!before.isFile() || !sameStableStat(pathStat, before)) throw new WhitespaceCheckError('RAW_VIEW_READ_FAILED');
    const bytes = fs.readFileSync(descriptor);
    const after = fs.fstatSync(descriptor, { bigint: true });
    const finalPathStat = fs.lstatSync(absolute, { bigint: true });
    if (!sameStableStat(before, after) || !sameStableStat(after, finalPathStat)
      || BigInt(bytes.length) !== after.size || fs.realpathSync(absolute) !== absolute) {
      throw new WhitespaceCheckError('RAW_VIEW_READ_FAILED');
    }
    return bytes;
  } finally {
    fs.closeSync(descriptor);
  }
};

const readBlob = (rootDir, oid) => {
  if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(oid)) throw new WhitespaceCheckError('RAW_VIEW_INVENTORY_INVALID');
  return runHermeticGitInventory(rootDir, ['cat-file', 'blob', oid]);
};

const isBinary = bytes => bytes.subarray(0, 8_000).includes(0);

const compareRawBytes = ({ before, after, tempRoot, gitExecutable }) => {
  if (isBinary(before) || isBinary(after)) return 'binary-skipped';
  const beforePath = path.join(tempRoot, 'before.raw');
  const afterPath = path.join(tempRoot, 'after.raw');
  let beforeWritten = false, afterWritten = false;
  try {
    writePrivateTempFile(beforePath, before);
    beforeWritten = true;
    writePrivateTempFile(afterPath, after);
    afterWritten = true;
    const result = spawnSync(gitExecutable, [
      '--no-pager',
      '-c', 'core.autocrlf=false',
      '-c', 'core.safecrlf=false',
      '-c', 'core.whitespace=blank-at-eol,blank-at-eof,space-before-tab,cr-at-eol',
      'diff', '--no-index', '--check', '--no-ext-diff', '--no-textconv', '--no-renames',
      '--', beforePath, afterPath,
    ], {
      cwd: tempRoot,
      shell: false,
      stdio: 'ignore',
      timeout: 30_000,
      env: {
        ...buildHermeticGitEnvironment(gitExecutable),
        GIT_ATTR_NOSYSTEM: '1',
        GIT_CEILING_DIRECTORIES: tempRoot,
        GIT_DISCOVERY_ACROSS_FILESYSTEM: '0',
      },
    });
    if (result.signal || result.error || ![0, 1, 2, 3].includes(result.status)) {
      throw new WhitespaceCheckError('RAW_WHITESPACE_DIFF_FAILED');
    }
    return result.status >= 2 ? 'affected' : 'clean';
  } finally {
    let cleanupFailed = false;
    if (afterWritten) {
      try { removePrivateTempFile(afterPath); } catch { cleanupFailed = true; }
    }
    if (beforeWritten) {
      try { removePrivateTempFile(beforePath); } catch { cleanupFailed = true; }
    }
    if (cleanupFailed) throw new WhitespaceCheckError('RAW_WHITESPACE_TEMP_CLEANUP_FAILED');
  }
};

const recordComparison = ({ checks, view, before, after, tempRoot, gitExecutable }) => {
  const result = compareRawBytes({ before, after, tempRoot, gitExecutable });
  checks[view].checked += 1;
  if (result === 'affected') checks[view].affectedComparisons += 1;
  if (result === 'binary-skipped') checks[view].binarySkipped += 1;
};

const inspectRawViews = ({ rootDir, changedSet }) => {
  const head = mapHeadEntries(rootDir);
  const index = mapIndexEntries(rootDir);
  const checks = emptyChecks();
  const gitExecutable = resolveHermeticGitExecutable(rootDir);
  const tempRoot = createPrivateTempRoot(rootDir);
  try {
    changedSet.allFiles.forEach(({ path: file, changes }) => {
      const headEntry = head.get(file);
      const indexEntry = index.get(file);
      if (changes.includes('staged-added') || changes.includes('staged-content')) {
        if (!indexEntry || (changes.includes('staged-content') && !headEntry)) {
          throw new WhitespaceCheckError('RAW_VIEW_INVENTORY_INVALID');
        }
        recordComparison({
          checks,
          view: 'staged',
          before: headEntry ? readBlob(rootDir, headEntry.oid) : EMPTY_BYTES,
          after: readBlob(rootDir, indexEntry.oid),
          tempRoot,
          gitExecutable,
        });
      }
      if (changes.includes('worktree-content')) {
        if (!indexEntry) throw new WhitespaceCheckError('RAW_VIEW_INVENTORY_INVALID');
        recordComparison({
          checks,
          view: 'worktree',
          before: readBlob(rootDir, indexEntry.oid),
          after: readStableFile(rootDir, file),
          tempRoot,
          gitExecutable,
        });
      }
      if (changes.includes('untracked')) {
        recordComparison({
          checks,
          view: 'untracked',
          before: EMPTY_BYTES,
          after: readStableFile(rootDir, file),
          tempRoot,
          gitExecutable,
        });
      }
    });
    return checks;
  } finally {
    removePrivateTempRoot(tempRoot);
  }
};

export const checkAiGovernanceValidationWhitespace = async ({
  rootDir = process.cwd(),
  collectChangedSet = collectAuthoritativeValidationChangedSet,
} = {}) => {
  let before, checks, inspectionError;
  try {
    const realRoot = fs.realpathSync(rootDir);
    before = validateChangedSet(await collectChangedSet(realRoot));
    try {
      checks = inspectRawViews({ rootDir: realRoot, changedSet: before });
    } catch (error) {
      inspectionError = error instanceof WhitespaceCheckError ? error.code : 'WHITESPACE_CHECK_FAILED';
    }
    const after = validateChangedSet(await collectChangedSet(realRoot));
    if (before.stateSha256 !== after.stateSha256) {
      return renderReport({
        ok: false,
        stateSha256: before.stateSha256,
        changedFileCount: before.changedFileCount,
        checks: checks ?? emptyChecks(),
        blockers: [{ code: 'CHANGED_SET_DRIFT', count: 1 }],
        comparisonsCompleted: !inspectionError,
      });
    }
    if (inspectionError) {
      return renderReport({
        ok: false,
        stateSha256: before.stateSha256,
        changedFileCount: before.changedFileCount,
        checks: checks ?? emptyChecks(),
        blockers: [{ code: inspectionError, count: 1 }],
      });
    }
    const affected = Object.values(checks)
      .reduce((total, item) => total + item.affectedComparisons, 0);
    return renderReport({
      ok: affected === 0,
      stateSha256: before.stateSha256,
      changedFileCount: before.changedFileCount,
      checks,
      blockers: affected === 0 ? [] : [{ code: 'WHITESPACE_VIOLATIONS', count: affected }],
      comparisonsCompleted: true,
    });
  } catch (error) {
    return failedReport(error instanceof WhitespaceCheckError ? error.code : 'WHITESPACE_CHECK_FAILED');
  }
};
