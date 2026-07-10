import fs from 'node:fs';

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
  ['maintainability', readJson, normalizeJson],
  ['context', readJson, normalizeJson],
  ['scorecard', readJson, normalizeJson],
  ['summary', file => fs.readFileSync(file, 'utf8'), normalizeSummary],
];

export const collectAiGovernanceArtifactFreshnessFailures = ({ files, artifacts }) => artifactComparators.flatMap(([id, read, normalize]) => {
  try {
    return normalize(read(files[id])) === normalize(artifacts[id])
      ? []
      : [{ id, file: files[id], reason: 'artifact 与当前治理结果不一致' }];
  } catch (error) {
    return [{ id, file: files[id], reason: error.message }];
  }
});
