import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = '.codex/skills/jsonutils-maintainer/SKILL.md';

const fenced = lines => ['```bash', ...lines, '```'].join('\n');

const skillFixture = commandBlock => `---
name: jsonutils-maintainer
description: JSONUtils 项目维护技能。
---

# JSONUtils Maintainer

## 必读文件
AGENTS.md
rules/code-style.md
docs/AI-ENGINEERING-PLAYBOOK.md
docs/AI-ASSET-REGISTRY.md

## 工作流
git status --short --branch
子 Agent 委派
frontend/package.json
CHANGELOG.md
规则/skill 回写
决策记录
回写追踪
锁定测试

## 常用验证命令
node scripts/ci/check-version-consistency.mjs
node scripts/ci/check-ai-governance.mjs
node scripts/ci/check-maintainability-budgets.mjs
npm run build
${commandBlock}

## 重点边界
dispatchChunkLoadRecoveryEvent
Content-Type
本地规则优先
node scripts/ci/check-ai-governance.mjs`;

test('AI 治理 skill 命令契约接受存在的 fenced cd 目录和 npm run 脚本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { build: 'vite build', test: 'vitest run' },
    }));
    writeFixtureFile(rootDir, skillFile, skillFixture(fenced([
      'cd frontend',
      'npm run build',
      'npm run test -- src/utils/schemeUtils.test.ts',
    ])));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), []);
  });
});

test('AI 治理 skill 命令契约会报告不存在的 fenced cd 目录', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, skillFile, skillFixture(fenced([
      'cd missing-dir',
    ])));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: 工作目录不存在 \`missing-dir\``,
    ]);
  });
});

test('AI 治理 skill 命令契约会报告不存在的 fenced npm run 脚本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, 'frontend/package.json', JSON.stringify({
      scripts: { build: 'vite build' },
    }));
    writeFixtureFile(rootDir, skillFile, skillFixture(fenced([
      'cd frontend',
      'npm run missing-script -- --strict',
    ])));

    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [skillFile]), [
      `${skillFile}: npm 脚本不存在 \`missing-script\``,
    ]);
  });
});
