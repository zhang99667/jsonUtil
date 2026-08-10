import { PROJECT_AI_ASSET_OWNERSHIP_REFERENCES } from './aiGovernanceEntryCoreReferenceGroups.mjs';
import {
  AI_EVOLUTION_PLAYBOOK_SECTION_REFERENCE_RULES,
  PLAYBOOK_SECTION_REFERENCE_RULES,
} from './aiGovernancePlaybookSectionRules.mjs';
import { RUNTIME_GOVERNANCE_REFERENCES } from './aiGovernanceRuntimeReferenceGroups.mjs';

export const buildAiGovernancePlaybookReferenceRules = codexSkillFiles => [
  {
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    contains: [
      'AGENTS.md',
      'CLAUDE.md',
      ...codexSkillFiles,
      'npm run lint',
      'npm run check:preloads',
      ...RUNTIME_GOVERNANCE_REFERENCES,
      '.codex/config.toml', '兼容插件', '新建任务',
      'node scripts/ci/check-ai-validation-whitespace.mjs',
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
    sections: PLAYBOOK_SECTION_REFERENCE_RULES,
  },
  {
    file: 'docs/AI-EVOLUTION-PLAYBOOK.md',
    contains: ['scripts/ci/run-ai-evolution-cases.mjs', 'evals/ai-governance/trial-receipts.jsonl', '.codex/config.toml', 'compatibility-plugin', 'fresh task', ...PROJECT_AI_ASSET_OWNERSHIP_REFERENCES],
    sections: AI_EVOLUTION_PLAYBOOK_SECTION_REFERENCE_RULES,
  },
];
