import fs from 'node:fs';
import path from 'node:path';
import {
  AI_GOVERNANCE_CONTENT_SCANNABLE_EXEMPT_FILES,
  AI_GOVERNANCE_LOCAL_ONLY_EXEMPT_FILES,
} from './aiGovernanceDiscoverySources.mjs';
import {
  decodeHermeticGitNulRecords,
  decodeHermeticGitPathList,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';

export const AI_GOVERNANCE_EXEMPT_FORBIDDEN_MARKERS = [
  'AGENTS.md',
  'CLAUDE.md',
  'rules/code-style.md',
  'docs/AI-ENGINEERING-PLAYBOOK.md',
  'docs/AI-ASSET-REGISTRY.md',
  'docs/AI-GOVERNANCE-DECISIONS.md',
  '.agents/skills',
  'node scripts/ci/check-ai-governance.mjs',
  'node scripts/ci/check-maintainability-budgets.mjs',
  '规则/skill 回写',
  '治理校验',
];

const collectExemptContentFailures = rootDir => (
  AI_GOVERNANCE_CONTENT_SCANNABLE_EXEMPT_FILES.flatMap((file) => {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    return AI_GOVERNANCE_EXEMPT_FORBIDDEN_MARKERS
      .filter(marker => content.includes(marker))
      .map(marker => `${file}: 显式豁免文件包含共享 AI 治理内容 "${marker}"，请迁移到协作资产并让豁免文件只保留豁免声明`);
  })
);

const INDEX_INVENTORY_FAILURE = 'Git index 读取失败，无法证明本机私有显式豁免未被跟踪';
const HEAD_INVENTORY_FAILURE = 'Git HEAD 读取失败，无法证明本机私有显式豁免未被跟踪';

const hasUnbornHead = rootDir => decodeHermeticGitNulRecords(runHermeticGitInventory(rootDir, [
  'status', '--porcelain=v2', '--branch', '-z', '--untracked-files=no',
  '--', ...AI_GOVERNANCE_LOCAL_ONLY_EXEMPT_FILES,
])).includes('# branch.oid (initial)');

const readTrackedLocalOnlyFiles = (rootDir) => {
  let indexFiles;
  try {
    indexFiles = decodeHermeticGitPathList(runHermeticGitInventory(rootDir, [
      'ls-files', '-z', '--cached', '--', ...AI_GOVERNANCE_LOCAL_ONLY_EXEMPT_FILES,
    ]));
  } catch {
    return { failure: INDEX_INVENTORY_FAILURE, trackedFiles: new Set() };
  }
  let headFiles = [];
  try {
    if (!hasUnbornHead(rootDir)) {
      headFiles = decodeHermeticGitPathList(runHermeticGitInventory(rootDir, [
        'ls-tree', '-r', '-z', '--name-only', 'HEAD', '--', ...AI_GOVERNANCE_LOCAL_ONLY_EXEMPT_FILES,
      ]));
    }
  } catch {
    return { failure: HEAD_INVENTORY_FAILURE, trackedFiles: new Set(indexFiles) };
  }
  return { failure: null, trackedFiles: new Set([...indexFiles, ...headFiles]) };
};

const collectLocalOnlyTrackingFailures = (rootDir) => {
  const { failure, trackedFiles } = readTrackedLocalOnlyFiles(rootDir);
  if (failure) return [failure];
  return AI_GOVERNANCE_LOCAL_ONLY_EXEMPT_FILES
    .filter(file => trackedFiles.has(file))
    .map(file => `${file}: 本机私有显式豁免不得进入 Git index 或 HEAD；ignore 不能取消已跟踪状态`);
};

export const collectAiGovernanceExemptAssetContractFailures = rootDir => [
  ...collectExemptContentFailures(rootDir),
  ...collectLocalOnlyTrackingFailures(rootDir),
];
