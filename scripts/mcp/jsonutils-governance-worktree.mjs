import { execFile } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const emptyCounts = () => ({ added: 0, copied: 0, deleted: 0, modified: 0, renamed: 0, untracked: 0, conflicted: 0 });

const runGitStatus = () => new Promise(resolve => {
  execFile('git', ['status', '--porcelain=v1', '--branch'], { cwd: rootDir, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    resolve({ exitCode: error?.code ?? 0, stdout, stderr });
  });
});

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

const parseFile = (line) => {
  const status = line.slice(0, 2);
  const [from, to] = line.slice(3).split(' -> ');
  return { status: status.trim() || status, path: to ?? from, ...(to ? { from } : {}) };
};

export const parseGitStatusSnapshot = (stdout, maxFiles = 50, { includeAllFiles = false } = {}) => {
  const lines = stdout.split(/\r?\n/).filter(Boolean);
  const branch = lines[0]?.startsWith('## ') ? parseBranch(lines.shift()) : parseBranch();
  const files = lines.map(parseFile);
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

export const buildJsonutilsWorktreeSnapshot = async ({ maxFiles = 50, includeAllFiles = false, runStatus = runGitStatus } = {}) => {
  const result = await runStatus();
  const snapshot = result.exitCode === 0 ? parseGitStatusSnapshot(result.stdout, maxFiles, { includeAllFiles }) : {};
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-worktree-snapshot',
    ok: result.exitCode === 0,
    ...snapshot,
    ...(result.exitCode === 0 ? {} : { error: [result.stdout, result.stderr].filter(Boolean).join('\n').trim() }),
  };
};
