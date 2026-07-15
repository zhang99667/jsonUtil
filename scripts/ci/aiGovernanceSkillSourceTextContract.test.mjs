import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import { collectSkillEvalContractFailures } from './aiGovernanceCodexSkillEvalContract.mjs';
import { collectSkillUiContractFailures } from './aiGovernanceCodexSkillUiContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  withCodexSkillTempRoot,
} from './aiGovernanceSkillTestFixtures.mjs';

const MAX_SKILL_BYTES = 64 * 1024;
const MAX_UI_BYTES = 64 * 1024;
const MAX_EVAL_BYTES = 256 * 1024;
const uiSkillFile = '.agents/skills/example-skill/SKILL.md';
const uiFile = '.agents/skills/example-skill/agents/openai.yaml';
const evalFile = '.agents/skills/example-skill/evals/evals.json';
const validUi = [
  'interface:',
  '  display_name: "Example Skill"',
  '  short_description: "Run a focused example skill workflow"',
  '  default_prompt: "Use $example-skill to complete this task."',
  '',
].join('\n');
const validEval = JSON.stringify({
  skill_name: 'example-skill',
  evals: [{
    id: 1, prompt: 'Run a focused example', expected_output: 'Return evidence',
    files: [], assertions: ['Contains evidence'],
  }],
});

const writeBytes = (rootDir, file, bytes) => {
  const absolute = path.join(rootDir, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, bytes);
};

const padComment = (content, size, prefix) => {
  const base = Buffer.from(content);
  const marker = Buffer.from(prefix);
  assert.ok(base.length + marker.length <= size);
  return Buffer.concat([base, marker, Buffer.alloc(size - base.length - marker.length, 0x78)]);
};

test('Skill source reader 接受上限并拒绝 cap+1', () => {
  withCodexSkillTempRoot((rootDir) => {
    writeBytes(rootDir, CODEX_SKILL_TEST_FILE, padComment(
      buildCodexSkillFixtureContent(), MAX_SKILL_BYTES, '\n<!--',
    ));
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [CODEX_SKILL_TEST_FILE]), []);
    fs.appendFileSync(path.join(rootDir, CODEX_SKILL_TEST_FILE), 'x');
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [CODEX_SKILL_TEST_FILE]), [
      `${CODEX_SKILL_TEST_FILE}: skill source 不能超过 ${MAX_SKILL_BYTES} bytes`,
    ]);
  });
});

test('Skill source reader 拒绝目录和非法 UTF-8 且不抛异常', () => {
  withCodexSkillTempRoot((rootDir) => {
    const absolute = path.join(rootDir, CODEX_SKILL_TEST_FILE);
    fs.mkdirSync(absolute, { recursive: true });
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [CODEX_SKILL_TEST_FILE]), [
      `${CODEX_SKILL_TEST_FILE}: skill source 必须是稳定可读的非 symlink 普通文件`,
    ]);
  });
  withCodexSkillTempRoot((rootDir) => {
    writeBytes(rootDir, CODEX_SKILL_TEST_FILE, Buffer.concat([
      Buffer.from(buildCodexSkillFixtureContent()), Buffer.from('\n<!--'), Buffer.from([0xff]),
    ]));
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [CODEX_SKILL_TEST_FILE]), [
      `${CODEX_SKILL_TEST_FILE}: skill source 必须是严格 UTF-8`,
    ]);
  });
});

test('Skill source reader 拒绝 hardlink 与仓内祖先 symlink', () => {
  for (const kind of ['hardlink', 'ancestor-symlink']) withCodexSkillTempRoot((rootDir) => {
    const source = kind === 'hardlink'
      ? 'source.md' : `shadow/${CODEX_SKILL_TEST_FILE}`;
    writeBytes(rootDir, source, Buffer.from(buildCodexSkillFixtureContent()));
    const target = path.join(rootDir, CODEX_SKILL_TEST_FILE);
    if (kind === 'hardlink') {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.linkSync(path.join(rootDir, source), target);
    } else {
      fs.symlinkSync('shadow/.agents', path.join(rootDir, '.agents'), 'dir');
    }
    assert.deepEqual(collectCodexSkillContractFailures(rootDir, [CODEX_SKILL_TEST_FILE]), [
      `${CODEX_SKILL_TEST_FILE}: skill source 必须是稳定可读的非 symlink 普通文件`,
    ]);
  });
});

test('Skill UI reader 接受上限并拒绝 cap+1 与非法 UTF-8', () => {
  withCodexSkillTempRoot((rootDir) => {
    writeBytes(rootDir, uiFile, padComment(validUi, MAX_UI_BYTES, '# '));
    assert.deepEqual(collectSkillUiContractFailures(rootDir, uiSkillFile), []);
    fs.appendFileSync(path.join(rootDir, uiFile), 'x');
    assert.deepEqual(collectSkillUiContractFailures(rootDir, uiSkillFile), [
      `${uiFile}: 不能超过 ${MAX_UI_BYTES} bytes`,
    ]);
  });
  withCodexSkillTempRoot((rootDir) => {
    writeBytes(rootDir, uiFile, Buffer.concat([Buffer.from(validUi), Buffer.from('# '), Buffer.from([0xff])]));
    assert.deepEqual(collectSkillUiContractFailures(rootDir, uiSkillFile), [
      `${uiFile}: 必须是严格 UTF-8`,
    ]);
  });
});

test('Skill eval reader 接受上限并拒绝 cap+1 与非法 UTF-8', () => {
  withCodexSkillTempRoot((rootDir) => {
    const base = Buffer.from(validEval);
    writeBytes(rootDir, evalFile, Buffer.concat([
      base, Buffer.alloc(MAX_EVAL_BYTES - base.length, 0x20),
    ]));
    assert.deepEqual(collectSkillEvalContractFailures(rootDir, uiSkillFile), []);
    fs.appendFileSync(path.join(rootDir, evalFile), 'x');
    assert.deepEqual(collectSkillEvalContractFailures(rootDir, uiSkillFile), [
      `${evalFile}: 不能超过 ${MAX_EVAL_BYTES} bytes`,
    ]);
  });
  withCodexSkillTempRoot((rootDir) => {
    writeBytes(rootDir, evalFile, Buffer.concat([Buffer.from(validEval), Buffer.from([0xff])]));
    assert.deepEqual(collectSkillEvalContractFailures(rootDir, uiSkillFile), [
      `${evalFile}: 必须是严格 UTF-8`,
    ]);
  });
});
