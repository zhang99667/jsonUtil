import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { PROJECT_PLUGIN_LOCK_PATH } from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLifecycle.mjs';
import {
  parseProjectPluginJsonAuthority,
  PROJECT_PLUGIN_MANIFEST_MAX_BYTES,
  validateProjectPluginManifestBytes,
} from './aiGovernanceProjectPluginManifestContract.mjs';
import {
  projectPluginManifestFile as manifestFile,
  projectPluginTestRoot as projectRoot,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';
const manifestFiles = [
  manifestFile,
  'plugins/jsonutils-governance-mcp/.codex-plugin/plugin.json',
  'plugins/codex-mcp-config-auditor/.codex-plugin/plugin.json',
];

test('三个项目 manifest 满足统一闭字段 authority', () => {
  for (const file of manifestFiles) {
    const name = file.split('/')[1];
    const result = validateProjectPluginManifestBytes({ bytes: fs.readFileSync(path.join(projectRoot, file)), name, file });
    assert.deepEqual(result.failures, []);
    assert.equal(result.manifest.name, name);
  }
});

test('项目 JSON authority 拒绝顶层、嵌套与转义等价重复键', () => {
  for (const source of [
    '{"skills":"./attacker/","skills":"./skills/"}',
    '{"author":{"name":"attacker","name":"JSONUtils project"}}',
    '{"skills":"./attacker/","\\u0073kills":"./skills/"}',
  ]) assert.throws(() => parseProjectPluginJsonAuthority(source), /重复 authority/);
});

test('manifest authority 拒绝非法 UTF-8、超限、缺字段、额外字段与错误类型', () => {
  const base = JSON.parse(fs.readFileSync(path.join(projectRoot, manifestFile), 'utf8'));
  const invalid = [
    Buffer.from([0x80]), Buffer.alloc(PROJECT_PLUGIN_MANIFEST_MAX_BYTES + 1, 0x20),
    Buffer.from(JSON.stringify({ ...base, description: undefined })),
    Buffer.from(JSON.stringify({ ...base, unexpectedAuthority: true })),
    Buffer.from(JSON.stringify({ ...base, interface: { ...base.interface, displayName: undefined } })),
    Buffer.from(JSON.stringify({ ...base, interface: { ...base.interface, defaultPrompt: [] } })),
  ];
  invalid.forEach(bytes => assert.equal(validateProjectPluginManifestBytes({
    bytes, name: 'ai-infra-controller-probe', file: manifestFile,
  }).failures.length, 1));
});

test('重复 manifest authority 在 Git inventory 前阻断 write-lock', () => withCopy(async (root) => {
  const manifest = path.join(root, manifestFile);
  fs.writeFileSync(manifest, fs.readFileSync(manifest, 'utf8').replace(
    '  "skills": "./skills/",',
    '  "skills": "./attacker-skills/",\n  "skills": "./skills/",',
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
