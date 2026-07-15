import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  decodeHermeticGitNulRecords,
  isSafeHermeticGitPath,
  runHermeticGitInventory,
} from '../ci/aiGovernanceHermeticGitInventory.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const emptyCounts = () => ({ added: 0, copied: 0, deleted: 0, modified: 0, renamed: 0, untracked: 0, conflicted: 0 });

const runGitStatus = (cwd) => {
  try {
    return {
      exitCode: 0,
      stdout: runHermeticGitInventory(cwd, [
        'status', '--porcelain=v1', '-z', '--branch', '--untracked-files=all',
      ]),
    };
  } catch (error) {
    return { exitCode: 1, error: error.message };
  }
};

const parseBranch = (line = '') => {
  const [head = 'unknown', meta = ''] = line.replace(/^##\s*/, '').split(' [');
  const [current = 'unknown', upstream] = head.split('...');
  return {
    current,
    ...(upstream ? { upstream } : {}),
    ahead: Number(/ahead (\d+)/.exec(meta)?.[1] ?? 0),
    behind: Number(/behind (\d+)/.exec(meta)?.[1] ?? 0),
  };
};

const countStatus = (counts, code) => {
  if (code === '??') return { ...counts, untracked: counts.untracked + 1 };
  const flags = new Set(code.replace(/ /g, ''));
  return {
    added: counts.added + Number(flags.has('A')),
    copied: counts.copied + Number(flags.has('C')),
    deleted: counts.deleted + Number(flags.has('D')),
    modified: counts.modified + Number(flags.has('M')),
    renamed: counts.renamed + Number(flags.has('R')),
    untracked: counts.untracked,
    conflicted: counts.conflicted + Number(flags.has('U') || ['AA', 'DD'].includes(code)),
  };
};

const parseStatusRecord = (record) => {
  if (record.length < 4 || record[2] !== ' ' || !/^[ MADRCUT?!]{2}$/.test(record.slice(0, 2))) {
    throw new Error('Git status 含非法 porcelain record');
  }
  const status = record.slice(0, 2), file = record.slice(3);
  if (!isSafeHermeticGitPath(file)) throw new Error('Git status 含非法路径');
  return { status, file };
};

export const parseGitStatusSnapshot = (stdout, maxFiles = 50, { includeAllFiles = false } = {}) => {
  if (!Buffer.isBuffer(stdout)) throw new Error('Git status 必须使用 NUL 分帧字节');
  const records = decodeHermeticGitNulRecords(stdout);
  if (!records[0]?.startsWith('## ')) throw new Error('Git status 缺少 branch record');
  const branch = parseBranch(records.shift());
  const files = [];
  for (let index = 0; index < records.length; index += 1) {
    const { status, file } = parseStatusRecord(records[index]);
    const normalizedStatus = status.trim() || status;
    if (/[RC]/.test(status)) {
      const from = records[index + 1];
      if (!isSafeHermeticGitPath(from)) throw new Error('Git status rename 缺少合法原路径');
      files.push({ status: normalizedStatus, path: file, from });
      index += 1;
    } else {
      files.push({ status: normalizedStatus, path: file });
    }
  }
  return {
    branch,
    dirty: files.length > 0,
    changedFileCount: files.length,
    counts: files.reduce((counts, file) => countStatus(counts, file.status.padEnd(2, ' ')), emptyCounts()),
    files: files.slice(0, maxFiles),
    truncated: files.length > maxFiles,
    ...(includeAllFiles ? { allFiles: files } : {}),
  };
};

export const buildJsonutilsWorktreeSnapshot = async ({ maxFiles = 50, includeAllFiles = false, cwd = rootDir, runStatus } = {}) => {
  const result = await (runStatus ? runStatus() : runGitStatus(cwd));
  let snapshot = {}, error = result.error;
  if (result.exitCode === 0) {
    try {
      snapshot = parseGitStatusSnapshot(result.stdout, maxFiles, { includeAllFiles });
    } catch (caught) {
      error = caught.message;
    }
  }
  const ok = result.exitCode === 0 && !error;
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-worktree-snapshot',
    ok,
    ...snapshot,
    ...(ok ? {} : { error: error || 'hermetic Git status 读取失败' }),
  };
};
