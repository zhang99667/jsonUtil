import fs from 'node:fs';
import path from 'node:path';
import { AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES } from './aiGovernanceDiscoveredAssets.mjs';

export const AI_GOVERNANCE_EXEMPT_FORBIDDEN_MARKERS = [
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-ASSET-REGISTRY.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  '.codex/skills',
  'node scripts/ci/check-ai-governance.mjs',
  'node scripts/ci/check-maintainability-budgets.mjs',
  '规则/skill 回写',
  '治理校验',
];

export const collectAiGovernanceExemptAssetContractFailures = rootDir => (
  AI_GOVERNANCE_DISCOVERY_EXEMPT_FILES.flatMap((file) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    return AI_GOVERNANCE_EXEMPT_FORBIDDEN_MARKERS
      .filter(marker => content.includes(marker))
      .map(marker => `${file}: 显式豁免文件包含共享 AI 治理内容 "${marker}"，请迁移到协作资产或改成普通本机配置`);
  })
);
