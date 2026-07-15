const validationCommands = Object.freeze({
  'ai-governance': 'node scripts/ci/check-ai-governance.mjs',
  'maintainability-budgets': 'node scripts/ci/check-maintainability-budgets.mjs --top 35 --no-all',
  'write-governance-artifacts': 'node scripts/ci/write-ai-governance-artifacts.mjs --json',
  'check-governance-artifacts': 'node scripts/ci/write-ai-governance-artifacts.mjs --check --json',
  'check-evolution-evals': 'node scripts/ci/check-ai-evolution-evals.mjs --json',
  'run-evolution-cases': 'node scripts/ci/run-ai-evolution-cases.mjs --all',
  'test-mcp': 'node --test --test-reporter=dot scripts/mcp/*.test.mjs',
  'test-ci': 'node --test --test-reporter=dot scripts/ci/*.test.mjs',
  'check-version-consistency': 'node scripts/ci/check-version-consistency.mjs',
  'check-deploy-shell-syntax': 'node scripts/ci/check-deploy-shell-syntax.mjs',
  'check-frontend-static-retention': 'node scripts/ci/check-frontend-static-retention.mjs',
  'compose-production-config': 'env POSTGRES_PASSWORD=ci-postgres-password SPRING_DATASOURCE_PASSWORD=ci-postgres-password JWT_SECRET=ci-jwt-secret-for-compose-validation docker compose -f docker-compose.yml config',
  'compose-local-config': 'docker compose -f docker-compose.local.yml config',
  'workspace-whitespace': 'node scripts/ci/check-ai-validation-whitespace.mjs',
});
const command = (id, reason) => {
  if (!validationCommands[id]) throw new Error(`未知 validation 命令: ${id}`);
  return { id, command: validationCommands[id], reason };
};
const manualCheck = (id, reason) => ({ id, reason });
const rule = (name, matcher, commands, { classifies = true, manualChecks = [] } = {}) => ({
  name, matcher, commands, classifies, manualChecks,
});
const hasPrefix = (file, prefixes) => prefixes.some(prefix => file.startsWith(prefix));
const hasSuffix = (file, suffixes) => suffixes.some(suffix => file.endsWith(suffix));
const isComposeFile = file => /^docker-compose[^/]*\.ya?ml$/.test(file);
const sampled = (items, limit = 20) => ({ items: items.slice(0, limit), count: items.length, truncated: items.length > limit });

const validationRules = [
  rule('ai-governance-assets', file => (
    hasPrefix(file, ['docs/AI-', '.agents/', 'plugins/', '.codex/', '.claude/', '.cursor/', '.comate/']) ||
    hasPrefix(file, ['evals/ai-governance/', 'scripts/mcp/', 'scripts/ci/aiGovernance']) ||
    ['README.md', 'CONTRIBUTING.md', 'AGENTS.md', 'CLAUDE.md', '.cursorrules', '.github/PULL_REQUEST_TEMPLATE.md', '.github/copilot-instructions.md', 'rules/code-style.md', '.mcp.json', 'scripts/ci/local-ci.sh', 'scripts/ci/manage-project-plugins.mjs', 'scripts/ci/check-project-plugin-installation.mjs', 'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs'].includes(file)
  ), [
    command('ai-governance', 'AI 协作资产、rules、skills、MCP 或治理脚本变更后必须跑聚合治理门禁'),
    command('maintainability-budgets', 'AI 治理 helper 和测试需要保持预算所有权'),
    command('write-governance-artifacts', '先按当前工作树刷新本地治理 artifact'),
    command('check-governance-artifacts', '读取或交接治理 artifact 前确认它们仍然新鲜'),
  ]),
  rule('evolution-evals', file => (
    hasPrefix(file, ['evals/ai-governance/', 'scripts/ci/aiGovernanceEvolution']) ||
    ['scripts/ci/check-ai-evolution-evals.mjs', 'scripts/ci/run-ai-evolution-cases.mjs', 'scripts/ci/record-ai-evolution-deterministic-outcomes.mjs', 'scripts/ci/record-ai-evolution-unverified-trace-outcome.mjs'].includes(file)
  ), [
    command('check-evolution-evals', '行为评测资产或 checker 变化后必须校验 corpus、receipt、outcome、chain 与即时重放'),
    command('run-evolution-cases', '执行固定白名单中的全部行为 case；component-only 结果仍不得冒充 Agent outcome'),
  ]),
  rule('mcp-runtime', file => hasPrefix(file, ['scripts/mcp/']) || file === '.mcp.json', [
    command('test-mcp', 'MCP 改动必须覆盖真实 stdio、工具清单、资源读取和固定工具调用'),
  ]),
  rule('ci-governance-tests', file => hasPrefix(file, ['scripts/ci/']) && hasSuffix(file, ['.mjs']), [
    command('test-ci', 'CI 治理脚本或预算规则改动后需要跑脚本单测'),
  ]),
  rule('release-notes', file => file === 'CHANGELOG.md' || file === 'frontend/package.json' || file === 'frontend/package-lock.json', [
    command('check-version-consistency', '版本、lockfile 和 CHANGELOG 顶部发布说明必须一致'),
  ]),
  rule('deploy-routing', file => (
    file === 'frontend/nginx.conf' || file === 'scripts/ci/local-ci.sh' || file === 'docs/CICD.md' ||
    isComposeFile(file) || hasPrefix(file, ['scripts/deploy/', '.github/workflows/'])
  ), [
    command('check-deploy-shell-syntax', '部署 shell 或 workflow run 块变更后先做语法门禁'),
    command('check-frontend-static-retention', '前端发布、Nginx 或静态资源保留链路变更后需要跑发布保留门禁'),
  ]),
  rule('compose-config', isComposeFile, [
    command('compose-production-config', '使用固定假值解析生产 Compose，避免依赖本机生产凭据'),
    command('compose-local-config', '同时解析本地 Compose，锁定两个部署入口的结构'),
  ]),
  rule('deploy-docs', file => file === 'docs/CICD.md', [], {
    manualChecks: [manualCheck('compose-doc-semantics', '人工核对 docs/CICD.md 与两个 Compose 文件、local-ci 和 CI workflow 的变量及命令语义一致')],
  }),
  rule('worktree-hygiene', () => true, [command('workspace-whitespace', '所有工作区变更都要检查 staged、worktree 与 untracked 空白错误')], { classifies: false }),
];

export const matchJsonutilsValidationRules = files => validationRules.map((item) => {
  const matches = sampled(files.filter(file => item.matcher(file.path)).map(file => file.path));
  return { ...item, files: matches.items, matchedFileCount: matches.count, truncated: matches.truncated };
}).filter(item => item.matchedFileCount > 0);

export const collectClassifiedValidationPaths = files => new Set(validationRules.filter(item => item.classifies).flatMap(item => (
  files.filter(file => item.matcher(file.path)).map(file => file.path)
)));

export const uniqueValidationCommands = rules => [...new Map(rules.flatMap(item => item.commands).map(item => [item.id, item])).values()];
export const uniqueValidationManualChecks = rules => [...new Map(rules.flatMap(item => item.manualChecks).map(item => [item.id, item])).values()];
