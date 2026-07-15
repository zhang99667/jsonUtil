import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectSkillOptionalFieldFailures } from './aiGovernanceSkillOptionalFieldsContract.mjs';

const file = 'skills/example/SKILL.md';

test('Skill optional 字段契约接受缺省和合法官方字段', () => {
  assert.deepEqual(collectSkillOptionalFieldFailures(file, 'name: example'), []);
  assert.deepEqual(collectSkillOptionalFieldFailures(file, [
    'license: MIT # SPDX expression',
    `compatibility: "${'😀'.repeat(500)}"`,
    "allowed-tools: 'Read Grep'",
  ].join('\n')), []);
});

test('Skill optional 字段契约保持固定失败顺序', () => {
  assert.deepEqual(collectSkillOptionalFieldFailures(file, [
    'license: []',
    `compatibility: ${'x'.repeat(501)}`,
    'allowed-tools: "Read\\tGrep"',
  ].join('\n')), [
    `${file}: frontmatter license 必须是非空单行字符串`,
    `${file}: frontmatter compatibility 必须是 1-500 字符的字符串`,
    `${file}: frontmatter allowed-tools 必须是非空空格分隔字符串`,
  ]);
});

test('Skill optional 字段契约优先报告 continuation 并拒绝解码换行', () => {
  assert.deepEqual(collectSkillOptionalFieldFailures(file, 'compatibility: macOS\n  continued'), [
    `${file}: frontmatter compatibility 必须是单行字符串`,
  ]);
  assert.deepEqual(collectSkillOptionalFieldFailures(file, 'license: "MIT\\nApache"\nallowed-tools: "Read\\nGrep"'), [
    `${file}: frontmatter license 必须是非空单行字符串`,
    `${file}: frontmatter allowed-tools 必须是非空空格分隔字符串`,
  ]);
});
