import {
  decodeHermeticGitPathList,
  runHermeticGitInventory,
} from './aiGovernanceHermeticGitInventory.mjs';
import {
  matchesCurrentAssetEvidence,
  parseHeadAssetEntries,
  parseIndexAssetEntries,
  readCurrentAssetEvidence,
} from './aiGovernanceAssetDistributionGitEvidence.mjs';

const INDEX_FORMAT = '--format=%(objectmode) %(objectname) %(stage) %(path)';
const HEAD_FORMAT = '--format=%(objectmode) %(objecttype) %(objectname) %(path)';

const readAvailableAssets = (rootDir, scope, readInventory) => {
  if (scope === 'workspace') {
    return new Set(decodeHermeticGitPathList(readInventory(
      rootDir,
      ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    )));
  }
  if (scope === 'index') {
    return parseIndexAssetEntries(readInventory(rootDir, ['ls-files', '-z', '--cached', INDEX_FORMAT]));
  }
  if (scope === 'head') {
    return parseHeadAssetEntries(readInventory(rootDir, ['ls-tree', '-r', '-z', HEAD_FORMAT, 'HEAD']));
  }
  throw new Error('AI asset distribution scope 非法');
};

export const collectUntrackedAiGovernanceAssetFailures = (
  rootDir,
  assetFiles,
  scope = 'index',
  readInventory = runHermeticGitInventory,
  readEvidence = readCurrentAssetEvidence,
) => {
  let availableAssets;
  try {
    availableAssets = readAvailableAssets(rootDir, scope, readInventory);
  } catch {
    const scopeLabel = scope === 'head' ? 'HEAD' : scope === 'workspace' ? '工作树' : '索引';
    return [`Git ${scopeLabel}读取失败，无法证明 AI 协作资产可分发`];
  }
  const message = scope === 'head'
    ? '当前工作树版本尚未进入 HEAD，其他维护者从当前提交克隆无法获得'
    : scope === 'workspace'
      ? '当前工作树中不存在，或未进入 Git 可提交候选清单（可能被 ignore 或位于项目分发边界外）'
      : '当前工作树版本尚未完整进入 Git 索引，其他维护者无法从下一次提交获得';
  return [...new Set(assetFiles)].sort()
    .filter((file) => {
      try {
        const evidence = readEvidence(rootDir, file);
        if (scope === 'workspace') return !availableAssets.has(file);
        return !matchesCurrentAssetEvidence(availableAssets.get(file), evidence);
      } catch { return true; }
    })
    .map(file => `${file}: AI 协作资产${message}`);
};
