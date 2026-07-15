import fs from 'node:fs';
import path from 'node:path';

import {
  EVOLUTION_SEALED_WORKTREE_MANIFEST,
  EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS,
  createEvolutionWorktreeRevisionHasher,
  resolveEvolutionSealedWorktreeRevision,
} from './aiGovernanceEvolutionSealedWorktreeManifest.mjs';
import {
  decodeHermeticGitPathList,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';

const EXCLUDED_EVIDENCE_LEDGERS = new Set(EVOLUTION_WORKTREE_REVISION_EXCLUDED_PATHS);

export const resolveEvolutionWorktreeRevision = (rootDir) => {
  const realRoot = fs.realpathSync(rootDir);
  const hasGitMetadata = fs.existsSync(path.join(realRoot, '.git'));
  const hasSealedManifest = fs.existsSync(path.join(realRoot, EVOLUTION_SEALED_WORKTREE_MANIFEST));
  if (!hasGitMetadata && hasSealedManifest) return resolveEvolutionSealedWorktreeRevision(realRoot);
  const files = decodeHermeticGitPathList(runHermeticGitInventory(
    realRoot,
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  ))
    .filter(file => file && !EXCLUDED_EVIDENCE_LEDGERS.has(file))
    .sort();
  const hasher = createEvolutionWorktreeRevisionHasher();
  files.forEach((file) => {
    const absolute = path.join(realRoot, file);
    try {
      const stat = fs.lstatSync(absolute);
      const base = { path: file, revisionIncluded: true, executableBits: stat.mode & 0o111 };
      if (stat.isSymbolicLink()) hasher.add({ ...base, kind: 'symlink', target: fs.readlinkSync(absolute) });
      else if (stat.isFile()) hasher.add({ ...base, kind: 'file', bytes: fs.readFileSync(absolute) });
      else hasher.add({ ...base, kind: 'unsupported', unsupported: stat.isDirectory() ? 'directory' : 'other' });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      hasher.add({ path: file, kind: 'deleted', revisionIncluded: true });
    }
  });
  return hasher.digest();
};

export const collectEvolutionWorktreeRevisionFailures = ({
  rootDir,
  outcomes,
  resolveRevision = resolveEvolutionWorktreeRevision,
}) => {
  let currentRevision;
  try {
    currentRevision = resolveRevision(rootDir);
  } catch (error) {
    return [`deterministic outcome revision 校验失败：${error.message}`];
  }
  return outcomes
    .filter(outcome => outcome.provenance?.revision !== currentRevision)
    .map(outcome => `outcomes.jsonl: outcome \`${outcome.id}\` revision 未绑定当前 worktree manifest`);
};
