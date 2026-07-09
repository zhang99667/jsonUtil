import fs from 'node:fs';
import path from 'node:path';

const readJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

export const TOP_CHANGELOG_ITEM_LIMIT = 8;

const CHANGELOG_CATEGORY_PATTERN = /^### (✨ 新特性|🐛 Bug 修复|🎨 UI\/UE 优化|🏗️ 架构与基础设施|🚀 优化与改进|🎉 重大更新)$/;
const CHANGELOG_ITEM_PATTERN = /^- \*\*[^*]+\*\*: .+/;

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

const collectTopChangelogStructureFailures = (markdown) => {
  const lines = markdown.split(/\r?\n/).slice(1).filter(line => line.trim());
  const hasCategory = lines.some(line => CHANGELOG_CATEGORY_PATTERN.test(line));
  return [
    ...(!hasCategory ? [{
      label: 'CHANGELOG.md 顶部版本分类',
      actual: 'missing',
      expected: '至少一个认可的 ### 分类标题',
    }] : []),
    ...lines
      .filter(line => line.startsWith('- ') && !CHANGELOG_ITEM_PATTERN.test(line))
      .map(line => ({
        label: 'CHANGELOG.md 顶部版本条目格式',
        actual: line,
        expected: '- **标题**: 描述',
      })),
    ...lines
      .filter(line => line.startsWith('### ') && !CHANGELOG_CATEGORY_PATTERN.test(line))
      .map(line => ({
        label: 'CHANGELOG.md 顶部版本分类',
        actual: line,
        expected: '使用规范分类标题',
      })),
  ];
};

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
  const changelogPolicyFailures = topChangelogSection ? [
    ...(topChangelogItemCount === 0 ? [{
      label: 'CHANGELOG.md 顶部版本条目数',
      actual: '0 条',
      expected: '至少 1 条',
    }] : []),
    ...(topChangelogItemCount > TOP_CHANGELOG_ITEM_LIMIT ? [{
      label: 'CHANGELOG.md 顶部版本条目数',
      actual: `${topChangelogItemCount} 条`,
      expected: `不超过 ${TOP_CHANGELOG_ITEM_LIMIT} 条；请新开 patch 版本`,
    }] : []),
  ] : [];
  const changelogStructureFailures = topChangelogSection
    ? collectTopChangelogStructureFailures(topChangelogSection)
    : [];

  return {
    expectedVersion,
    checks,
    topChangelogItemCount,
    topChangelogItemLimit: TOP_CHANGELOG_ITEM_LIMIT,
    failures: [
      ...versionFailures,
      ...changelogPolicyFailures,
      ...changelogStructureFailures,
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
