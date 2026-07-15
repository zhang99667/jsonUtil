import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectCodexSkillContractFailures } from './aiGovernanceCodexSkillContract.mjs';
import {
  buildCodexSkillFixtureContent,
  CODEX_SKILL_TEST_FILE,
  withCodexSkillTempRoot,
} from './aiGovernanceSkillTestFixtures.mjs';
import { writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const skillFile = CODEX_SKILL_TEST_FILE;

const collectFrontmatterFailures = frontmatter => withCodexSkillTempRoot((rootDir) => {
  writeFixtureFile(rootDir, skillFile, buildCodexSkillFixtureContent({ frontmatter }));
  return collectCodexSkillContractFailures(rootDir, [skillFile]);
});

test('Skill frontmatter 允许开放标准 compatibility、引号标量与注释', () => {
  assert.deepEqual(collectFrontmatterFailures([
    "name: 'jsonutils-maintainer'",
    'description: "JSONUtils\\x20\\u9879\\u76ee维护技能。" # 安全注释',
    "compatibility: 'Requires Node 20+'\nlicense: 'Apache-2.0'\nallowed-tools: 'Bash(git:*) Read'",
    'metadata: # 项目发布元数据',
    '  version: "0.1.0" # semver',
    "  tags: 'jsonutils,governance,maintenance'",
  ].join('\n')), []);
});

test('Skill frontmatter 拒绝顶层和 metadata 重复键', () => {
  const failures = collectFrontmatterFailures([
    'name: jsonutils-maintainer',
    'name: stale-skill',
    'description: JSONUtils 项目维护技能。',
    'metadata:',
    '  version: "0.1.0"',
    '  version: "9.9.9"',
    '  tags: "jsonutils,governance,maintenance"',
    'metadata:',
    '  version: "0.1.0"',
    '  tags: "jsonutils,governance,maintenance"',
  ].join('\n'));

  assert.match(failures.join('\n'), /frontmatter 不允许重复顶层字段 name/);
  assert.match(failures.join('\n'), /frontmatter 不允许重复顶层字段 metadata/);
  assert.match(failures.join('\n'), /frontmatter metadata 不允许重复字段 version/);
});

test('Skill frontmatter 拒绝 quoted、anchored 与 explicit authority key', () => {
  const failures = collectFrontmatterFailures([
    'name: jsonutils-maintainer',
    '"name": stale-skill',
    'description: JSONUtils 项目维护技能。',
    'metadata:',
    '  version: "0.1.0"',
    '  &shadow version: "9.9.9"',
    '  tags: "jsonutils,governance,maintenance"',
    '? compatibility',
    ': "Requires Node 20+"',
  ].join('\n'));

  assert.match(failures.join('\n'), /frontmatter 顶层 key 必须使用 plain mapping/);
  assert.match(failures.join('\n'), /frontmatter metadata key 必须使用 plain mapping/);
});

test('Skill frontmatter 拒绝缺少 YAML mapping 分隔空白', () => {
  const failures = collectFrontmatterFailures([
    'name:jsonutils-maintainer',
    'description:"JSONUtils 项目维护技能。"',
    'metadata:# 项目发布元数据',
    '  version: "0.1.0"',
    '  tags: "jsonutils,governance,maintenance"',
  ].join('\n'));

  assert.match(failures.join('\n'), /frontmatter 顶层 key 必须使用 plain mapping/);
});

test('Skill frontmatter 拒绝非字符串权威值和越界长度', () => {
  const failures = collectFrontmatterFailures([
    'name: Invalid_Name',
    'description: *missing',
    `compatibility: "${'x'.repeat(501)}"`,
    'metadata:',
    '  version: "0.1.0"',
    '  tags: "jsonutils,governance,maintenance"',
  ].join('\n'));

  assert.match(failures.join('\n'), /frontmatter name 必须是 1-64 字符的小写 kebab-case/);
  assert.match(failures.join('\n'), /frontmatter description 必须是 1-1024 字符的字符串/);
  assert.match(failures.join('\n'), /frontmatter compatibility 必须是 1-500 字符的字符串/);
});

test('Skill frontmatter 拒绝 YAML core 数值和空 optional 字符串', () => {
  const failures = collectFrontmatterFailures([
    'name: jsonutils-maintainer',
    'description: 0xFF',
    'compatibility:',
    'license: *missing',
    'allowed-tools:',
    '  - Bash',
    'metadata:',
    '  version: "0.1.0"',
    '  tags: "jsonutils,governance,maintenance"',
  ].join('\n'));

  assert.match(failures.join('\n'), /frontmatter description 必须是 1-1024 字符的字符串/);
  assert.match(failures.join('\n'), /frontmatter compatibility 必须是 1-500 字符的字符串/);
  assert.match(failures.join('\n'), /frontmatter license 必须是非空单行字符串/);
  assert.match(failures.join('\n'), /frontmatter allowed-tools 必须是非空空格分隔字符串/);
});

test('Skill frontmatter 拒绝 plain scalar 多行 continuation 与伪 closing delimiter', () => {
  const continuationFailures = collectFrontmatterFailures([
    'name: jsonutils-maintainer',
    'description: short',
    `  ${'x'.repeat(1025)}`,
    'compatibility: "Requires\\nNode 20"',
    'metadata:',
    '  version: "0.1.0"',
    '  tags: "jsonutils,governance,maintenance"',
  ].join('\n'));
  assert.match(continuationFailures.join('\n'), /frontmatter description 必须是单行字符串/);
  assert.match(continuationFailures.join('\n'), /frontmatter compatibility 必须是 1-500 字符的字符串/);

  const nameContinuationFailures = collectFrontmatterFailures([
    'name: jsonutils-maintainer',
    '  shadow',
    'description: JSONUtils 项目维护技能。',
    'metadata:',
    '  version: "0.1.0"',
    '  tags: "jsonutils,governance,maintenance"',
  ].join('\n'));
  assert.match(nameContinuationFailures.join('\n'), /frontmatter name 必须是单行字符串/);

  withCodexSkillTempRoot((rootDir) => {
    const content = buildCodexSkillFixtureContent().replace('\n---\n\n#', '\n---evil\n\n#');
    writeFixtureFile(rootDir, skillFile, content);
    assert.match(collectCodexSkillContractFailures(rootDir, [skillFile]).join('\n'), /缺少 skill frontmatter/);
  });
});

test('Skill frontmatter 拒绝 YAML block context 非法 plain scalar', () => {
  for (const description of ['- item', '? item', ': item', '@item', '`item', 'foo: bar']) {
    const failures = collectFrontmatterFailures([
      'name: jsonutils-maintainer',
      `description: ${description}`,
      'metadata:',
      '  version: "0.1.0"',
      '  tags: "jsonutils,governance,maintenance"',
    ].join('\n'));
    assert.match(failures.join('\n'), /frontmatter description 必须是 1-1024 字符的字符串/);
  }
});
