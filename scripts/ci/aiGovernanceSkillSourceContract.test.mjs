import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { collectCodexSkillSourceContractFailures } from './aiGovernanceCodexSkillSourceContract.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

test('Codex skill source 契约接受唯一 .agents/skills 源', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeFixtureFile(rootDir, '.agents/skills/example/SKILL.md', '---\nname: example\n---\n');
    assert.deepEqual(collectCodexSkillSourceContractFailures(rootDir), []);
  });
});

test('Codex skill source 契约拒绝 legacy SKILL.md 副本', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const file = '.codex/skills/example/SKILL.md';
    writeFixtureFile(rootDir, file, 'duplicate');
    assert.deepEqual(collectCodexSkillSourceContractFailures(rootDir), [
      `${file}: 项目 skill 唯一源码必须位于 .agents/skills/`,
    ]);
  });
});

test('Codex skill source 契约拒绝 legacy symlink', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const target = path.join(rootDir, '.agents/skills/example');
    const link = path.join(rootDir, '.codex/skills/example');
    fs.mkdirSync(target, { recursive: true });
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link, 'dir');
    assert.deepEqual(collectCodexSkillSourceContractFailures(rootDir), [
      '.codex/skills/example: 禁止用 symlink 保留 legacy skill source',
    ]);
  });
});

test('Codex skill source 契约拒绝 canonical source 指向 symlink', () => {
  withAiGovernanceTempRoot((rootDir) => {
    const target = path.join(rootDir, 'outside-skill.md');
    const link = path.join(rootDir, '.agents/skills/example/SKILL.md');
    fs.writeFileSync(target, 'outside');
    fs.mkdirSync(path.dirname(link), { recursive: true });
    fs.symlinkSync(target, link);
    assert.deepEqual(collectCodexSkillSourceContractFailures(rootDir), [
      '.agents/skills/example/SKILL.md: canonical skill source 必须是仓库内普通文件或目录',
    ]);
  });
});
