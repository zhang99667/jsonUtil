import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { collectSkillEvalContractFailures } from './aiGovernanceCodexSkillEvalContract.mjs';
import { collectSkillUiContractFailures } from './aiGovernanceCodexSkillUiContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = '.agents/skills/example-skill/SKILL.md';
const uiFile = '.agents/skills/example-skill/agents/openai.yaml';
const evalFile = '.agents/skills/example-skill/evals/evals.json';

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

test('Skill UI/eval companion 必须是非 symlink 普通文件', () => {
  for (const [file, collect] of [
    [uiFile, rootDir => collectSkillUiContractFailures(rootDir, skillFile, { required: true })],
    [evalFile, rootDir => collectSkillEvalContractFailures(rootDir, skillFile, { required: true })],
  ]) for (const kind of ['directory', 'symlink', 'dangling-symlink']) withAiGovernanceTempRoot((rootDir) => {
    const absolute = path.join(rootDir, file);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    if (kind === 'directory') fs.mkdirSync(absolute);
    else fs.symlinkSync(kind === 'symlink' ? rootDir : `${rootDir}-missing`, absolute, 'dir');
    assert.deepEqual(collect(rootDir), [`${file}: 必须是可读的非 symlink 普通文件`]);
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
