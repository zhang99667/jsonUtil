import { describe, expect, it } from 'vitest';
import { buildQualitySnapshotRecommendations } from './transformQualityRecommendations';

const baseSource = {
  filteredWarningCount: 0,
  filteredUnresolvedCount: 0,
  filteredPlaceholderCount: 0,
  filteredSchemeParamStageRepairHintCount: 0,
  filteredNonReversibleParamStageCount: 0,
  filteredCmdStructureCount: 0,
};

describe('transformQualityRecommendations', () => {
  it('按风险计数生成质量快照建议', () => {
    expect(buildQualitySnapshotRecommendations({
      ...baseSource,
      filteredWarningCount: 1,
      filteredPlaceholderCount: 2,
      filteredCmdStructureCount: 1,
    })).toEqual([
      '先处理性能保护跳过记录，必要时单独粘贴字段到 Scheme 面板或缩小 response 后再解析',
      '运行时占位符按来源路径确认真实替换链路，避免误判为解析失败',
      '对关键 CMD 结构粘贴 cmdHandler 输出做页面内对比，优先补齐缺失路径和值差异',
    ]);
  });

  it('无风险时生成质量基线建议', () => {
    expect(buildQualitySnapshotRecommendations(baseSource)).toEqual([
      '当前筛选未发现待处理风险，可将该快照作为解析质量基线保存',
    ]);
  });
});
