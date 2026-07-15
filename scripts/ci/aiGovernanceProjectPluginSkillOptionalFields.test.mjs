import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectProjectPluginSkillContractFailures } from './aiGovernanceProjectPluginSkillContract.mjs';
import {
  projectPluginSkillFile as skillFile,
  rewriteProjectPluginText as rewriteText,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';

const addOptionalFields = (root, fields) => rewriteText(root, skillFile, content => content.replace(
  /^description:.*$/m,
  description => `${description}\n${fields.join('\n')}`,
));

test('项目插件 Skill 接受合法官方 optional frontmatter 字段', () => withCopy((root) => {
  addOptionalFields(root, ['license: MIT', "compatibility: 'macOS 15'", 'allowed-tools: Read Grep']);
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), []);
}));

test('项目插件 Skill 拒绝非法 optional frontmatter 字段', async () => {
  for (const [field, expected] of [
    ['license:', `${skillFile}: frontmatter license 必须是非空单行字符串`],
    [`compatibility: ${'x'.repeat(501)}`, `${skillFile}: frontmatter compatibility 必须是 1-500 字符的字符串`],
    ['compatibility: macOS\n  continued', `${skillFile}: frontmatter compatibility 必须是单行字符串`],
    ['allowed-tools: "Read\\tGrep"', `${skillFile}: frontmatter allowed-tools 必须是非空空格分隔字符串`],
  ]) await withCopy((root) => {
    addOptionalFields(root, [field]);
    assert.deepEqual(collectProjectPluginSkillContractFailures(root), [expected]);
  });
});
