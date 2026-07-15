import fs from 'node:fs';
import path from 'node:path';

import { collectClaudeSkillAdapterFailures } from './aiGovernanceClaudeSkillAdapters.mjs';

const CANONICAL_SKILLS_DIR = '.agents/skills';
const LEGACY_SKILLS_DIR = '.codex/skills';

const collectSkillSourceEntries = (rootDir, relativePath, legacy) => {
  const absolutePath = path.join(rootDir, relativePath);
  let stat;
  try {
    stat = fs.lstatSync(absolutePath);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (stat.isSymbolicLink()) return [`${relativePath}: ${legacy
    ? '禁止用 symlink 保留 legacy skill source'
    : 'canonical skill source 必须是仓库内普通文件或目录'}`];
  if (!stat.isDirectory()) return legacy && path.basename(relativePath) === 'SKILL.md'
    ? [`${relativePath}: 项目 skill 唯一源码必须位于 .agents/skills/`]
    : [];
  return fs.readdirSync(absolutePath).sort()
    .flatMap(entry => collectSkillSourceEntries(rootDir, path.posix.join(relativePath, entry), legacy));
};

export const collectCodexSkillSourceContractFailures = (rootDir) => {
  const sourceFailures = [
    ...collectSkillSourceEntries(rootDir, LEGACY_SKILLS_DIR, true),
    ...collectSkillSourceEntries(rootDir, CANONICAL_SKILLS_DIR, false),
  ];
  return [
    ...sourceFailures,
    ...(sourceFailures.length === 0 && fs.existsSync(path.join(rootDir, '.claude/skills'))
      ? collectClaudeSkillAdapterFailures(rootDir) : []),
  ];
};
