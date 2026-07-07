import {
  CODE_STYLE_GOVERNANCE_REFERENCES,
  CORE_ENTRY_REFERENCES,
  ENTRY_GOVERNANCE_REFERENCES,
  RUNTIME_GOVERNANCE_REFERENCES,
} from './aiGovernanceRuntimeReferenceGroups.mjs';
import { CLAUDE_README_REFERENCE_RULE } from './aiGovernanceClaudeReadmeReferenceRule.mjs';
import { PLAYBOOK_SECTION_REFERENCE_RULES } from './aiGovernancePlaybookSectionRules.mjs';

const buildAgentEntryRule = file => ({
  file,
  contains: [
    ...CORE_ENTRY_REFERENCES,
    ...ENTRY_GOVERNANCE_REFERENCES,
  ],
});

export const buildAiGovernanceEntryReferenceRules = codexSkillFiles => [
  buildAgentEntryRule('AGENTS.md'),
  buildAgentEntryRule('CLAUDE.md'),
  { file: 'rules/code-style.md', contains: CODE_STYLE_GOVERNANCE_REFERENCES },
  CLAUDE_README_REFERENCE_RULE,
  {
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    contains: [
      'AGENTS.md',
      'CLAUDE.md',
      ...codexSkillFiles,
      'npm run lint',
      'npm run check:preloads',
      ...RUNTIME_GOVERNANCE_REFERENCES,
      'git diff --check',
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
    sections: PLAYBOOK_SECTION_REFERENCE_RULES,
  },
];
