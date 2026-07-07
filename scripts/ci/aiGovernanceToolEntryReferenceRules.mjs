import {
  CORE_ENTRY_REFERENCES,
  RUNTIME_GOVERNANCE_REFERENCES,
} from './aiGovernanceRuntimeReferenceGroups.mjs';

const TOOL_ENTRY_BASE_REFERENCES = [
  'AGENTS.md',
  'CLAUDE.md',
  ...CORE_ENTRY_REFERENCES,
  ...RUNTIME_GOVERNANCE_REFERENCES,
  'node scripts/ci/check-maintainability-budgets.mjs',
];

const buildToolEntryRule = (file, peerFile) => ({
  file,
  contains: [
    ...TOOL_ENTRY_BASE_REFERENCES,
    peerFile,
  ],
});

export const buildAiGovernanceToolEntryReferenceRules = () => [
  buildToolEntryRule('.cursorrules', '.comate/rules/code-style.md'),
  buildToolEntryRule('.comate/rules/code-style.md', '.cursorrules'),
];
