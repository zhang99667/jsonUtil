export const AI_GOVERNANCE_PULL_REQUEST_TEMPLATE_REFERENCE_RULE = {
  file: '.github/PULL_REQUEST_TEMPLATE.md',
  contains: [
    'docs/AI-ASSET-REGISTRY.md',
    'node scripts/ci/check-ai-governance.mjs',
    '显式豁免',
    '负向测试',
  ],
};
