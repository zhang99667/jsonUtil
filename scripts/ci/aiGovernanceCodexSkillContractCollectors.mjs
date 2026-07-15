import { collectSkillDirectoryContractFailures } from './aiGovernanceCodexSkillDirectoryContract.mjs';
import { collectSkillEvalContractFailures } from './aiGovernanceCodexSkillEvalContract.mjs';
import { collectSkillMandatoryContextBudgetFailures } from './aiGovernanceCodexSkillContextBudgetContract.mjs';
import { collectSkillNpmScriptContractFailures } from './aiGovernanceCodexSkillNpmScriptContract.mjs';
import { collectSkillReferenceContractFailures } from './aiGovernanceCodexSkillReferenceContract.mjs';
import { collectSkillReleaseContractFailures } from './aiGovernanceCodexSkillReleaseContract.mjs';
import { collectSkillSectionContentFailures } from './aiGovernanceCodexSkillSectionContract.mjs';
import { collectSkillStructureContractFailures } from './aiGovernanceCodexSkillStructureContract.mjs';
import { collectSkillUiContractFailures } from './aiGovernanceCodexSkillUiContract.mjs';
import { collectSkillProfileClassificationFailures } from './aiGovernanceCodexSkillProfiles.mjs';

export const CODEX_SKILL_CONTRACT_COLLECTORS = [
  (_, file, content) => collectSkillStructureContractFailures(file, content),
  (_, file) => collectSkillProfileClassificationFailures(file),
  (rootDir, file) => collectSkillUiContractFailures(rootDir, file),
  (rootDir, file) => collectSkillEvalContractFailures(rootDir, file),
  collectSkillMandatoryContextBudgetFailures,
  (_, file, content) => collectSkillSectionContentFailures(file, content),
  collectSkillReferenceContractFailures,
  collectSkillDirectoryContractFailures,
  collectSkillNpmScriptContractFailures,
  collectSkillReleaseContractFailures,
];
