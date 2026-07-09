const prefix = file => `AI 资产登记 \`${file}\``;

const ALLOWED_ASSET_STATUSES = new Set([
  '协作资产', '权威流程', '决策账本', '工具薄入口',
  '可迁移技能', '治理门禁', '显式豁免',
]);

const ALLOWED_ASSET_OWNERS = new Set(['项目维护者', 'AI 助手协同', '本机用户']);
const ALLOWED_REVIEW_CADENCES = new Set(['变更时复核', '发布前复核', '季度复核']);

export const collectRegistryClassificationFailures = (file, row) => {
  if (!row.status) return [`${prefix(file)} 缺少状态`];
  if (!ALLOWED_ASSET_STATUSES.has(row.status)) return [`${prefix(file)} 状态未纳入约定分类 \`${row.status}\``];
  if (!row.owner) return [`${prefix(file)} 缺少责任人`];
  if (!ALLOWED_ASSET_OWNERS.has(row.owner)) return [`${prefix(file)} 责任人未纳入约定分类 \`${row.owner}\``];
  if (!row.reviewCadence) return [`${prefix(file)} 缺少复核节奏`];
  if (!ALLOWED_REVIEW_CADENCES.has(row.reviewCadence)) return [`${prefix(file)} 复核节奏未纳入约定分类 \`${row.reviewCadence}\``];
  return [];
};
