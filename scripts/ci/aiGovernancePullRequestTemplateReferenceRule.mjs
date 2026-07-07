export const AI_GOVERNANCE_PULL_REQUEST_TEMPLATE_REFERENCE_RULE = {
  file: '.github/PULL_REQUEST_TEMPLATE.md',
  contains: ['docs/AI-ASSET-REGISTRY.md', 'docs/AI-GOVERNANCE-DECISIONS.md',
    'CHANGELOG.md', 'node scripts/ci/check-ai-governance.mjs', '.github/prompts',
    '.github/agents', '.github/chatmodes', '显式豁免', '负向测试'],
};
