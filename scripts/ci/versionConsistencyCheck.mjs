import fs from 'node:fs';
import path from 'node:path';

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const normalizeVersion = (version) => {
  if (typeof version !== 'string') return null;
  const trimmed = version.trim();
  if (!trimmed) return null;
  return trimmed.startsWith('v') ? trimmed.slice(1).trim() || null : trimmed;
};

export const extractTopChangelogVersion = (markdown) => {
  const match = markdown.match(/^##\s+v?([^\s(]+)/m);
  return normalizeVersion(match?.[1]);
};

export const buildVersionConsistencyReport = (rootDir) => {
  const frontendPackage = readJsonFile(path.join(rootDir, 'frontend/package.json'));
  const frontendPackageLock = readJsonFile(path.join(rootDir, 'frontend/package-lock.json'));
  const changelogMarkdown = fs.readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf8');
  const expectedVersion = normalizeVersion(frontendPackage.version);

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

  return {
    expectedVersion,
    checks,
    failures: checks.filter(check => !check.actual || check.actual !== expectedVersion),
  };
};

export const formatVersionConsistencyFailures = (report) => (
  [
    `前端发布版本不一致，期望版本: ${report.expectedVersion || 'unknown'}`,
    ...report.failures.map(check => `- ${check.label}: ${check.actual || 'missing'}`),
  ].join('\n')
);
