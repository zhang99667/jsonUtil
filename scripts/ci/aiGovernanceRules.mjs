import { buildAiGovernanceEntryReferenceRules } from './aiGovernanceEntryReferenceRules.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';
import { buildAiGovernanceToolEntryReferenceRules } from './aiGovernanceToolEntryReferenceRules.mjs';

export { buildAiGovernanceRequiredFiles } from './aiGovernanceRequiredFiles.mjs';

export const buildAiGovernanceReferenceRules = (codexSkillFiles) => [
  ...buildAiGovernanceEntryReferenceRules(codexSkillFiles),
  ...buildAiGovernanceToolEntryReferenceRules(),
  ...buildCodexSkillReferenceRules(codexSkillFiles),
];
