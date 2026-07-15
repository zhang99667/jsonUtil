import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

const withoutGeneratedAt = (value) => {
  if (Array.isArray(value)) return value.map(withoutGeneratedAt);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'generatedAt')
      .map(([key, entry]) => [key, withoutGeneratedAt(entry)]),
  );
};

const normalizeJson = (value) => JSON.stringify(withoutGeneratedAt(value));
const normalizeSummary = (value) => value.split('\n').filter(line => !line.startsWith('- Generated: ')).join('\n');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const artifactComparators = [
  ['governance', readJson, normalizeJson],
  ['evolution', readJson, normalizeJson],
  ['maintainability', readJson, normalizeJson],
  ['context', readJson, normalizeJson],
  ['scorecard', readJson, normalizeJson],
  ['summary', file => fs.readFileSync(file, 'utf8'), normalizeSummary],
];

const attestationSubjectFiles = [
  ['ai-governance-report.json', 'governance'],
  ['ai-evolution-eval-report.json', 'evolution'],
  ['maintainability-budget-report.json', 'maintainability'],
  ['jsonutils-governance-context.json', 'context'],
  ['ai-governance-scorecard.json', 'scorecard'],
  ['summary.md', 'summary'],
];
const attestationSubjectLedgers = [
  'evals/ai-governance/outcomes.jsonl',
  'evals/ai-governance/trial-receipts.jsonl',
];
const sha256File = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const withoutSubjectRunData = value => JSON.stringify(Object.fromEntries(
  Object.entries(value).filter(([key]) => !['generatedAt', 'artifacts'].includes(key)),
));
const collectAttestationSubjectFailure = ({ rootDir, files, artifacts }) => {
  try {
    const actual = readJson(files.attestationSubject);
    const digests = attestationSubjectFiles.map(([name, id]) => ({ name, sha256: sha256File(files[id]) }));
    const ledgers = attestationSubjectLedgers.map(name => ({ name, sha256: sha256File(path.join(rootDir, name)) }));
    return withoutSubjectRunData(actual) === withoutSubjectRunData(artifacts.attestationSubject)
      && JSON.stringify(actual.artifacts) === JSON.stringify(digests)
      && JSON.stringify(actual.ledgers) === JSON.stringify(ledgers)
      ? [] : [{ id: 'attestationSubject', file: files.attestationSubject, reason: 'attestation subject 未精确绑定当前 artifact 字节' }];
  } catch (error) {
    return [{ id: 'attestationSubject', file: files.attestationSubject, reason: error.message }];
  }
};

export const collectAiGovernanceArtifactFreshnessFailures = ({ rootDir, files, artifacts }) => [...artifactComparators.flatMap(([id, read, normalize]) => {
  try {
    return normalize(read(files[id])) === normalize(artifacts[id])
      ? []
      : [{ id, file: files[id], reason: 'artifact 与当前治理结果不一致' }];
  } catch (error) {
    return [{ id, file: files[id], reason: error.message }];
  }
}), ...collectAttestationSubjectFailure({ rootDir, files, artifacts })];
