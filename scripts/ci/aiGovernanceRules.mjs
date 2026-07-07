import { buildAiGovernanceEntryReferenceRules } from './aiGovernanceEntryReferenceRules.mjs';
import { buildCodexSkillReferenceRules } from './aiGovernanceCodexSkillReferenceRules.mjs';
import { AI_GOVERNANCE_ASSET_REGISTRY_REFERENCE_RULE } from './aiGovernanceAssetRegistryReferenceRule.mjs';
import { AI_GOVERNANCE_DECISION_REFERENCE_RULE } from './aiGovernanceDecisionReferenceRule.mjs';
import { AI_GOVERNANCE_DOC_REFERENCE_RULES } from './aiGovernanceDocReferenceRules.mjs';
import { AI_GOVERNANCE_PULL_REQUEST_TEMPLATE_REFERENCE_RULE } from './aiGovernancePullRequestTemplateReferenceRule.mjs';
import { buildAiGovernanceToolEntryReferenceRules } from './aiGovernanceToolEntryReferenceRules.mjs';

export { buildAiGovernanceRequiredFiles } from './aiGovernanceRequiredFiles.mjs';

export const buildAiGovernanceReferenceRules = (codexSkillFiles) => [
  ...buildAiGovernanceEntryReferenceRules(codexSkillFiles),
  ...AI_GOVERNANCE_DOC_REFERENCE_RULES,
  AI_GOVERNANCE_DECISION_REFERENCE_RULE,
  AI_GOVERNANCE_ASSET_REGISTRY_REFERENCE_RULE,
  AI_GOVERNANCE_PULL_REQUEST_TEMPLATE_REFERENCE_RULE,
  ...buildAiGovernanceToolEntryReferenceRules(codexSkillFiles),
  ...buildCodexSkillReferenceRules(codexSkillFiles),
];
