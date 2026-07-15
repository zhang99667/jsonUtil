import {
  CODE_STYLE_GOVERNANCE_REFERENCES,
  CORE_ENTRY_REFERENCES,
  ENTRY_GOVERNANCE_REFERENCES,
  RUNTIME_GOVERNANCE_REFERENCES,
  PROJECT_AI_ASSET_OWNERSHIP_REFERENCES,
} from './aiGovernanceRuntimeReferenceGroups.mjs';
import { CLAUDE_README_REFERENCE_RULE } from './aiGovernanceClaudeReadmeReferenceRule.mjs';
import {
  AI_EVOLUTION_PLAYBOOK_SECTION_REFERENCE_RULES,
  PLAYBOOK_SECTION_REFERENCE_RULES,
} from './aiGovernancePlaybookSectionRules.mjs';

const buildAgentEntryRule = file => ({
  file,
  contains: [
    ...CORE_ENTRY_REFERENCES,
    ...ENTRY_GOVERNANCE_REFERENCES,
  ],
});

export const buildAiGovernanceEntryReferenceRules = codexSkillFiles => [
  { file: 'README.md', contains: ['docs/AI-TOOLS-SETUP.md',
    'node scripts/ci/check-ai-asset-distribution.mjs --workspace', 'node scripts/ci/manage-project-plugins.mjs --check', '不会因 clone 或打开项目自动安装'] },
  { file: 'CONTRIBUTING.md', contains: ['docs/AI-ENGINEERING-PLAYBOOK.md',
    'node scripts/ci/check-ai-asset-distribution.mjs --index', '使用 `--head`', 'node scripts/ci/manage-project-plugins.mjs --check', '新建任务'] },
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
      'node scripts/ci/check-ai-validation-whitespace.mjs',
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
    sections: PLAYBOOK_SECTION_REFERENCE_RULES,
  },
  {
    file: 'docs/AI-EVOLUTION-PLAYBOOK.md',
    contains: ['scripts/ci/run-ai-evolution-cases.mjs', 'evals/ai-governance/trial-receipts.jsonl', ...PROJECT_AI_ASSET_OWNERSHIP_REFERENCES],
    sections: AI_EVOLUTION_PLAYBOOK_SECTION_REFERENCE_RULES,
  },
];
