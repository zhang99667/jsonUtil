import fs from 'node:fs';
import path from 'node:path';

const readJson = (rootDir, file) => JSON.parse(fs.readFileSync(path.join(rootDir, file), 'utf8'));
const readText = (rootDir, file) => fs.readFileSync(path.join(rootDir, file), 'utf8');
const firstMatchingLine = (text, pattern) => text.split('\n').find(line => pattern.test(line)) || '';
const extractTopChangelogTitle = text => firstMatchingLine(text, /^## v/).replace(/^##\s+/, '').trim();

const extractLatestDecision = (text) => {
  const row = firstMatchingLine(text, /^\|\s*\d{4}-\d{2}-\d{2}\s*\|/);
  const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
  return cells.length >= 2 ? { date: cells[0], decision: cells[1] } : null;
};

export const buildJsonutilsGovernanceProjectSummary = rootDir => ({
  ...readJson(rootDir, 'frontend/package.json'),
  changelog: extractTopChangelogTitle(readText(rootDir, 'CHANGELOG.md')),
  latestDecision: extractLatestDecision(readText(rootDir, 'docs/AI-GOVERNANCE-DECISIONS.md')),
});
