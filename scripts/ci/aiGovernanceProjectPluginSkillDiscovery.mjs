import fs from 'node:fs';
import path from 'node:path';

import { resolveProjectPluginRepositoryPath } from './aiGovernanceProjectPluginRepositoryPath.mjs';

export const PROJECT_PLUGIN_SKILLS_ROOT = 'plugins/ai-infra-controller-probe/skills';

const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));

export const discoverProjectPluginSkillFiles = (rootDir) => {
  let entries;
  try {
    const absoluteRoot = resolveProjectPluginRepositoryPath(rootDir, PROJECT_PLUGIN_SKILLS_ROOT);
    const stat = fs.lstatSync(absoluteRoot);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error();
    entries = fs.readdirSync(absoluteRoot, { withFileTypes: true })
      .sort((left, right) => compareUtf8(left.name, right.name));
  } catch {
    return {
      failures: [`${PROJECT_PLUGIN_SKILLS_ROOT}: 必须是可读的普通 skills 目录`],
      skillFiles: [],
    };
  }

  const failures = [];
  const skillFiles = [];
  for (const entry of entries) {
    const directory = `${PROJECT_PLUGIN_SKILLS_ROOT}/${entry.name}`;
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      failures.push(`${directory}: 必须是普通 skill 目录`);
    } else skillFiles.push(`${directory}/SKILL.md`);
  }
  if (skillFiles.length === 0) failures.push(`${PROJECT_PLUGIN_SKILLS_ROOT}: 至少包含一个 skill 目录`);
  return { failures, skillFiles };
};
