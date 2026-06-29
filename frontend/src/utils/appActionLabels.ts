export const getAutoSaveTitle = (
  hasActiveFile: boolean,
  hasFileHandle: boolean,
  isAutoSaveEnabled: boolean
): string => {
  if (!hasActiveFile) return '请先打开文件以启用自动保存';
  if (!hasFileHandle) return '请先保存当前标签以启用自动保存';
  return isAutoSaveEnabled ? '自动保存已开启' : '点击开启自动保存';
};

export const getAutoSaveAriaLabel = (
  canUseAutoSave: boolean,
  isAutoSaveActive: boolean,
  autoSaveTitle: string
): string => {
  if (!canUseAutoSave) return `自动保存不可用，${autoSaveTitle}`;
  return isAutoSaveActive ? '自动保存已开启，点击关闭' : '自动保存已关闭，点击开启';
};

export const getCopySourceTitle = (hasSourceContent: boolean): string => (
  hasSourceContent ? '复制 SOURCE 内容到剪贴板' : 'SOURCE 为空，暂无内容可复制'
);

export const getClearSourceTitle = (hasSourceContent: boolean): string => (
  hasSourceContent ? '清空 SOURCE 内容' : 'SOURCE 为空，暂无内容可清空'
);

export const getSourceAiRepairTitle = (isProcessing: boolean): string => (
  isProcessing ? '智能修复中，请等待当前任务完成' : '用智能修复当前 SOURCE JSON 错误'
);

export const getTransformReportTitle = (
  isOutputTransforming: boolean,
  hasTransformReportContext: boolean
): string => {
  if (isOutputTransforming) return '预览仍在处理，请稍后查看报告';
  if (!hasTransformReportContext) return '暂无深度解析报告可查看';
  return '查看深度解析报告';
};

export const getApplyPreviewTitle = (
  isOutputTransforming: boolean,
  hasPreviewContent: boolean,
  isPreviewSameAsSource: boolean
): string => {
  if (isOutputTransforming) return '预览仍在处理，请稍后应用';
  if (!hasPreviewContent) return '暂无 PREVIEW 内容可应用';
  if (isPreviewSameAsSource) return 'PREVIEW 与 SOURCE 内容一致，无需应用';
  return '用 PREVIEW 内容替换 SOURCE';
};

export const getCopyPreviewTitle = (
  isOutputTransforming: boolean,
  hasPreviewContent: boolean
): string => {
  if (isOutputTransforming) return '预览仍在处理，请稍后复制';
  if (!hasPreviewContent) return '暂无 PREVIEW 内容可复制';
  return '复制预览内容到剪贴板';
};
