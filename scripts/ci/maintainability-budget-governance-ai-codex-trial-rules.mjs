import { governanceAiCodexRuntimeMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-runtime-rules.mjs';
const trialBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCodexTrialMaintainabilityBudgets = [
  trialBudget('scripts/ci/maintainability-budget-governance-ai-codex-trial-rules.mjs', 17, 'Codex trial 预算子表应只维护 capture、profile、preflight、runner、runtime 子表与 CLI'),
  trialBudget('scripts/ci/aiGovernanceCodexExecCaptureRuntime.mjs', 90, 'Codex runtime 只允许 binary 摘要与显式空认证根下的 version preflight'),
  trialBudget('scripts/ci/aiGovernanceCodexExecTraceAdapter.mjs', 100, 'Codex JSONL adapter 只能投影外部输入，禁止启动 Codex 或读取认证路径'),
  trialBudget('scripts/ci/aiGovernanceCodexExecTraceProjection.mjs', 360, 'Codex JSONL projection 应只维护流式协议、脱敏事件与完整性'),
  trialBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialProfile.mjs', 150, '固定 MCP profile 只维护隔离、binary 绑定与不可执行 component descriptor'),
  trialBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialPreflight.mjs', 80, '固定 MCP preflight 应只维护 keyless version 与 binary 再绑定'),
  trialBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialCapture.mjs', 120, '固定 MCP capture helper 应只解析闭字段未验信 artifact 并绑定 component descriptor'),
  trialBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialLedger.mjs', 80, '固定 MCP ledger helper 应只维护双账本身份与精确摘要快照'),
  trialBudget('scripts/ci/aiGovernanceCodexFixedMcpTrial.mjs', 150, '固定 MCP verifier 应只编排无凭据 validation、artifact 校验与组件评分'),
  trialBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialCli.mjs', 80, '固定 MCP preflight CLI 应只维护封闭参数与 component-only 输出'),
  trialBudget('scripts/ci/run-ai-codex-fixed-mcp-trial.mjs', 30, '固定 MCP 入口应在动态导入仓库模块前拒绝模型凭据'),
  ...governanceAiCodexRuntimeMaintainabilityBudgets,
];
