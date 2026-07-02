export const governanceInfraAssetsMaintainabilityBudgets = [
  { file: 'scripts/ci/maintainability-budget-infra-static-retention-rules.mjs', maxLines: 25, reason: '静态资源保留预算规则应只维护 CLI、配置检查和发布场景条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-rules.mjs', maxLines: 30, reason: '公网静态资源巡检预算规则应独立维护，避免基础设施预算表再次贴近上限' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-core-rules.mjs', maxLines: 25, reason: '公网静态资源巡检核心预算规则应只维护 CLI、audit 和路径解析条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-path-rules.mjs', maxLines: 25, reason: '公网静态资源路径预算规则应只维护 HTML、JS 和路径归一化 helper 条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-javascript-path-rules.mjs', maxLines: 20, reason: '公网静态资源 JS 路径预算规则应只维护 JS 候选提取和解析 helper 条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-cli-rules.mjs', maxLines: 20, reason: '公网静态资源巡检 CLI 预算规则应只维护输出和参数解析条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-cli-argument-rules.mjs', maxLines: 20, reason: '公网静态资源巡检 CLI 参数预算规则应只维护参数和 flag helper 条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-io-rules.mjs', maxLines: 25, reason: '公网资源 IO 预算规则应只维护额外旧资源、请求和 MIME 条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-queue-rules.mjs', maxLines: 15, reason: '公网资源发现队列预算规则应只维护入队 helper 条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-scanner-rules.mjs', maxLines: 20, reason: '公网资源扫描预算规则应只维护 CSS 和递归扫描 helper 条目' },
  { file: 'scripts/ci/maintainability-budget-infra-production-assets-support-rules.mjs', maxLines: 20, reason: '公网静态资源巡检支撑预算规则应只聚合 CLI、IO、队列和扫描子表' },
  { file: 'scripts/ci/maintainability-budget-governance-infra-assets-rules.mjs', maxLines: 20, reason: '基础设施资源治理预算规则应只维护静态保留和公网资源巡检子表自身预算' },
];
