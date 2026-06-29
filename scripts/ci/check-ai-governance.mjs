#!/usr/bin/env node
// 校验 AI 协作入口、Playbook 和 Codex skill 是否保持可发现、可执行。

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const codexSkillsDir = path.join(rootDir, '.codex/skills');

const codexSkillFiles = fs.existsSync(codexSkillsDir)
  ? fs
    .readdirSync(codexSkillsDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => `.codex/skills/${entry.name}/SKILL.md`)
  : [];

const requiredFiles = [
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  '.claude/ai-tools-guide.md',
  '.codex/README.md',
  ...codexSkillFiles,
  'scripts/ci/check-maintainability-budgets.mjs',
];

const referenceRules = [
  {
    file: 'AGENTS.md',
    contains: [
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
    ],
  },
  {
    file: 'CLAUDE.md',
    contains: [
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
    ],
  },
  {
    file: '.claude/ai-tools-guide.md',
    contains: [
      'AGENTS.md',
      ...codexSkillFiles,
      'docs/AI-ENGINEERING-PLAYBOOK.md',
    ],
  },
  {
    file: '.codex/README.md',
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      ...codexSkillFiles.map(file => file.replace('.codex/', '')),
    ],
  },
  ...codexSkillFiles.map(file => ({
    file,
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'npm run lint',
      'npm run typecheck',
      'npm run build',
      'npm run check:preloads',
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
  })),
  {
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    contains: [
      'AGENTS.md',
      'CLAUDE.md',
      ...codexSkillFiles,
      'npm run lint',
      'npm run check:preloads',
      'git diff --check',
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
  },
];

const missingFiles = requiredFiles.filter(relativePath => (
  !fs.existsSync(path.join(rootDir, relativePath))
));

const missingReferences = [];

if (codexSkillFiles.length === 0) {
  missingReferences.push('.codex/skills: 缺少项目级 Codex skill');
}

for (const rule of referenceRules) {
  const filePath = path.join(rootDir, rule.file);
  if (!fs.existsSync(filePath)) {
    missingReferences.push(`${rule.file}: 文件不存在，无法检查引用`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const expectedText of rule.contains) {
    if (!content.includes(expectedText)) {
      missingReferences.push(`${rule.file}: 缺少 "${expectedText}"`);
    }
  }
}

const frontendPackageFile = path.join(rootDir, 'frontend/package.json');
const frontendPackage = JSON.parse(fs.readFileSync(frontendPackageFile, 'utf8'));
if (frontendPackage.scripts?.lint !== 'eslint "{src,config}/**/*.{ts,tsx}" --quiet') {
  missingReferences.push('frontend/package.json: lint 脚本未覆盖 src 和 config TypeScript 源码');
}

if (missingFiles.length > 0 || missingReferences.length > 0) {
  if (missingFiles.length > 0) {
    console.error('AI 协作资产缺少以下文件:');
    for (const file of missingFiles) {
      console.error(`- ${file}`);
    }
  }

  if (missingReferences.length > 0) {
    console.error('AI 协作资产缺少以下关键引用:');
    for (const message of missingReferences) {
      console.error(`- ${message}`);
    }
  }

  process.exit(1);
}

console.log(`AI 协作治理校验通过，共 ${requiredFiles.length} 个关键文件、${referenceRules.length} 组引用规则。`);
