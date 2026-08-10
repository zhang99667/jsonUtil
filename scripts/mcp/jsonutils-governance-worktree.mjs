import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runHermeticGitInventory } from '../ci/aiGovernanceHermeticGitInventory.mjs';
import { parseGitStatusSnapshot } from './jsonutils-governance-worktree-parser.mjs';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

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
