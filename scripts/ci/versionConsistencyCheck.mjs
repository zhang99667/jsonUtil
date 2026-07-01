import fs from 'node:fs';
import path from 'node:path';

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

export const TOP_CHANGELOG_ITEM_LIMIT = 8;

const normalizeVersion = (version) => {
  if (typeof version !== 'string') return null;
  const trimmed = version.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('v') ? trimmed.slice(1).trim() || null : trimmed;
};

export const extractTopChangelogSection = (markdown) => {
  const lines = markdown.split(/\r?\n/);
  const startIndex = lines.findIndex(line => line.startsWith('## '));
  if (startIndex === -1) return '';

  const remainingLines = lines.slice(startIndex + 1);
  const nextEntryOffset = remainingLines.findIndex(line => line.startsWith('## '));
  const endIndex = nextEntryOffset === -1
    ? lines.length
    : startIndex + 1 + nextEntryOffset;

  return lines.slice(startIndex, endIndex).join('\n');
};

export const extractTopChangelogVersion = (markdown) => {
  const match = markdown.match(/^##\s+v?([^\s(]+)/m);
  return normalizeVersion(match?.[1]);
};

export const countChangelogListItems = (markdown) => (
  markdown.split(/\r?\n/).filter(line => /^\s*-\s+/.test(line)).length
);

export const buildVersionConsistencyReport = (rootDir) => {
  const frontendPackage = readJsonFile(path.join(rootDir, 'frontend/package.json'));
  const frontendPackageLock = readJsonFile(path.join(rootDir, 'frontend/package-lock.json'));
  const changelogMarkdown = fs.readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf8');
  const expectedVersion = normalizeVersion(frontendPackage.version);
  const topChangelogSection = extractTopChangelogSection(changelogMarkdown);
  const topChangelogItemCount = countChangelogListItems(topChangelogSection);

  const checks = [
    {
      label: 'frontend/package.json',
      actual: expectedVersion,
    },
    {
      label: 'frontend/package-lock.json',
      actual: normalizeVersion(frontendPackageLock.version),
    },
    {
      label: 'frontend/package-lock.json packages[""]',
      actual: normalizeVersion(frontendPackageLock.packages?.['']?.version),
    },
    {
      label: 'CHANGELOG.md 顶部版本',
      actual: extractTopChangelogVersion(changelogMarkdown),
    },
  ];
  const versionFailures = checks.filter(check => !check.actual || check.actual !== expectedVersion);
  const changelogPolicyFailures = topChangelogItemCount > TOP_CHANGELOG_ITEM_LIMIT
    ? [{
      label: 'CHANGELOG.md 顶部版本条目数',
      actual: `${topChangelogItemCount} 条`,
      expected: `不超过 ${TOP_CHANGELOG_ITEM_LIMIT} 条；请新开 patch 版本`,
    }]
    : [];

  return {
    expectedVersion,
    checks,
    topChangelogItemCount,
    topChangelogItemLimit: TOP_CHANGELOG_ITEM_LIMIT,
    failures: [
      ...versionFailures,
      ...changelogPolicyFailures,
    ],
  };
};

export const formatVersionConsistencyFailures = (report) => (
  [
    `前端发布版本检查失败，期望版本: ${report.expectedVersion || 'unknown'}`,
    ...report.failures.map((check) => {
      const actual = check.actual || 'missing';
      return check.expected
        ? `- ${check.label}: ${actual}，期望 ${check.expected}`
        : `- ${check.label}: ${actual}`;
    }),
  ].join('\n')
);
