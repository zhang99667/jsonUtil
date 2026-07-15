import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';

import { collectProjectPluginSkillContractFailures } from './aiGovernanceProjectPluginSkillContract.mjs';
import { PROJECT_PLUGIN_LOCK_PATH } from './aiGovernanceProjectPluginLock.mjs';
import { writeProjectPluginLockLifecycle } from './aiGovernanceProjectPluginLifecycle.mjs';
import { validateProjectPluginManifestBytes } from './aiGovernanceProjectPluginManifestContract.mjs';
import { collectProjectPluginSourceFailures } from './aiGovernanceProjectPlugins.mjs';
import {
  projectPluginManifestFile as manifestFile,
  projectPluginSkillFile as skillFile,
  rewriteProjectPluginText as rewriteText,
  withProjectPluginCopy as withCopy,
} from './aiGovernanceProjectPluginTestFixtures.mjs';

test('manifest version 必须是严格 SemVer', () => withCopy((root) => {
  const base = JSON.parse(fs.readFileSync(path.join(root, manifestFile), 'utf8'));
  for (const version of ['01.2.3', '1.02.3', '1.2.03', '1.2.3-..', '1.2.3-01', '1.2.3+..']) {
    const bytes = Buffer.from(JSON.stringify({ ...base, version }));
    assert.equal(validateProjectPluginManifestBytes({
      bytes, name: 'ai-infra-controller-probe', file: manifestFile,
    }).failures.length, 1, version);
  }
}));

test('marketplace 与 MCP companion 重复 JSON authority 在 inventory 前拒绝', async () => {
  const mutations = [
    ['.agents/plugins/marketplace.json', '  "name": "jsonutils-project",',
      '  "name": "attacker",\n  "name": "jsonutils-project",'],
    ['plugins/jsonutils-governance-mcp/.mcp.json', '    "command": "node",',
      '    "command": "attacker",\n    "\\u0063ommand": "node",'],
  ];
  for (const [file, needle, replacement] of mutations) await withCopy(async (root) => {
    rewriteText(root, file, content => content.replace(needle, replacement));
    assert.ok(collectProjectPluginSourceFailures(root).length > 0, file);
    const lock = path.join(root, PROJECT_PLUGIN_LOCK_PATH), before = fs.readFileSync(lock);
    let inventoryCalls = 0;
    const report = await writeProjectPluginLockLifecycle({
      rootDir: root, listInventory: async () => (inventoryCalls += 1, new Set()),
    });
    assert.deepEqual(report.failures, ['PROJECT_PLUGIN_SOURCE_CONTRACT_INVALID'], file);
    assert.equal(inventoryCalls, 0, file);
    assert.deepEqual(fs.readFileSync(lock), before, file);
  });
});

test('plugin eval 顶层与嵌套转义等价重复 authority 必须失败', async () => {
  const evalFile = path.posix.join(path.posix.dirname(skillFile), 'evals/evals.json');
  const mutations = [
    content => content.replace('  "skill_name":', '  "skill_name": "attacker",\n  "skill_name":'),
    content => content.replace('      "prompt":', '      "prompt": "attacker",\n      "\\u0070rompt":'),
  ];
  for (const mutate of mutations) await withCopy((root) => {
    rewriteText(root, evalFile, mutate);
    assert.ok(collectProjectPluginSkillContractFailures(root).length > 0);
  });
});
