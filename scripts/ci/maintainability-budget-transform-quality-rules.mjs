export const transformQualityMaintainabilityBudgets = [
  {
    file: 'frontend/src/utils/transformQualityRecommendations.ts',
    maxLines: 60,
    reason: '深度解析质量建议文案应保持纯计数映射小模块',
  },
  {
    file: 'frontend/src/utils/transformQualityBuckets.ts',
    maxLines: 80,
    reason: '深度解析质量快照 Bucket 聚合应保持纯函数和稳定排序',
  },
  {
    file: 'frontend/src/utils/transformQualityDelta.ts',
    maxLines: 80,
    reason: '深度解析质量快照对比格式化应保持纯文本小模块',
  },
  {
    file: 'frontend/src/utils/transformQualitySnapshot.ts',
    maxLines: 50,
    reason: '深度解析质量快照入口应只负责质量快照顶层编排，热点、指标和建议应拆到独立 helper',
  },
  {
    file: 'frontend/src/utils/transformQualitySnapshotHotspots.ts',
    maxLines: 70,
    reason: '深度解析质量快照热点组装应集中治理 Top schema、问题 bucket、占位符和参数分层热点',
  },
  {
    file: 'frontend/src/utils/transformQualitySnapshotMetrics.ts',
    maxLines: 60,
    reason: '深度解析质量快照计数映射应保持可单测纯函数',
  },
];
