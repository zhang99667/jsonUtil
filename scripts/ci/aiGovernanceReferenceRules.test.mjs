import assert from 'node:assert/strict';
import { test } from 'node:test';

import { collectMissingAiGovernanceReferences } from './aiGovernanceChecks.mjs';
import { AI_GOVERNANCE_REFERENCE_CORE_MISSING_CASES } from './aiGovernanceReferenceCoreMissingCases.mjs';
import { AI_GOVERNANCE_REFERENCE_ENTRY_MISSING_CASES } from './aiGovernanceReferenceEntryMissingCases.mjs';
import { withAiGovernanceTempRoot, writeFixtureFile } from './aiGovernanceTestFixtures.mjs';

const codexSkillFiles = ['.codex/skills/jsonutils-maintainer/SKILL.md'];
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
