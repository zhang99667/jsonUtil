import { REGISTRATION_CANARY_ANCHOR_RECEIPT } from './aiGovernanceRegistrationCanaryAnchorReceipt.mjs';
import { REGISTRATION_CANARY_DISCLOSURE_CONSUMPTION } from './aiGovernanceRegistrationCanaryDisclosureConsumption.mjs';

const nodeTest = (...files) => ['--test', ...files];

export const AI_EVOLUTION_REGISTRATION_CANARY_ANCHOR_CASES = Object.freeze({
  'mcp-registration-canary-anchor-receipt-boundary': {
    caseVersion: 1,
    subjectVersion: REGISTRATION_CANARY_ANCHOR_RECEIPT.version,
    evidenceScope: 'component-only',
    evidence: ['精确 checkpoint DSSE 绑定、派生唯一 key、状态转换、角色、可观察分叉与零信任升级负例'],
    argsList: [nodeTest('scripts/ci/aiGovernanceRegistrationCanaryAnchorReceipt.test.mjs')],
  },
  'mcp-registration-canary-disclosure-authorization-boundary': {
    caseVersion: 1,
    subjectVersion: REGISTRATION_CANARY_DISCLOSURE_CONSUMPTION.version,
    evidenceScope: 'component-only',
    evidence: ['脱敏 host commitment、anchor→authorized→consumed、角色 key 隔离、双授权/双消费与跨批负例'],
    argsList: [nodeTest(
      'scripts/ci/aiGovernanceRegistrationCanaryDisclosureCommitment.test.mjs',
      'scripts/ci/aiGovernanceRegistrationCanaryDisclosureAuthorization.test.mjs',
      'scripts/ci/aiGovernanceRegistrationCanaryDisclosureRedteam.test.mjs',
    )],
  },
});
