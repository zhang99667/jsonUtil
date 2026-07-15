import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildProjectPluginLock,
  collectProjectPluginLockFailures,
  PROJECT_PLUGIN_LOCK_PATH,
} from './aiGovernanceProjectPluginLock.mjs';
import { collectProjectPluginSkillContractFailures } from './aiGovernanceProjectPluginSkillContract.mjs';
import { collectProjectPluginSourceIdentityFailures } from './aiGovernanceProjectPluginSourceIdentity.mjs';
import { collectProjectPluginFailures } from './aiGovernanceProjectPlugins.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLifecycle.mjs';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const pluginRoot = 'plugins/ai-infra-controller-probe';
const originalSkill = `${pluginRoot}/skills/probe-codex-controller-runtime`;

const makeWritable = (target) => {
  const stat = fs.lstatSync(target);
  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.chmodSync(target, 0o700);
    fs.readdirSync(target).forEach(name => makeWritable(path.join(target, name)));
  } else if (!stat.isSymbolicLink()) fs.chmodSync(target, 0o600);
};

const withCopy = async (run) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-plugin-source-identity-'));
  try {
    fs.cpSync(path.join(projectRoot, '.agents'), path.join(root, '.agents'), { recursive: true });
    fs.cpSync(path.join(projectRoot, 'plugins'), path.join(root, 'plugins'), { recursive: true });
    makeWritable(root);
    return await run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
};

const rewriteText = (root, file, mutate) => {
  const absolute = path.join(root, file);
  fs.writeFileSync(absolute, mutate(fs.readFileSync(absolute, 'utf8')));
};

const rewriteJson = (root, file, mutate) => {
  const absolute = path.join(root, file);
  const value = JSON.parse(fs.readFileSync(absolute, 'utf8'));
  mutate(value);
  fs.writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
};

const addValidSecondSkill = (root) => {
  const secondSkill = `${pluginRoot}/skills/safe-skill`;
  fs.cpSync(path.join(root, originalSkill), path.join(root, secondSkill), { recursive: true });
  rewriteText(root, `${secondSkill}/SKILL.md`, content => content.replace(/^name:.*$/m, 'name: safe-skill'));
  rewriteText(root, `${secondSkill}/agents/openai.yaml`, content => content.replaceAll('probe-codex-controller-runtime', 'safe-skill'));
  rewriteJson(root, `${secondSkill}/evals/evals.json`, value => { value.skill_name = 'safe-skill'; });
  return secondSkill;
};

const rewriteLock = root => fs.writeFileSync(
  path.join(root, PROJECT_PLUGIN_LOCK_PATH),
  `${JSON.stringify(buildProjectPluginLock(root), null, 2)}\n`,
);

test('项目插件完整源码树身份扫描接受当前项目资产', () => {
  assert.deepEqual(collectProjectPluginSourceIdentityFailures(projectRoot), []);
});

test('合法第二 Skill 的任意新增文件即使同步 content lock 也不能携带个人身份', () => withCopy((root) => {
  rewriteJson(root, `${pluginRoot}/.codex-plugin/plugin.json`, value => { value.version = '0.5.1'; });
  const secondSkill = addValidSecondSkill(root);
  const personalFile = `${secondSkill}/references/PERSONAL.md`;
  fs.writeFileSync(path.join(root, personalFile), 'Personal Codex plugin\n');
  rewriteLock(root);

  assert.deepEqual(collectProjectPluginLockFailures(root), []);
  assert.deepEqual(collectProjectPluginSkillContractFailures(root), []);
  assert.deepEqual(collectProjectPluginSourceIdentityFailures(root), [
    `${personalFile}: 项目插件不得使用个人权威身份或绝对用户路径`,
  ]);
  assert.deepEqual(collectProjectPluginFailures(root, { checkEntryVersions: false }), [
    `${personalFile}: 项目插件不得使用个人权威身份或绝对用户路径`,
  ]);
}));

test('完整源码树错误固定且不回显非法 manifest 正文', () => withCopy((root) => {
  fs.writeFileSync(path.join(root, `${pluginRoot}/.codex-plugin/plugin.json`), '{"secret-token":}');
  const failures = collectProjectPluginSourceIdentityFailures(root);
  assert.deepEqual(failures, ['plugins/: 项目插件完整源码树必须可读、无 symlink 且 manifest 合法']);
  assert.doesNotMatch(failures.join('\n'), /secret-token/);
}));

test('完整源码树身份扫描拒绝 file URI、JSON 转义和 Unicode 转义用户路径', async () => {
  const signatures = [
    'file:///Users/mark/plugin', 'file:///home/mark/plugin', String.raw`file://C:\Users\mark\plugin`,
    String.raw`{"path":"C:\\Users\\mark"}`, String.raw`{"path":"\/Users\/mark"}`,
    String.raw`{"path":"/\u0055sers/mark"}`,
  ];
  for (const signature of signatures) await withCopy((root) => {
    const file = `${originalSkill}/references/PERSONAL-PATH.md`;
    fs.writeFileSync(path.join(root, file), signature);
    assert.deepEqual(collectProjectPluginSourceIdentityFailures(root), [
      `${file}: 项目插件不得使用个人权威身份或绝对用户路径`,
    ]);
  });
});

test('write-lock 在 Git inventory 前拒绝已同步 lock 的第二 Skill 个人身份文件', () => withCopy(async (root) => {
  rewriteJson(root, `${pluginRoot}/.codex-plugin/plugin.json`, value => { value.version = '0.5.1'; });
  const secondSkill = addValidSecondSkill(root);
  fs.writeFileSync(path.join(root, `${secondSkill}/scripts/personal.mjs`), '/* Personal, local-only */\n');
  rewriteLock(root);
  const lockFile = path.join(root, PROJECT_PLUGIN_LOCK_PATH);
  const before = fs.readFileSync(lockFile, 'utf8');
  let inventoryCalls = 0;

  const report = await writeProjectPluginLockLifecycle({
    rootDir: root,
    listInventory: async () => (inventoryCalls += 1, new Set()),
  });

  assert.equal(report.status, 'blocked');
  assert.deepEqual(report.failures, ['PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID']);
  assert.equal(inventoryCalls, 0);
  assert.equal(fs.readFileSync(lockFile, 'utf8'), before);
}));
