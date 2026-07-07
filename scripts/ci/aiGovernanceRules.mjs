import { buildAiGovernanceEntryReferenceRules } from './aiGovernanceEntryReferenceRules.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';

export { buildAiGovernanceRequiredFiles } from './aiGovernanceRequiredFiles.mjs';

export const buildAiGovernanceReferenceRules = (codexSkillFiles) => [
  ...buildAiGovernanceEntryReferenceRules(codexSkillFiles),
  ...buildCodexSkillReferenceRules(codexSkillFiles),
];
