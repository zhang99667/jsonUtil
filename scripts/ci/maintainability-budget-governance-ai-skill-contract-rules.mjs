import { governanceAiSkillCommandMaintainabilityBudgets } from './maintainability-budget-governance-ai-skill-command-rules.mjs';

const governanceAiSkillContractBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiSkillContractMaintainabilityBudgets = [
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillContract.mjs', 25, 'AI 治理 Codex skill 契约入口应只读取 skill 并执行契约收集器列表'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillContractCollectors.mjs', 25, 'AI 治理 Codex skill 契约收集器列表应独立维护结构、章节、引用、目录、命令和发布契约顺序'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillContent.mjs', 15, 'AI 治理 Codex skill 内容读取 helper 应独立维护存在性检查和 UTF-8 读取'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillContextBudgetContract.mjs', 45, 'AI 治理 Codex skill 上下文预算契约应只统计必读章节引用和 skill 本体字节数'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillContextPaths.mjs', 60, 'AI 治理 Codex skill 上下文路径 helper 应统一识别反引号路径、递归计费目录并拒绝越界引用'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillEvalContract.mjs', 80, 'AI 治理 Codex skill eval 契约应校验路由、样例 schema、唯一性和可评分 assertions'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillFrontmatterContract.mjs', 40, 'AI 治理 Codex skill frontmatter 契约应独立维护 name、description、version 和 tags 元数据校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillMetadata.mjs', 20, 'AI 治理 Codex skill metadata helper 应统一解析官方 metadata 版本与标签'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillReleaseContract.mjs', 35, 'AI 治理 Codex skill 发布契约应独立维护 name 与 version 的 CHANGELOG 追踪校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillReleaseTrace.mjs', 30, 'AI 治理 Codex skill 发布追踪 helper 应独立维护 CHANGELOG 读取和 name/version 同行匹配'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillStructureContract.mjs', 30, 'AI 治理 Codex skill 结构契约应独立维护 frontmatter 边界和核心章节存在性校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillUiContract.mjs', 40, 'AI 治理 Codex skill UI 契约应校验官方 openai.yaml 的界面字段和默认提示引用'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillReferenceContract.mjs', 35, 'AI 治理 Codex skill 引用契约应独立维护项目路径和验证脚本存在性校验'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillProfiles.mjs', 60, 'AI 治理 Codex skill profile 应显式路由已知 skill、派生必需 eval，并为未知 skill 保留安全 core 但阻止静默合入'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillSectionContract.mjs', 65, 'AI 治理 Codex skill 章节契约应分离通用 core、maintainer 运行时与 AI 基建演进要求'),
  governanceAiSkillContractBudget('scripts/ci/aiGovernanceCodexSkillSourceContract.mjs', 35, 'AI 治理 Codex skill source 契约应拒绝 legacy 副本及 canonical/legacy symlink'),
  ...governanceAiSkillCommandMaintainabilityBudgets,
];
