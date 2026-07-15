import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';
import { AI_GOVERNANCE_REFERENCE_CORE_MISSING_CASES } from './aiGovernanceReferenceCoreMissingCases.mjs';
import { AI_GOVERNANCE_REFERENCE_ENTRY_MISSING_CASES } from './aiGovernanceReferenceEntryMissingCases.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

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
