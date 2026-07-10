import { buildJsonutilsWorktreeSnapshot } from './jsonutils-governance-worktree.mjs';

const command = (value, reason) => ({ command: value, reason }), rule = (name, matcher, commands) => ({ name, matcher, commands });
const hasPrefix = (file, prefixes) => prefixes.some(prefix => file.startsWith(prefix)), hasSuffix = (file, suffixes) => suffixes.some(suffix => file.endsWith(suffix));

const validationRules = [
  rule('ai-governance-assets', file => (
    hasPrefix(file, ['docs/AI-', '.codex/', '.claude/', '.cursor/', '.comate/']) ||
    hasPrefix(file, ['scripts/mcp/', 'scripts/ci/aiGovernance']) ||
    file === 'rules/code-style.md' || file === '.mcp.json'
  ), [
    command('node scripts/ci/check-ai-governance.mjs', 'AI 协作资产、rules、skills、MCP 或治理脚本变更后必须跑聚合治理门禁'),
    command('node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all', 'AI 治理 helper 和测试需要保持预算所有权'),
    command('node scripts/ci/write-ai-governance-artifacts.mjs --check --json', '读取或交接治理 artifact 前确认它们仍然新鲜'),
  ]),
  rule('mcp-runtime', file => hasPrefix(file, ['scripts/mcp/']) || file === '.mcp.json', [
    command('node --test --test-reporter=dot scripts/mcp/*.test.mjs', 'MCP 改动必须覆盖真实 stdio、工具清单、资源读取和固定工具调用'),
  ]),
  rule('ci-governance-tests', file => hasPrefix(file, ['scripts/ci/']) && hasSuffix(file, ['.mjs']), [
    command('node --test --test-reporter=dot scripts/ci/*.test.mjs', 'CI 治理脚本或预算规则改动后需要跑脚本单测'),
  ]),
  rule('release-notes', file => file === 'CHANGELOG.md' || file === 'frontend/package.json' || file === 'frontend/package-lock.json', [
    command('node scripts/ci/check-version-consistency.mjs', '版本、lockfile 和 CHANGELOG 顶部发布说明必须一致'),
  ]),
  rule('deploy-routing', file => (
    file === 'frontend/nginx.conf' || hasPrefix(file, ['scripts/deploy/', '.github/workflows/'])
  ), [
    command('node scripts/ci/check-deploy-shell-syntax.mjs', '部署 shell 或 workflow run 块变更后先做语法门禁'),
    command('node scripts/ci/check-frontend-static-retention.mjs', '前端发布、Nginx 或静态资源保留链路变更后需要跑发布保留门禁'),
  ]),
];

const uniqueCommands = rules => [...new Map(rules.flatMap(item => item.commands).map(item => [item.command, item])).values()];
const sampled = (items, limit = 20) => ({ items: items.slice(0, limit), count: items.length, truncated: items.length > limit });
const matchedValidationRules = files => validationRules.map((item) => {
  const matches = sampled(files.filter(file => item.matcher(file.path)).map(file => file.path));
  return { ...item, files: matches.items, matchedFileCount: matches.count, truncated: matches.truncated };
}).filter(item => item.matchedFileCount > 0);

export const buildJsonutilsValidationPlanFromWorktree = (worktree) => {
  const validationFiles = worktree.allFiles ?? worktree.files ?? [];
  const matchedRules = worktree.ok ? matchedValidationRules(validationFiles) : [];
  const matchedFiles = new Set(validationRules.flatMap(rule => validationFiles.filter(file => rule.matcher(file.path)).map(file => file.path)));
  const unclassified = sampled(validationFiles.map(file => file.path).filter(file => !matchedFiles.has(file)));
  const changedFileCount = worktree.changedFileCount ?? 0, truncated = Boolean(worktree.truncated), coverageScope = worktree.allFiles ? 'all' : (truncated ? 'sample' : 'all');
  return {
    schemaVersion: 1,
    reportType: 'jsonutils-validation-plan',
    ok: worktree.ok,
    changedFileCount,
    truncated,
    coverage: { sampledFileCount: worktree.files?.length ?? 0, totalChangedFileCount: changedFileCount, truncated, commandMatchScope: coverageScope, unclassifiedFilesScope: coverageScope },
    commands: uniqueCommands(matchedRules),
    matchedRules: matchedRules.map(({ name, files, matchedFileCount, truncated }) => ({ name, files, matchedFileCount, truncated })),
    unclassifiedFiles: worktree.ok ? unclassified.items : [],
    ...(worktree.ok ? { unclassifiedFileCount: unclassified.count, unclassifiedFilesTruncated: unclassified.truncated } : {}),
    ...(worktree.ok ? {} : { error: worktree.error }),
  };
};

export const buildJsonutilsValidationPlan = async ({ maxFiles = 50, runStatus } = {}) => (
  buildJsonutilsValidationPlanFromWorktree(await buildJsonutilsWorktreeSnapshot({ maxFiles, includeAllFiles: true, runStatus }))
);
