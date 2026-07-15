import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import {
  CLAUDE_SKILL_ADAPTERS,
  collectClaudeSkillAdapterFailures,
  renderClaudeSkillAdapter,
} from './aiGovernanceClaudeSkillAdapters.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const canonicalContent = descriptor => {
  const name = path.posix.basename(path.posix.dirname(descriptor.canonicalFile));
  return `---\nname: ${name}\ndescription: ${name} 项目技能。\nmetadata:\n  version: "1.0.0"\n  tags: "jsonutils"\n---\n\n# ${name}\n`;
};

const writeValidAdapters = (rootDir) => CLAUDE_SKILL_ADAPTERS.forEach((descriptor) => {
  const content = canonicalContent(descriptor);
  writeFixtureFile(rootDir, descriptor.canonicalFile, content);
  writeFixtureFile(rootDir, descriptor.adapterFile, renderClaudeSkillAdapter(descriptor, content));
});

test('Claude skill adapters 精确派生 canonical name、description 和读取路径', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    assert.deepEqual(collectClaudeSkillAdapterFailures(rootDir), []);
    CLAUDE_SKILL_ADAPTERS.forEach(({ adapterFile, canonicalFile }) => {
      const content = fs.readFileSync(path.join(rootDir, adapterFile), 'utf8');
      assert.match(content, new RegExp(path.posix.relative(path.posix.dirname(adapterFile), canonicalFile).replaceAll('.', '\\.')));
    });
  });
});

test('Claude skill adapter 缺失时 fail closed', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const { adapterFile } = CLAUDE_SKILL_ADAPTERS[0];
    fs.rmSync(path.join(rootDir, adapterFile));
    assert.deepEqual(collectClaudeSkillAdapterFailures(rootDir), [
      `${adapterFile}: Claude skill adapter 文件不存在`,
    ]);
  });
});

test('Claude skill adapter 拒绝独立正文漂移', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const { adapterFile } = CLAUDE_SKILL_ADAPTERS[0];
    fs.appendFileSync(path.join(rootDir, adapterFile), '独立维护内容\n');
    assert.deepEqual(collectClaudeSkillAdapterFailures(rootDir), [
      `${adapterFile}: Claude skill adapter 必须由 canonical source 按固定模板派生`,
    ]);
  });
});

test('Claude skill adapter 拒绝 symlink', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const { adapterFile, canonicalFile } = CLAUDE_SKILL_ADAPTERS[0];
    const adapterPath = path.join(rootDir, adapterFile);
    fs.rmSync(adapterPath);
    fs.symlinkSync(path.relative(path.dirname(adapterPath), path.join(rootDir, canonicalFile)), adapterPath);
    assert.deepEqual(collectClaudeSkillAdapterFailures(rootDir), [
      `${adapterFile}: Claude skill adapter 必须是普通文件`,
    ]);
  });
});

test('Claude skill adapter 在读取前拒绝 canonical symlink', () => {
  withAiGovernanceTempRoot((rootDir) => {
    writeValidAdapters(rootDir);
    const { canonicalFile } = CLAUDE_SKILL_ADAPTERS[0];
    const canonicalPath = path.join(rootDir, canonicalFile);
    const outsidePath = path.join(rootDir, 'outside-skill.md');
    fs.renameSync(canonicalPath, outsidePath);
    fs.symlinkSync(path.relative(path.dirname(canonicalPath), outsidePath), canonicalPath);
    assert.deepEqual(collectClaudeSkillAdapterFailures(rootDir), [
      `${canonicalFile}: Claude skill adapter canonical source 必须是普通文件`,
    ]);
  });
});
