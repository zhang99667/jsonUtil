import { AI_EVOLUTION_LOOP_REFERENCES, SUBAGENT_DELEGATION_REFERENCES } from './aiGovernanceCollaborationReferenceGroups.mjs';
import { AI_SAFETY_BOUNDARY_REFERENCES } from './aiGovernanceAiBoundaryReferenceGroups.mjs';
const REQUIRED_LEDGER_READING_REFERENCES = ['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md'];
const sectionRule = (sectionTitle, contains) => ({ sectionTitle, contains });
export const PLAYBOOK_SECTION_REFERENCE_RULES = [
  sectionRule('## 必读顺序', REQUIRED_LEDGER_READING_REFERENCES),
  sectionRule('### 0. 判断子 Agent 委派', SUBAGENT_DELEGATION_REFERENCES),
  sectionRule('### 3. 编码约束', AI_SAFETY_BOUNDARY_REFERENCES),
  sectionRule('### 5. 规则进化闭环', AI_EVOLUTION_LOOP_REFERENCES),
];
export const AI_TOOLS_SETUP_SECTION_REFERENCE_RULES = [
  sectionRule('## 必读顺序', REQUIRED_LEDGER_READING_REFERENCES),
];
export const AI_EVOLUTION_PLAYBOOK_SECTION_REFERENCE_RULES = [
  sectionRule('## 按需字段协议', ['evals/ai-governance/README.md', 'grader', 'ledger', 'outcome/receipt', 'checker', 'trace', 'runner', 'controller']),
  sectionRule('### Outcome ledger', ['schemaVersion: 2', 'trial-receipts.jsonl', '即时重放', 'legacy']),
  sectionRule('## Skill 评测', ['同一任务', '隔离可写工作区', 'execution transcript', '前后状态快照', '`unavailable`']),
];
export const AI_EVOLUTION_LEDGER_README_SECTION_REFERENCE_RULES = [
  sectionRule('## Grader calibration', ['gradeRegistrationCanaryResultBlind', 'macro-F1', 'mutation sensitivity', 'behaviorCoverageDelta=0', 'outcomeEligible=false']),
  sectionRule('## Feedback 与 experiment', ['不是第三种 outcome', '完整 experiment SHA-256', '未登记 experiment', '至少 3 个 paired repetitions', 'execution.status=ready', 'ingestion.status=ready', 'fresh-task-observation-ready/actionable', '禁止写 inbox、receipt、outcome 或长期 rule']),
  sectionRule('## 版本与写入顺序', ['只能追加 v3', 'chain.sequence', 'JSON.stringify(outcome)', '默认 preview', 'ledgerMutationPerformed', 'journal cleanup 不算 ledger mutation']),
  sectionRule('### Deterministic authoring', ['behavior-fail', 'component-fail', 'delivery-blocked', 'infrastructure-invalid', '--write', 'O_EXCL lock/journal']),
  sectionRule('### Unverified trace authoring', ['fatal UTF-8', '额外字段', 'ready', 'already-current', 'trace-bound-unverified', 'CI、GitHub Actions、hook、postinstall']),
  sectionRule('### Paired receipt v4 authoring', ['pre-execution assignment', 'pre-unblind grade-set checkpoint', 'treatment contamination', 'signature-verified-unwitnessed', 'trustPolicyProtected=false', '即使 `--write` 也不 acquire/recover/写 ledger']),
  sectionRule('## 哈希链', ['长度前缀', 'jsonutils.ai-evolution.outcome-legacy-prefix/v1', 'jsonutils.ai-evolution.outcome-line/v3', 'chain.previousHash', 'headSha256']),
  sectionRule('## Lineage 与反馈处置', ['lineage key', 'supersession.previousOutcomeId', 'feedbackDisposition', 'resolved']),
  sectionRule('## Receipt、重放与隐私', ['receipt v1', 'receipt v2/v3', 'receipt v4', '孤儿', '复用', 'gradeTarget', '原始 prompt']),
  sectionRule('## Observable trace v1', ['afterRevision', '从 1 连续递增的 sequence', '不保存命令或 stdout', '1 MiB', '10,000', '200', 'traceBoundOutcomes']),
  sectionRule('## 可信边界', ['tamper-evident', 'unknown', '身份', '不可篡改', 'trustedSigners=0', 'transparency log', '可信 attestation']),
];
