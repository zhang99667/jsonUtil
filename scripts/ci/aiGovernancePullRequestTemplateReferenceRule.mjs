import { AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS, AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES, AI_GOVERNANCE_MCP_CONFIG_FILES } from './aiGovernanceDiscoveryEntries.mjs';

export const AI_GOVERNANCE_PULL_REQUEST_TEMPLATE_REFERENCE_RULE = {
  file: '.github/PULL_REQUEST_TEMPLATE.md',
  contains: ['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md',
    'CHANGELOG.md', 'node scripts/ci/check-ai-governance.mjs',
    'node scripts/ci/check-ai-asset-distribution.mjs --index', 'CI 用 `--head`',
    'node scripts/ci/check-maintainability-budgets.mjs', '可维护性预算',
    ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_FILES, ...AI_GOVERNANCE_CUSTOM_AI_ENTRY_DIRS, ...AI_GOVERNANCE_MCP_CONFIG_FILES,
    '.codex/config.toml', 'trusted project', '新任务实际注册', '用户级插件 selector',
    '显式豁免', '负向测试'],
};
