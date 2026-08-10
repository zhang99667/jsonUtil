import { governanceAiDocReferenceMaintainabilityBudgets } from './maintainability-budget-governance-ai-doc-reference-rules.mjs';
import { governanceAiReferenceSupportMaintainabilityBudgets } from './maintainability-budget-governance-ai-reference-support-rules.mjs';

const governanceAiReferenceEntryBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiReferenceEntryMaintainabilityBudgets = [
  governanceAiReferenceEntryBudget('scripts/ci/maintainability-budget-governance-ai-reference-entry-rules.mjs', 15, 'AI 治理引用入口预算子表应只组合文档、入口和支撑引用规则预算'),
  governanceAiReferenceEntryBudget('scripts/ci/aiGovernanceRules.mjs', 75, 'AI 治理引用规则入口应只负责组合文档入口和 skill 引用规则'),
  governanceAiReferenceEntryBudget('scripts/ci/aiGovernanceProjectEntryReferenceRules.mjs', 40, 'AI 治理固定项目入口引用规则应只维护根入口和 Claude 目录 README 的关键引用'),
  governanceAiReferenceEntryBudget('scripts/ci/aiGovernancePlaybookReferenceRules.mjs', 40, 'AI 治理 Playbook 引用规则应只维护动态 skill 引用、工程运行时契约和演进章节契约'),
  ...governanceAiDocReferenceMaintainabilityBudgets,
  ...governanceAiReferenceSupportMaintainabilityBudgets,
];
