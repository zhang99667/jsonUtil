import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { captureProjectPluginTree } from './aiGovernanceProjectPluginTreeSnapshot.mjs';
import { collectProjectPluginSkillContractFailures } from './aiGovernanceProjectPluginSkillContract.mjs';
import { PROJECT_PLUGIN_LOCK_PATH } from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLifecycle.mjs';
import {
  projectPluginManifestFile as manifestFile,
  projectPluginSkillFile as skillFile,
  rewriteProjectPluginText as rewriteText,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';

test('plugin manifest 与 SKILL 直接拒绝 hardlink 和 64 KiB cap+1', async () => {
  for (const file of [manifestFile, skillFile]) await withCopy((root) => {
    const absolute = path.join(root, file), real = `${absolute}.real`;
    fs.renameSync(absolute, real);
    fs.linkSync(real, absolute);
    assert.ok(collectProjectPluginSkillContractFailures(root).length > 0);
  });
  for (const file of [manifestFile, skillFile]) await withCopy((root) => {
    fs.writeFileSync(path.join(root, file), Buffer.alloc(64 * 1024 + 1, 0x20));
    assert.ok(collectProjectPluginSkillContractFailures(root).length > 0);
  });
});

test('Skill 语义聚合绑定调用方完整 source snapshot', () => withCopy((root) => {
  const baseline = captureProjectPluginTree(root);
  rewriteText(root, skillFile, content => `${content}\n<!-- aggregate drift -->\n`);
  assert.deepEqual(collectProjectPluginSkillContractFailures(root, { sourceSnapshot: baseline }), [
    'plugins/: 项目插件源码在 Skill 语义校验期间发生变化',
  ]);
}));

test('Skill 语义聚合不得忽略 discovery 后新增的空 Skill 目录', () => withCopy((root) => {
  const baseline = captureProjectPluginTree(root);
  const skillsRoot = fs.realpathSync(path.join(root, 'plugins/ai-infra-controller-probe/skills'));
  const readdirSync = fs.readdirSync;
  let injected = false;
  fs.readdirSync = (directory, options) => {
    const entries = readdirSync(directory, options);
    if (!injected && options?.withFileTypes === true && fs.realpathSync(directory) === skillsRoot) {
      injected = true;
      fs.mkdirSync(path.join(skillsRoot, 'unvalidated-skill'));
    }
    return entries;
  };
  try {
    assert.deepEqual(collectProjectPluginSkillContractFailures(root, { sourceSnapshot: baseline }), [
      'plugins/: 项目插件源码在 Skill 语义校验期间发生变化',
    ]);
  } finally {
    fs.readdirSync = readdirSync;
  }
}));

test('Skill 语义 baseline 必须早于 discovery 后新增的完整 Skill', () => withCopy((root) => {
  const skillsRoot = fs.realpathSync(path.join(root, 'plugins/ai-infra-controller-probe/skills'));
  const existing = path.join(skillsRoot, 'probe-codex-controller-runtime');
  const readdirSync = fs.readdirSync;
  let injected = false;
  fs.readdirSync = (directory, options) => {
    const entries = readdirSync(directory, options);
    if (!injected && options?.withFileTypes === true && fs.realpathSync(directory) === skillsRoot) {
      injected = true;
      fs.cpSync(existing, path.join(skillsRoot, 'unvalidated-skill'), { recursive: true });
    }
    return entries;
  };
  try {
    assert.deepEqual(collectProjectPluginSkillContractFailures(root), [
      'plugins/: 项目插件源码在 Skill 语义校验期间发生变化',
    ]);
  } finally {
    fs.readdirSync = readdirSync;
  }
}));

test('未知畸形 frontmatter 子树在 Git inventory 前阻断 write-lock', () => withCopy(async (root) => {
  rewriteText(root, skillFile, content => content.replace(
    /^description:.*$/m,
    match => `${match}\nx_extension:\n  [invalid`,
  ));
  const lock = path.join(root, PROJECT_PLUGIN_LOCK_PATH), before = fs.readFileSync(lock);
  let inventoryCalls = 0;
  const report = await writeProjectPluginLockLifecycle({
    rootDir: root,
    listInventory: async () => (inventoryCalls += 1, new Set()),
  });
  assert.equal(report.status, 'blocked');
  assert.deepEqual(report.failures, ['PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID']);
  assert.equal(inventoryCalls, 0);
  assert.deepEqual(fs.readFileSync(lock), before);
}));
