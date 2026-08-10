import {
  hashEvolutionOutcomeLegacyPrefix,
  hashEvolutionOutcomeV3Line,
} from './aiGovernanceEvolutionOutcomeChain.mjs';
import { hashEvolutionTrialReceiptLine } from './aiGovernanceEvolutionTrialReceipts.mjs';

export const AI_EVOLUTION_DETERMINISTIC_RUNNER = 'ai-evolution-case-runner';

const appendJsonLines = (base, lines) => {
  if (!Buffer.isBuffer(base)) throw new Error('ledger base 必须为 Buffer');
  if (lines.length === 0) return Buffer.alloc(0);
  const separator = base.length > 0 && base.at(-1) !== 0x0a ? '\n' : '';
  return Buffer.from(`${separator}${lines.join('\n')}\n`, 'utf8');
};

const lineageKey = value => JSON.stringify([
  value.caseId,
  value.caseVersion,
  value.subjectVersion,
]);

export const findLatestEvolutionDeterministicLineageOutcome = (outcomes, value) => {
  const latest = new Map();
  outcomes.forEach(outcome => latest.set(lineageKey(outcome), outcome));
  return latest.get(lineageKey(value));
};

export const isEvolutionDeterministicPassReusable = ({
  previous,
  revision,
  receiptsById,
}) => (
  previous?.schemaVersion === 3
  && previous.verdict === 'pass'
  && previous.provenance?.method === 'deterministic'
  && previous.provenance?.runner === AI_EVOLUTION_DETERMINISTIC_RUNNER
  && previous.provenance?.revision === revision
  && receiptsById.has(previous.evidence?.receiptId)
);

const boundedEvidence = (parts, fallback) => {
  const value = parts.filter(Boolean).join('；').trim() || fallback;
  return value.slice(0, 1000);
};

export const buildEvolutionDeterministicOutcomeCandidates = ({
  selected,
  resultsById,
  revision,
  evaluatedAt,
  corpusVersion,
  receiptsBefore,
  outcomesBefore,
  state,
}) => {
  const existingLines = outcomesBefore.bytes.toString('utf8')
    .split(/\r?\n/).filter(line => line.trim());
  const previousByLineage = new Map();
  state.outcomeResult.validOutcomes.forEach((outcome) => {
    previousByLineage.set(lineageKey(outcome), outcome);
  });
  const usedOutcomeIds = new Set(state.outcomeResult.outcomes.map(item => item.id));
  const usedReceiptIds = new Set(state.receiptResult.receipts.map(item => item.id));
  let previousV3Line = existingLines.length > 0
    && state.outcomeResult.outcomes.at(-1)?.schemaVersion === 3
    ? existingLines.at(-1) : null;
  const legacyLines = previousV3Line === null ? existingLines : [];
  const receiptLines = [];
  const outcomeLines = [];
  const cases = [];

  selected.forEach(({ caseId, descriptor }, index) => {
    const result = resultsById.get(caseId);
    const sequence = state.outcomeResult.outcomes.length + index + 1;
    const suffix = `${evaluatedAt}-s${sequence}`;
    const receiptId = `receipt-${caseId}-deterministic-v${descriptor.caseVersion}-${suffix}`;
    const outcomeId = `${caseId}-deterministic-v${descriptor.caseVersion}-${suffix}`;
    if (usedReceiptIds.has(receiptId) || usedOutcomeIds.has(outcomeId)) {
      throw new Error(`deterministic writer id 冲突: ${caseId}`);
    }
    const validations = result.validations.map(item => ({
      command: item.command,
      status: 'passed',
      evidence: '固定 runner 退出码为 0，当前版本命令白名单验证通过',
      checkedAt: evaluatedAt,
    }));
    const receipt = {
      schemaVersion: 1,
      id: receiptId,
      artifactType: 'ai-evolution-trial-receipt',
      dataClass: 'redacted',
      caseId,
      corpusVersion,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evaluatedAt,
      method: 'deterministic',
      source: 'local',
      runner: AI_EVOLUTION_DETERMINISTIC_RUNNER,
      revision,
      aggregation: 'all-pass',
      trialResults: [{
        trial: 1,
        verdict: 'pass',
        score: 100,
        gradeTarget: 'outcome',
        evidence: boundedEvidence(
          result.evidence ?? descriptor.evidence,
          '固定 deterministic case 实际执行通过',
        ),
      }],
      validations,
    };
    const receiptLine = JSON.stringify(receipt);
    const previous = previousByLineage.get(lineageKey(receipt));
    const outcome = {
      schemaVersion: 3,
      id: outcomeId,
      caseId,
      corpusVersion,
      caseVersion: descriptor.caseVersion,
      subjectVersion: descriptor.subjectVersion,
      evaluatedAt,
      verdict: 'pass',
      score: 100,
      provenance: {
        method: 'deterministic',
        source: 'local',
        runner: AI_EVOLUTION_DETERMINISTIC_RUNNER,
        revision,
        trials: 1,
      },
      evidence: {
        receiptId,
        sha256: hashEvolutionTrialReceiptLine(receiptLine),
      },
      writeback: { files: [], validationResults: validations },
      chain: {
        sequence,
        previousHash: previousV3Line === null
          ? hashEvolutionOutcomeLegacyPrefix(legacyLines)
          : hashEvolutionOutcomeV3Line(previousV3Line),
      },
      supersession: {
        previousOutcomeId: previous?.id ?? null,
        feedbackDisposition: previous && ['fail', 'partial'].includes(previous.verdict)
          ? 'resolved' : 'none',
        summary: previous
          ? '当前 source-state v2 重放通过，显式接续同 lineage 直接前序'
          : '当前 source-state v2 首次重放通过，保留既有账本历史',
      },
    };
    const outcomeLine = JSON.stringify(outcome);
    receiptLines.push(receiptLine);
    outcomeLines.push(outcomeLine);
    previousV3Line = outcomeLine;
    previousByLineage.set(lineageKey(outcome), outcome);
    usedReceiptIds.add(receiptId);
    usedOutcomeIds.add(outcomeId);
    cases.push({ caseId, status: 'candidate', receiptId, outcomeId, sequence });
  });

  return {
    receiptLines,
    outcomeLines,
    cases,
    receiptSuffix: appendJsonLines(receiptsBefore.bytes, receiptLines),
    outcomeSuffix: appendJsonLines(outcomesBefore.bytes, outcomeLines),
  };
};
