import {
  DEPLOY_SHELL_SYNTAX_REFERENCES,
  AI_EVOLUTION_LOOP_REFERENCES,
  AI_SAFETY_BOUNDARY_REFERENCES,
  CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
  PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceReferenceGroups.mjs';

const CORE_ENTRY_REFERENCES = [
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
];

const RUNTIME_GOVERNANCE_REFERENCES = [
  ...SUBAGENT_DELEGATION_REFERENCES,
  ...DEPLOY_SHELL_SYNTAX_REFERENCES,
  ...CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
  ...AI_SAFETY_BOUNDARY_REFERENCES,
  ...AI_EVOLUTION_LOOP_REFERENCES,
  'node scripts/ci/check-frontend-static-retention.mjs',
  ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
];

export const buildAiGovernanceEntryReferenceRules = (codexSkillFiles) => [
  {
    file: 'AGENTS.md',
    contains: [
      ...CORE_ENTRY_REFERENCES,
      ...SUBAGENT_DELEGATION_REFERENCES,
      ...AI_EVOLUTION_LOOP_REFERENCES,
    ],
  },
  {
    file: 'CLAUDE.md',
    contains: [
      ...CORE_ENTRY_REFERENCES,
      ...SUBAGENT_DELEGATION_REFERENCES,
      ...AI_EVOLUTION_LOOP_REFERENCES,
    ],
  },
  { file: 'rules/code-style.md', contains: AI_EVOLUTION_LOOP_REFERENCES },
  {
    file: '.claude/ai-tools-guide.md',
    contains: [
      'AGENTS.md',
      ...codexSkillFiles,
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      ...RUNTIME_GOVERNANCE_REFERENCES,
    ],
  },
  {
    file: '.codex/README.md',
    contains: [
      'AGENTS.md',
      ...CORE_ENTRY_REFERENCES,
      ...RUNTIME_GOVERNANCE_REFERENCES,
      ...codexSkillFiles.map(file => file.replace('.codex/', '')),
    ],
  },
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
  },
];
