import {
  DEPLOY_SHELL_SYNTAX_REFERENCES,
  CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
  PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceReferenceGroups.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';

export { buildAiGovernanceRequiredFiles } from './aiGovernanceRequiredFiles.mjs';

export const buildAiGovernanceReferenceRules = (codexSkillFiles) => [
  { file: 'AGENTS.md', contains: ['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', ...SUBAGENT_DELEGATION_REFERENCES] },
  { file: 'CLAUDE.md', contains: ['rules/code-style.md', 'docs/AI-ENGINEERING-PLAYBOOK.md', ...SUBAGENT_DELEGATION_REFERENCES] },
  {
    file: '.claude/ai-tools-guide.md',
    contains: [
      'AGENTS.md',
      ...codexSkillFiles,
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      ...SUBAGENT_DELEGATION_REFERENCES,
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      ...CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
    ],
  },
  {
    file: '.codex/README.md',
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      ...SUBAGENT_DELEGATION_REFERENCES,
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      ...CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
      ...codexSkillFiles.map(file => file.replace('.codex/', '')),
    ],
  },
  ...buildCodexSkillReferenceRules(codexSkillFiles),
  {
    file: 'docs/AI-ENGINEERING-PLAYBOOK.md',
    contains: [
      'AGENTS.md',
      'CLAUDE.md',
      ...codexSkillFiles,
      'npm run lint',
      'npm run check:preloads',
      ...SUBAGENT_DELEGATION_REFERENCES,
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      ...CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      'git diff --check',
      'node scripts/ci/check-maintainability-budgets.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
    ],
  },
];
