import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  COMPLETE_CODEX_SKILL_SECTION_BODIES,
} from './aiGovernanceSkillTestFixtures.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const fenced = lines => ['```bash', ...lines, '```'].join('\n');
const skillFile = CODEX_SKILL_TEST_FILE;

const skillFixture = commandBlock => buildCodexSkillFixtureContent({
  sectionBodies: {
    ...COMPLETE_CODEX_SKILL_SECTION_BODIES,
    '## 常用验证命令': [
      COMPLETE_CODEX_SKILL_SECTION_BODIES['## 常用验证命令'],
      commandBlock,
    ].join('\n'),
  },
});

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
