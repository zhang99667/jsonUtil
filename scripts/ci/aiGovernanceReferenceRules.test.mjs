import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as configModule from './aiGovernanceDocReferenceItems.mjs';
import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';
import { AI_GOVERNANCE_DOC_REFERENCE_RULES } from './aiGovernanceDocReferenceRules.mjs';
import { AI_GOVERNANCE_REFERENCE_CORE_MISSING_CASES } from './aiGovernanceReferenceCoreMissingCases.mjs';
import { AI_GOVERNANCE_REFERENCE_ENTRY_MISSING_CASES } from './aiGovernanceReferenceEntryMissingCases.mjs';
import * as runtimeReferenceGroups from './aiGovernanceRuntimeReferenceGroups.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';
import { AI_TOOLS_SETUP_REFERENCES } from './aiGovernanceToolsSetupReferenceItems.mjs';

const codexSkillFiles = ['.agents/skills/jsonutils-maintainer/SKILL.md'];
const missingReferenceCases = [
  ...AI_GOVERNANCE_REFERENCE_CORE_MISSING_CASES,
  ...AI_GOVERNANCE_REFERENCE_ENTRY_MISSING_CASES,
];

missingReferenceCases.forEach(({ name, file, content, contains, expected }) => {
  test(name, () => {
    withAiGovernanceTempRoot((rootDir) => {
      writeFixtureFile(rootDir, file, content);

      assert.deepEqual(collectMissingAiGovernanceReferences(
        rootDir,
        [{ file, contains }],
        codexSkillFiles
      ), [expected]);
    });
  });
});

test('skill 引用契约按显式 profile 分层，未知 skill 使用安全 core', () => {
  const [maintainerRule, specializedRule, unknownRule] = buildCodexSkillReferenceRules([
    '.agents/skills/jsonutils-maintainer/SKILL.md',
    '.agents/skills/jsonutils-ai-infra-evolver/SKILL.md',
    '.agents/skills/future-skill/SKILL.md',
  ]);

  assert.equal(maintainerRule.contains.includes('REMOTE_SCRIPT heredoc'), true);
  assert.equal(specializedRule.contains.includes('REMOTE_SCRIPT heredoc'), false);
  assert.equal(specializedRule.contains.includes('读写范围'), true);
  assert.equal(specializedRule.contains.includes('复盘沉淀'), true);
  assert.equal(unknownRule.contains.includes('REMOTE_SCRIPT heredoc'), false);
  assert.equal(unknownRule.contains.includes('读写范围'), true);
  assert.equal(unknownRule.contains.includes('复盘沉淀'), false);
});

test('文档引用规则直连权威清单且聚合模块不再代理领域导出', () => {
  assert.strictEqual(AI_GOVERNANCE_DOC_REFERENCE_RULES[0].contains, configModule.AI_CONFIG_INTEGRATION_REFERENCES);
  assert.strictEqual(AI_GOVERNANCE_DOC_REFERENCE_RULES[1].contains, AI_TOOLS_SETUP_REFERENCES);
  assert.equal(Object.hasOwn(configModule, 'AI_TOOLS_SETUP_REFERENCES'), false);
  assert.deepEqual(['CODE_STYLE_GOVERNANCE_REFERENCES', 'CORE_ENTRY_REFERENCES', 'ENTRY_GOVERNANCE_REFERENCES', 'PROJECT_AI_ASSET_OWNERSHIP_REFERENCES'].filter((name) => Object.hasOwn(runtimeReferenceGroups, name)), []);
});
