import { collectSkillDirectoryContractFailures } from './aiGovernanceCodexSkillDirectoryContract.mjs';
import { collectSkillNpmScriptContractFailures } from './aiGovernanceCodexSkillNpmScriptContract.mjs';
import { collectSkillReferenceContractFailures } from './aiGovernanceCodexSkillReferenceContract.mjs';
import { collectSkillReleaseContractFailures } from './aiGovernanceCodexSkillReleaseContract.mjs';
import { collectSkillSectionContentFailures } from './aiGovernanceCodexSkillSectionContract.mjs';
import { collectSkillStructureContractFailures } from './aiGovernanceCodexSkillStructureContract.mjs';

export const CODEX_SKILL_CONTRACT_COLLECTORS = [
  (_, file, content) => collectSkillStructureContractFailures(file, content),
  (_, file, content) => collectSkillSectionContentFailures(file, content),
  collectSkillReferenceContractFailures,
  collectSkillDirectoryContractFailures,
  collectSkillNpmScriptContractFailures,
  collectSkillReleaseContractFailures,
];
