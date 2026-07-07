import { buildAiGovernanceEntryReferenceRules } from './aiGovernanceEntryReferenceRules.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';
import { AI_GOVERNANCE_DOC_REFERENCE_RULES } from './aiGovernanceDocReferenceRules.mjs';
import { buildAiGovernanceToolEntryReferenceRules } from './aiGovernanceToolEntryReferenceRules.mjs';

export { buildAiGovernanceRequiredFiles } from './aiGovernanceRequiredFiles.mjs';

export const buildAiGovernanceReferenceRules = (codexSkillFiles) => [
  ...buildAiGovernanceEntryReferenceRules(codexSkillFiles),
  ...AI_GOVERNANCE_DOC_REFERENCE_RULES,
  ...buildAiGovernanceToolEntryReferenceRules(),
  ...buildCodexSkillReferenceRules(codexSkillFiles),
];
