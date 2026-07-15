import { governanceAiRegistrationAnchorMaintainabilityBudgets } from './maintainability-budget-governance-ai-registration-anchor-rules.mjs';

const snapshotBudget = (file, maxLines, reason) => ({ file, maxLines, reason });

export const governanceAiRegistrationSnapshotMaintainabilityBudgets = [
  snapshotBudget('scripts/ci/maintainability-budget-governance-ai-registration-snapshot-rules.mjs', 22, 'Registration snapshot 预算子表只维护 source、manifest、producer、preflight、CLI 与 anchor 子表'),
  snapshotBudget('scripts/ci/aiGovernanceRequiredRegistrationSnapshotFiles.mjs', 22, 'Registration snapshot 必需资产子表只登记 hermetic inventory 到 preflight 的闭环文件与预算'),
  snapshotBudget('scripts/ci/aiGovernanceHermeticGitInventory.mjs', 125, 'Hermetic Git helper 集中维护固定可执行文件、净化环境、严格 UTF-8/NUL path inventory 与固定脱敏失败'),
  snapshotBudget('scripts/ci/aiGovernanceEvolutionSnapshotPrimitives.mjs', 120, 'Snapshot primitives 只维护旧 revision 字节语义、增量 hash 与 descriptor 有界稳定读取'),
  snapshotBudget('scripts/ci/aiGovernanceEvolutionSealedWorktreeManifest.mjs', 260, 'Sealed worktree verifier 只维护闭字段 manifest、exact-set/owner-only mode/digest 复核与原 revision 重建'),
  snapshotBudget('scripts/ci/aiGovernanceRegistrationCanarySnapshotSource.mjs', 175, 'Snapshot source reader 只维护 Git source 分类、敏感边界、descriptor 有界读取与双遍一致性'),
  snapshotBudget('scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.mjs', 200, 'Registration snapshot producer 只维护 owner-only staging、增量 copy、原子封存与失败 retention'),
  snapshotBudget('scripts/ci/mcpLineDelimitedStdioClient.mjs', 130, 'MCP newline stdio client 只维护有界 buffer/queue、脱敏错误、超时与 response id'),
  snapshotBudget('scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.mjs', 280, 'Snapshot preflight 只维护 packet binding、私有 retained home、有界 stdio、best-effort 进程组与前后摘要复核'),
  snapshotBudget('scripts/ci/prepare-ai-registration-canary-snapshot.mjs', 135, 'Snapshot CLI 只组合封存、packet 等价、projection digest 和 component preflight'),
  ...governanceAiRegistrationAnchorMaintainabilityBudgets,
];
