import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectSkillUiContractFailures } from './aiGovernanceCodexSkillUiContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = '.agents/skills/example-skill/SKILL.md';
const uiFile = '.agents/skills/example-skill/agents/openai.yaml';

test('Codex skill UI 契约接受官方界面元数据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, uiFile, [
      'interface:',
      '  display_name: "Example Skill"',
      '  short_description: "Run a focused example skill workflow"',
      '  default_prompt: "Use $example-skill to complete this task."',
      '',
    ].join('\n'));
    assert.deepEqual(collectSkillUiContractFailures(rootDir, skillFile), []);
  });
});

test('Codex skill UI 契约拒绝缺失元数据', () => {
  withAiGovernanceTempRoot((rootDir) => {
    assert.deepEqual(collectSkillUiContractFailures(rootDir, skillFile, { required: true }), [
      `${uiFile}: 缺少 skill UI metadata`,
    ]);
  });
});

test('Codex skill UI 契约拒绝无效字段和错误默认提示', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, uiFile, [
      'interface:',
      'wrong:',
      '  short_description: "short"',
      '  default_prompt: "Use another skill."',
      '',
    ].join('\n'));
    assert.deepEqual(collectSkillUiContractFailures(rootDir, skillFile), [
      `${uiFile}: 缺少 interface`,
      `${uiFile}: display_name 必须是非空引号字符串`,
      `${uiFile}: short_description 必须是 25-64 字符的引号字符串`,
      `${uiFile}: default_prompt 必须显式引用 $example-skill`,
    ]);
  });
});
