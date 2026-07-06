export const getAppTemplateFillSuccessMessage = (
  shouldLoadSummary: boolean,
  qualityDelta: string
): string => {
  if (!shouldLoadSummary) return '模板已应用';
  return qualityDelta ? '占位符已回填，质量对比已更新' : '占位符已回填，质量对比暂不可用';
};
