import { governanceAiDocReferenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-doc-reference-rules.mjs';
import { governanceAiReferenceSupportMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-support-rules.mjs';

const governanceAiReferenceEntryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReferenceEntryMaintainabilityBudgets = [
  governanceAiReferenceEntryBudget('scripts/ci/maintainability-budget-governance-ai-reference-entry-rules.mjs', 15, 'AI 治理引用入口预算子表应只组合文档、入口和支撑引用规则预算'),
  governanceAiReferenceEntryBudget('scripts/ci/aiGovernanceRules.mjs', 75, 'AI 治理引用规则入口应只负责组合文档入口和 skill 引用规则'),
  governanceAiReferenceEntryBudget('scripts/ci/aiGovernanceEntryReferenceRules.mjs', 45, 'AI 治理入口文档引用规则应集中维护根入口、Playbook 和目录 README 的关键引用'),
  ...governanceAiDocReferenceMaintainabilityBudgets,
  ...governanceAiReferenceSupportMaintainabilityBudgets,
];
