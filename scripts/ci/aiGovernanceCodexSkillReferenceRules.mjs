import {
  DEPLOY_SHELL_SYNTAX_REFERENCES,
  AI_EVOLUTION_LOOP_REFERENCES,
  AI_SAFETY_BOUNDARY_REFERENCES,
  CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
  PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
  SUBAGENT_DELEGATION_REFERENCES,
} from './aiGovernanceReferenceGroups.mjs';

export const buildCodexSkillReferenceRules = (codexSkillFiles) => (
  codexSkillFiles.map(file => ({
    file,
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'npm run lint',
      'npm run typecheck',
      'npm run build',
      'npm run check:preloads',
      ...SUBAGENT_DELEGATION_REFERENCES,
      ...DEPLOY_SHELL_SYNTAX_REFERENCES,
      ...CHUNK_LOAD_RECOVERY_CATCH_REFERENCES,
      ...AI_SAFETY_BOUNDARY_REFERENCES,
      ...AI_EVOLUTION_LOOP_REFERENCES,
      'node scripts/ci/check-frontend-static-retention.mjs',
      'node scripts/ci/check-maintainability-budgets.mjs',
      ...PUBLIC_FRONTEND_ASSET_AUDIT_REFERENCES,
    ],
  }))
);
