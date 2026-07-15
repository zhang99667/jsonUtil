import { REGISTRATION_CANARY_GRADE_CHECKPOINT } from './aiGovernanceRegistrationCanaryGradeCheckpoint.mjs';
import { REGISTRATION_CANARY_PACKET } from './aiGovernanceRegistrationCanaryPacket.mjs';
import { REGISTRATION_CANARY_REVIEW } from './aiGovernanceRegistrationCanaryReview.mjs';
import { REGISTRATION_CANARY_SEALED_SNAPSHOT } from './aiGovernanceRegistrationCanarySealedSnapshot.mjs';
import { AI_EVOLUTION_REGISTRATION_CANARY_ANCHOR_CASES } from './aiGovernanceRegistrationCanaryAnchorCaseDescriptors.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_REGISTRATION_CANARY_CASES = Object.freeze({
  [REGISTRATION_CANARY_SEALED_SNAPSHOT.caseId]: {
    caseVersion: 3,
    subjectVersion: REGISTRATION_CANARY_SEALED_SNAPSHOT.version,
    evidenceScope: 'component-only',
    evidence: ['hermetic Git/PATH、source-state v2、ledger-only HEAD 稳定性、stable descriptor、owner-only mode、setup 清理、失败 retention、有界脱敏 stdio 与真实 snapshot MCP 负例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceRegistrationCanarySealedSnapshot.test.mjs',
      'scripts/ci/mcpLineDelimitedStdioClient.test.mjs',
      'scripts/ci/aiGovernanceRegistrationCanarySnapshotPreflight.test.mjs',
    )],
  },
  'mcp-registration-canary-launch-packet-boundary': {
    caseVersion: 1,
    subjectVersion: REGISTRATION_CANARY_PACKET.version,
    evidenceScope: 'component-only',
    evidence: ['Agent/grader/host 三视图隔离、snapshot/ledger 绑定、交替顺序、arm/lease/隐私负例'],
    argsList: [nodeTest('scripts/ci/aiGovernanceRegistrationCanaryPacket.test.mjs')],
  },
  'mcp-registration-canary-result-ingestion-boundary': {
    caseVersion: 1,
    subjectVersion: REGISTRATION_CANARY_REVIEW.version,
    evidenceScope: 'component-only',
    evidence: ['闭字段 result、observable trace 复用、blind grade set、host-only unblind、未验信指标与零自动写入负例'],
    argsList: [nodeTest('scripts/ci/aiGovernanceRegistrationCanaryResult.test.mjs')],
  },
  'mcp-registration-canary-grade-checkpoint-request-boundary': {
    caseVersion: 1,
    subjectVersion: REGISTRATION_CANARY_GRADE_CHECKPOINT.version,
    evidenceScope: 'component-only',
    evidence: ['detached checkpoint request 的 grade-set/case/policy/fixture/environment/rubric 绑定与 external-anchor-required 负例'],
    argsList: [nodeTest('scripts/ci/aiGovernanceRegistrationCanaryGradeCheckpoint.test.mjs')],
  },
  ...AI_EVOLUTION_REGISTRATION_CANARY_ANCHOR_CASES,
});
