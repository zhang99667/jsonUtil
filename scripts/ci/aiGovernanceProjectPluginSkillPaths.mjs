import fs from 'node:fs';
import path from 'node:path';

import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';
import { readStableUtf8File } from './aiGovernanceStableUtf8File.mjs';

const COMPANION_PATHS = ['agents/openai.yaml', 'evals/evals.json'];
export const PROJECT_PLUGIN_SKILL_TEXT_MAX_BYTES = 64 * 1024;

const pathExistsWithoutFollowingFinalSymlink = (absolute) => {
  try { fs.lstatSync(absolute); return true; }
  catch (error) {
    if (error?.code === 'ENOENT') return false;
    throw error;
  }
};

export const resolveProjectPluginSkillRegularFile = (rootDir, file) => {
  const absolute = resolveProjectPluginRepositoryPath(rootDir, file);
  const stat = fs.lstatSync(absolute);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error();
  return absolute;
};

export const readProjectPluginSkillText = (rootDir, file) => {
  const source = readStableUtf8File(rootDir, file, PROJECT_PLUGIN_SKILL_TEXT_MAX_BYTES);
  if (source.status !== 'ok') throw new Error();
  return source.content;
};

export const collectProjectPluginSkillCompanionPathFailures = (rootDir, skillFile) => (
  COMPANION_PATHS.flatMap((relativePath) => {
    const file = path.posix.join(path.posix.dirname(skillFile), relativePath);
    try {
      if (!pathExistsWithoutFollowingFinalSymlink(path.join(rootDir, file))) return [];
      resolveProjectPluginSkillRegularFile(rootDir, file);
      return [];
    } catch {
      return [`${file}: 必须是可读的非 symlink 普通文件`];
    }
  })
);
