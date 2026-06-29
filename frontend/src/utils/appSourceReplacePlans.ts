import { buildSourceReplacePlan, type AppSourceReplacePlan } from './appSourceReplacePlanCore';

export type { AppSourceReplacePlan } from './appSourceReplacePlanCore';

const isEmptyText = (value: string): boolean => !value;
const isBlankText = (value: string): boolean => !value.trim();

export const buildPasteSourcePlan = (
  sourceText: string,
  clipboardText: string
): AppSourceReplacePlan => {
  return buildSourceReplacePlan({
    sourceText,
    replacementText: clipboardText,
    isReplacementEmpty: isEmptyText,
    emptyMessage: '剪贴板为空，暂无可粘贴内容',
    sameMessage: '剪贴板内容已在 SOURCE 中',
    applyMessage: '已从剪贴板粘贴到 SOURCE',
  });
};

export const buildApplyPreviewToSourcePlan = (
  sourceText: string,
  previewText: string,
  isOutputTransforming: boolean
): AppSourceReplacePlan => {
  if (isOutputTransforming) {
    return {
      action: 'skip',
      feedback: 'error',
      message: '预览仍在处理，请稍后应用',
    };
  }

  return buildSourceReplacePlan({
    sourceText,
    replacementText: previewText,
    isReplacementEmpty: isBlankText,
    emptyMessage: '预览内容为空，暂无可应用内容',
    sameMessage: 'PREVIEW 内容已在 SOURCE 中',
    applyMessage: '已将 PREVIEW 应用到 SOURCE',
  });
};

export const buildApplySchemaExampleToSourcePlan = (
  sourceText: string,
  schemaExampleText: string
): AppSourceReplacePlan => {
  return buildSourceReplacePlan({
    sourceText,
    replacementText: schemaExampleText,
    isReplacementEmpty: isBlankText,
    emptyMessage: 'Schema 示例为空，暂无可应用内容',
    sameMessage: 'Schema 示例已在 SOURCE 中',
    applyMessage: '已将 Schema 示例应用到 SOURCE',
  });
};

export const buildSchemeInspectSourcePlan = (
  sourceText: string,
  schemeSourceText: string
): AppSourceReplacePlan => {
  return buildSourceReplacePlan({
    sourceText,
    replacementText: schemeSourceText,
    isReplacementEmpty: isBlankText,
    emptyMessage: 'Scheme 原始值为空，暂无可排查内容',
    sameMessage: 'Scheme 原始值已在 SOURCE 中，可手动查看深度解析报告',
    applyMessage: '已用 Scheme 原始值开始排查',
  });
};
