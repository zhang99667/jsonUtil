import fs from 'node:fs';
import path from 'node:path';

import { isEvolutionRecord, isEvolutionString } from './aiGovernanceEvolutionEvalContract.mjs';
import { AI_EVOLUTION_EXECUTABLE_CASES } from './aiGovernanceEvolutionCaseRunner.mjs';
import { aggregateEvolutionTrialResults } from './aiGovernanceEvolutionTrialReceipts.mjs';

const REVISION_PATTERN = /^(?:[0-9a-f]{40}|(?:worktree|commit|ci)-[0-9a-f]{40}|worktree-[0-9a-f]{64})$/;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const EVIDENCE_FIELDS = new Set(['receiptId', 'sha256']);

export const compareEvolutionVersions = (left, right) => {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
};

export const isEvolutionV2Revision = value => REVISION_PATTERN.test(value ?? '');

export const isSafeExistingEvolutionFile = (rootDir, file) => {
  if (!isEvolutionString(file) || path.isAbsolute(file) || file.includes('\\')) return false;
  const normalized = path.posix.normalize(file);
  if (normalized !== file || normalized === '..' || normalized.startsWith('../')) return false;
  try {
    const realRoot = fs.realpathSync(rootDir);
    const candidate = path.join(realRoot, file);
    if (fs.lstatSync(candidate).isSymbolicLink()) return false;
    const realCandidate = fs.realpathSync(candidate);
    const relative = path.relative(realRoot, realCandidate);
    return relative !== '' && !relative.startsWith(`..${path.sep}`)
      && relative !== '..' && !path.isAbsolute(relative) && fs.statSync(realCandidate).isFile();
  } catch {
    return false;
  }
};

export const collectEvolutionEvidenceEligibilityFailures = (outcome, label, receiptsById = new Map()) => {
  if (outcome.schemaVersion === 1) return [];
  const descriptor = AI_EVOLUTION_EXECUTABLE_CASES[outcome.caseId];
  const receipt = receiptsById.get(outcome.evidence?.receiptId)?.receipt;
  const isTraceBound = [2, 3].includes(receipt?.schemaVersion);
  const failures = [];
  if (receipt && outcome.verdict === 'pass' && outcome.provenance?.method !== 'deterministic' && !isTraceBound) {
    failures.push(`${label} model/human/hybrid pass 在真实 trace verifier 建成前不可评分`);
  }
  if (receipt && outcome.verdict === 'pass' && outcome.provenance?.method === 'deterministic' && !isTraceBound
    && descriptor?.evidenceScope !== 'deterministic-case') {
    failures.push(`${label} deterministic pass 只能用于 deterministic-case`);
  }
  return failures;
};

export const collectEvolutionReceiptBindingFailures = (outcome, label, receiptsById) => {
  if (outcome.schemaVersion === 1) {
    return outcome.evidence === undefined ? [] : [`${label}.evidence 只允许 schemaVersion 2/3 使用`];
  }
  if (!isEvolutionRecord(outcome.evidence)) return [`${label}.evidence 必须引用可评分 outcome receipt`];
  const failures = Object.keys(outcome.evidence)
    .filter(field => !EVIDENCE_FIELDS.has(field))
    .map(field => `${label}.evidence.${field} 不在允许字段中`);
  if (!isEvolutionString(outcome.evidence.receiptId)) failures.push(`${label}.evidence.receiptId 不能为空`);
  if (!SHA256_PATTERN.test(outcome.evidence.sha256 ?? '')) failures.push(`${label}.evidence.sha256 必须是 64 位小写 SHA-256`);
  const entry = receiptsById.get(outcome.evidence.receiptId);
  if (!entry) {
    failures.push(`${label}.evidence.receiptId 未指向有效 receipt`);
    return failures;
  }
  const receipt = entry.receipt;
  const aggregate = aggregateEvolutionTrialResults(receipt.trialResults);
  const expected = {
    caseId: outcome.caseId,
    corpusVersion: outcome.corpusVersion,
    caseVersion: outcome.caseVersion,
    subjectVersion: outcome.subjectVersion,
    evaluatedAt: outcome.evaluatedAt,
    method: outcome.provenance?.method,
    source: outcome.provenance?.source,
    runner: outcome.provenance?.runner,
    revision: outcome.provenance?.revision,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (receipt[field] !== value) failures.push(`${label}.evidence 与 receipt.${field} 不一致`);
  }
  if (receipt.trialResults.length !== outcome.provenance?.trials) failures.push(`${label}.provenance.trials 与 receipt 不一致`);
  if (aggregate.verdict !== outcome.verdict || aggregate.score !== outcome.score) failures.push(`${label} verdict/score 与 receipt 聚合结果不一致`);
  if (entry.sha256 !== outcome.evidence.sha256) failures.push(`${label}.evidence.sha256 与 receipt 精确 JSON 行不一致`);
  if (JSON.stringify(receipt.validations) !== JSON.stringify(outcome.writeback?.validationResults)) {
    failures.push(`${label}.writeback.validationResults 必须与 receipt 完全一致`);
  }
  return failures;
};
