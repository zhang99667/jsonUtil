import {
  CORE_SKILL_GOVERNANCE_REFERENCES,
  RUNTIME_GOVERNANCE_REFERENCES,
  SPECIALIZED_SKILL_GOVERNANCE_REFERENCES,
} from './aiGovernanceRuntimeReferenceGroups.mjs';
import {
  CODEX_SKILL_PROFILE_IDS,
  resolveCodexSkillProfile,
} from './aiGovernanceCodexSkillProfiles.mjs';

const PROFILE_GOVERNANCE_REFERENCES = {
  [CODEX_SKILL_PROFILE_IDS.CORE]: CORE_SKILL_GOVERNANCE_REFERENCES,
  [CODEX_SKILL_PROFILE_IDS.MAINTAINER_RUNTIME]: RUNTIME_GOVERNANCE_REFERENCES,
  [CODEX_SKILL_PROFILE_IDS.AI_INFRA_EVOLUTION]: SPECIALIZED_SKILL_GOVERNANCE_REFERENCES,
};

const skillGovernanceReferences = file => PROFILE_GOVERNANCE_REFERENCES[resolveCodexSkillProfile(file).id];

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
      ...skillGovernanceReferences(file),
      'node scripts/ci/check-maintainability-budgets.mjs',
    ],
  }))
);
