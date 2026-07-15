import { createHash } from 'node:crypto';

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const CHAIN_FIELDS = new Set(['sequence', 'previousHash']);
const SUPERSESSION_FIELDS = new Set(['previousOutcomeId', 'feedbackDisposition', 'summary']);
const FEEDBACK_DISPOSITIONS = new Set(['none', 'open', 'resolved']);
const LEGACY_PREFIX_DOMAIN = 'jsonutils.ai-evolution.outcome-legacy-prefix/v1';
const V3_LINE_DOMAIN = 'jsonutils.ai-evolution.outcome-line/v3';

const updateLengthPrefixed = (hash, value) => {
  const bytes = Buffer.from(value, 'utf8');
  const length = Buffer.alloc(8);
  length.writeBigUInt64BE(BigInt(bytes.length));
  hash.update(length);
  hash.update(bytes);
};

const hashLines = (domain, lines) => {
  const hash = createHash('sha256');
  updateLengthPrefixed(hash, domain);
  lines.forEach(line => updateLengthPrefixed(hash, line));
  return hash.digest('hex');
};

export const hashEvolutionOutcomeLegacyPrefix = lines => hashLines(LEGACY_PREFIX_DOMAIN, lines);
export const hashEvolutionOutcomeV3Line = line => hashLines(V3_LINE_DOMAIN, [line]);

const unexpectedFields = (value, allowed, label) => Object.keys(value)
  .filter(field => !allowed.has(field))
  .map(field => `${label}.${field} 不在允许字段中`);

const lineageKey = outcome => JSON.stringify([
  outcome?.caseId,
  outcome?.caseVersion,
  outcome?.subjectVersion,
]);

const expectedDisposition = (outcome, previous) => {
  if (outcome.verdict === 'fail' || outcome.verdict === 'partial') return 'open';
  return previous && (previous.verdict === 'fail' || previous.verdict === 'partial') ? 'resolved' : 'none';
};

const collectV3Failures = ({ outcome, line, ordinal, legacyLines, previousV3Line, previousOutcome }) => {
  const label = `outcomes.jsonl: 第 ${ordinal} 条 v3 outcome`;
  const failures = [];
  if (line !== JSON.stringify(outcome)) failures.push(`${label} 必须使用精确紧凑 JSON`);
  const chain = outcome.chain;
  if (!chain || typeof chain !== 'object' || Array.isArray(chain)) failures.push(`${label}.chain 必须是对象`);
  else {
    failures.push(...unexpectedFields(chain, CHAIN_FIELDS, `${label}.chain`));
    if (!Number.isSafeInteger(chain.sequence) || chain.sequence !== ordinal) {
      failures.push(`${label}.chain.sequence 必须是与非空行位置一致的安全整数`);
    }
    const expectedHash = previousV3Line === null
      ? hashEvolutionOutcomeLegacyPrefix(legacyLines)
      : hashEvolutionOutcomeV3Line(previousV3Line);
    if (!SHA256_PATTERN.test(chain.previousHash ?? '') || chain.previousHash !== expectedHash) {
      failures.push(`${label}.chain.previousHash 未绑定直接前驱或完整 legacy 前缀`);
    }
  }
  const supersession = outcome.supersession;
  if (!supersession || typeof supersession !== 'object' || Array.isArray(supersession)) {
    failures.push(`${label}.supersession 必须是对象`);
  } else {
    failures.push(...unexpectedFields(supersession, SUPERSESSION_FIELDS, `${label}.supersession`));
    const expectedPreviousId = previousOutcome?.id ?? null;
    if (supersession.previousOutcomeId !== expectedPreviousId) {
      failures.push(`${label}.supersession.previousOutcomeId 必须指向同 lineage 直接前驱`);
    }
    if (!FEEDBACK_DISPOSITIONS.has(supersession.feedbackDisposition)
      || supersession.feedbackDisposition !== expectedDisposition(outcome, previousOutcome)) {
      failures.push(`${label}.supersession.feedbackDisposition 与 verdict 转换不一致`);
    }
    if (typeof supersession.summary !== 'string'
      || supersession.summary.trim().length === 0 || supersession.summary.length > 500) {
      failures.push(`${label}.supersession.summary 必须是 1 到 500 字符的脱敏摘要`);
    }
  }
  return failures;
};

export const buildEvolutionOutcomeChainReport = (entries) => {
  const failures = [];
  const legacyLines = [];
  const latestByLineage = new Map();
  const openFeedbackLineages = new Set();
  let previousV3Line = null;
  let headSequence = null;
  let chainedOutcomes = 0;
  let resolvedFeedback = 0;
  for (const entry of entries) {
    const outcome = entry.outcome;
    const previousOutcome = outcome ? latestByLineage.get(lineageKey(outcome)) : undefined;
    if (outcome?.schemaVersion === 3) {
      failures.push(...collectV3Failures({
        ...entry, legacyLines, previousV3Line, previousOutcome,
      }));
      previousV3Line = entry.line;
      headSequence = entry.ordinal;
      chainedOutcomes += 1;
      if (outcome.supersession?.feedbackDisposition === 'open') openFeedbackLineages.add(lineageKey(outcome));
      if (outcome.supersession?.feedbackDisposition === 'resolved') {
        openFeedbackLineages.delete(lineageKey(outcome));
        resolvedFeedback += 1;
      }
    } else {
      if (previousV3Line !== null) failures.push(`outcomes.jsonl: 第 ${entry.ordinal} 条记录不能在 v3 链激活后降级`);
      legacyLines.push(entry.line);
    }
    if (outcome) latestByLineage.set(lineageKey(outcome), outcome);
  }
  const status = failures.length > 0 ? 'fail'
    : entries.length === 0 ? 'empty' : chainedOutcomes === 0 ? 'legacy' : 'pass';
  return {
    failures,
    summary: {
      status,
      totalOutcomes: entries.length,
      legacyOutcomes: entries.length - chainedOutcomes,
      chainedOutcomes,
      headSequence,
      headSha256: previousV3Line === null ? null : hashEvolutionOutcomeV3Line(previousV3Line),
      openFeedback: openFeedbackLineages.size,
      resolvedFeedback,
    },
  };
};
