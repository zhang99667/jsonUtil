import fs from 'node:fs';
import path from 'node:path';
import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { collectSectionReferenceFailures } from './aiGovernanceSectionReferences.mjs';

export { collectCodexSkillContractFailures };

export const discoverCodexSkillFiles = (rootDir) => {
  const codexSkillsDir = path.join(rootDir, '.codex/skills');
  if (!fs.existsSync(codexSkillsDir)) return [];

  return fs
    .readdirSync(codexSkillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `.codex/skills/${entry.name}/SKILL.md`);
};

export const collectMissingAiGovernanceFiles = (rootDir, requiredFiles) => (
  requiredFiles.filter(relativePath => !fs.existsSync(path.join(rootDir, relativePath)))
);

export const collectMissingAiGovernanceReferences = (
  rootDir,
  referenceRules,
  codexSkillFiles
) => {
  const missingReferences = [];
  if (codexSkillFiles.length === 0) missingReferences.push('.codex/skills: 缺少项目级 Codex skill');

  for (const rule of referenceRules) {
    const filePath = path.join(rootDir, rule.file);
    if (!fs.existsSync(filePath)) {
      missingReferences.push(`${rule.file}: 文件不存在，无法检查引用`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    rule.contains?.forEach((expectedText) => {
      if (!content.includes(expectedText)) missingReferences.push(`${rule.file}: 缺少 "${expectedText}"`);
    });
    missingReferences.push(...collectSectionReferenceFailures(rule.file, content, rule.sections));
  }
  return missingReferences;
};

export const collectFrontendLintScriptFailures = (rootDir) => {
  const frontendPackage = JSON.parse(fs.readFileSync(path.join(rootDir, 'frontend/package.json'), 'utf8'));
  return frontendPackage.scripts?.lint === 'eslint "{src,config}/**/*.{ts,tsx}" --quiet'
    ? []
    : ['frontend/package.json: lint 脚本未覆盖 src 和 config TypeScript 源码'];
};
