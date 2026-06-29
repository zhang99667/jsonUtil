export const infraMaintainabilityBudgets = [
  {
    file: 'frontend/config/chunkStrategy.ts',
    maxLines: 180,
    reason: '分包策略应保持可读，新增依赖分组过多时需要再拆表',
  },
  {
    file: 'frontend/config/versionManifest.ts',
    maxLines: 140,
    reason: '版本 manifest 构建逻辑应保持轻量',
  },
];
