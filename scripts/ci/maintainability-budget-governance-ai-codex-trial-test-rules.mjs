import { governanceAiCodexRuntimeTestMaintainabilityBudgets } from './maintainability-budget-governance-ai-codex-runtime-test-rules.mjs';
const trialTestBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiCodexTrialTestMaintainabilityBudgets = [
  trialTestBudget('scripts/ci/maintainability-budget-governance-ai-codex-trial-test-rules.mjs', 20, 'Codex trial 测试预算子表应只维护 JSONL framing/projection/adapter、profile、runtime 子表、CLI 与 fixture 测试'),
  trialTestBudget('scripts/ci/aiGovernanceCodexExecJsonlFraming.test.mjs', 130, 'JSONL framing 测试应锁定原始字节边界、任意分块、超限恢复、严格 UTF-8 与事件上限'),
  trialTestBudget('scripts/ci/aiGovernanceCodexExecTraceProjection.test.mjs', 180, 'JSONL projection 测试应锁定 framing 集成、lifecycle、MCP 脱敏、完整性和 trace 上限'),
  trialTestBudget('scripts/ci/aiGovernanceCodexExecTraceAdapter.test.mjs', 360, 'Codex JSONL adapter 测试应锁定版本、终止、隐私与组件边界'),
  trialTestBudget('scripts/ci/aiGovernanceCodexFixedMcpTrial.test.mjs', 210, '固定 MCP verifier 测试应锁定不可执行 descriptor、空认证根、路径裁剪与 fail-closed'),
  trialTestBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialCapture.test.mjs', 60, '固定 MCP artifact 测试应锁定闭字段、绑定和正文注入负例'),
  trialTestBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialLedger.test.mjs', 60, '固定 MCP ledger 测试应锁定 ancestor symlink 与 endpoint 漂移'),
  trialTestBudget('scripts/ci/aiGovernanceCodexFixedMcpCaptureTestFixtures.mjs', 50, '固定 MCP capture fixture 应只构造脱敏未验信 JSON artifact'),
  trialTestBudget('scripts/ci/aiGovernanceCodexFixedMcpTrialTestFixtures.mjs', 100, '固定 MCP trial fixture 应只构造脱敏 shim 与固定 validation'),
  trialTestBudget('scripts/ci/run-ai-codex-fixed-mcp-trial.test.mjs', 100, '固定 MCP CLI 测试应锁定 preflight-only、import 前 key guard 与无自动入账'),
  ...governanceAiCodexRuntimeTestMaintainabilityBudgets,
];
