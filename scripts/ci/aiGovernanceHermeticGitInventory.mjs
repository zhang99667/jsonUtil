// 为 revision 与 snapshot producer 提供不继承 ambient Git 配置的严格 path inventory。

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TextDecoder } from 'node:util';

const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
const failure = code => Object.assign(new Error(code), { code });

const isWithin = (root, target) => {
  const relative = path.relative(root, target);
  return relative === '' || (!path.isAbsolute(relative) && relative !== '..' && !relative.startsWith(`..${path.sep}`));
};

const fixedGitCandidates = () => {
  if (process.platform !== 'win32') return ['/usr/bin/git', '/bin/git', '/usr/local/bin/git', '/opt/homebrew/bin/git'];
  const candidates = [];
  if (path.isAbsolute(process.env.SystemRoot ?? '')) {
    candidates.push(path.join(process.env.SystemRoot, 'System32', 'git.exe'));
  }
  if (path.isAbsolute(process.env.ProgramFiles ?? '')) {
    candidates.push(
      path.join(process.env.ProgramFiles, 'Git', 'cmd', 'git.exe'),
      path.join(process.env.ProgramFiles, 'Git', 'bin', 'git.exe'),
    );
  }
  return candidates;
};

const assertProtectedExecutablePath = (absolute) => {
  if (process.platform === 'win32') return;
  const allowedOwners = new Set([0, typeof process.getuid === 'function' ? process.getuid() : -1]);
  let current = absolute;
  for (;;) {
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || (stat.mode & 0o022) !== 0 || !allowedOwners.has(stat.uid)) {
      throw failure('HERMETIC_GIT_EXECUTABLE_UNSAFE');
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
};

export const resolveHermeticGitExecutable = (rootDir = process.cwd()) => {
  let root;
  try { root = fs.realpathSync(path.resolve(rootDir)); } catch { throw failure('HERMETIC_GIT_ROOT_INVALID'); }
  for (const candidate of fixedGitCandidates()) {
    try {
      const realPath = fs.realpathSync(candidate);
      const stat = fs.lstatSync(realPath);
      if (!stat.isFile() || stat.isSymbolicLink() || isWithin(root, realPath)
        || (process.platform !== 'win32' && (stat.mode & 0o111) === 0)) continue;
      assertProtectedExecutablePath(realPath);
      return realPath;
    } catch { /* 继续检查固定、非 PATH 候选。 */ }
  }
  throw failure('HERMETIC_GIT_EXECUTABLE_UNAVAILABLE');
};

export const buildHermeticGitEnvironment = gitExecutable => ({
  PATH: [...new Set([path.dirname(gitExecutable), '/usr/bin', '/bin'])].join(path.delimiter),
  HOME: path.parse(os.devNull).root || os.tmpdir(),
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: os.devNull,
  GIT_NO_LAZY_FETCH: '1',
  GIT_NO_REPLACE_OBJECTS: '1',
  GIT_OPTIONAL_LOCKS: '0',
  LANG: 'C',
  LC_ALL: 'C',
  ...(process.platform === 'win32' && process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
});

export const runHermeticGitInventory = (rootDir, args) => {
  const gitExecutable = resolveHermeticGitExecutable(rootDir);
  const result = spawnSync(gitExecutable, [
    '-c', 'core.fsmonitor=false',
    '-c', 'core.untrackedCache=false',
    '-c', 'core.ignoreCase=false',
    '-c', 'core.quotePath=false',
    '-C', rootDir,
    ...args,
  ], {
    encoding: 'buffer',
    stdio: 'pipe',
    timeout: 30_000,
    maxBuffer: 16 * 1024 * 1024,
    env: buildHermeticGitEnvironment(gitExecutable),
  });
  if (result.status !== 0) throw new Error('hermetic Git inventory 读取失败');
  return result.stdout;
};

export const decodeHermeticGitNulRecords = (buffer) => {
  const records = [];
  let offset = 0;
  while (offset < buffer.length) {
    const terminator = buffer.indexOf(0, offset);
    if (terminator < 0) throw new Error('hermetic Git inventory 缺少 NUL terminator');
    records.push(strictUtf8.decode(buffer.subarray(offset, terminator)));
    offset = terminator + 1;
  }
  return records;
};

export const isSafeHermeticGitPath = file => Boolean(file)
  && !path.posix.isAbsolute(file) && !file.includes('\\') && !file.includes('\0')
  && file.normalize('NFC') === file && path.posix.normalize(file) === file
  && file !== '..' && !file.startsWith('../');

export const decodeHermeticGitPathList = buffer => decodeHermeticGitNulRecords(buffer)
  .map((file) => {
    if (!isSafeHermeticGitPath(file)) throw new Error('hermetic Git inventory 含非法路径');
    return file;
  });
