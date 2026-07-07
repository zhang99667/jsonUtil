import { RUNTIME_GOVERNANCE_REFERENCES } from './aiGovernanceRuntimeReferenceGroups.mjs';

export const buildCodexSkillReferenceRules = (codexSkillFiles) => (
  codexSkillFiles.map(file => ({
    file,
    contains: [
      'AGENTS.md',
      'rules/code-style.md',
      'docs/AI-ENGINEERING-PLAYBOOK.md',
      'docs/AI-ASSET-REGISTRY.md',
      'npm run lint',
      'npm run typecheck',
      'npm run build',
      'npm run check:preloads',
      ...RUNTIME_GOVERNANCE_REFERENCES,
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
  }))
);
