import { formatByteSize, getDocumentStats } from './documentStats';

const PLACEHOLDER_FILL_TEMPLATE_KIND = 'json-helper-runtime-placeholder-fill-template';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

export const getContentSizeSummary = (content: string): string => {
  const stats = getDocumentStats(content);
  return `${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}`;
};

export const getCopySuccessMessage = (label: string, content: string): string => {
  const stats = getDocumentStats(content);
  return `已复制${label}（${stats.characterCount} 字符 / ${formatByteSize(stats.utf8ByteLength)}）`;
};

export const getSourceUpdateSuccessMessage = (message: string, content: string): string => (
  `${message}（${getContentSizeSummary(content)}）`
);

export const getClearSourceConfirmMessage = (sourceContent: string, isOpen: boolean): string => (
  isOpen
    ? `这会清空当前 SOURCE 编辑区内容，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(sourceContent)}`
    : ''
);

export const getPasteSourceConfirmMessage = (sourceContent: string, clipboardText: string | null): string => (
  clipboardText === null
    ? ''
    : `这会用剪贴板文本替换当前 SOURCE 编辑区内容，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(sourceContent)}\n剪贴板文本: ${getContentSizeSummary(clipboardText)}`
);

export const getApplyPreviewConfirmMessage = (sourceContent: string, previewText: string | null): string => (
  previewText === null
    ? ''
    : `这会用当前 PREVIEW 内容替换 SOURCE 编辑区，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(sourceContent)}\nPREVIEW: ${getContentSizeSummary(previewText)}`
);

export const getApplySchemaExampleConfirmMessage = (sourceContent: string, schemaExampleText: string | null): string => (
  schemaExampleText === null
    ? ''
    : `这会用当前 Schema 生成的示例 JSON 替换 SOURCE 编辑区，并将当前标签标记为未保存。\n当前 SOURCE: ${getContentSizeSummary(sourceContent)}\nSchema 示例: ${getContentSizeSummary(schemaExampleText)}`
);

export const getSchemeInspectConfirmMessage = (sourceContent: string, schemeSourceText: string | null): string => (
  schemeSourceText === null
    ? ''
    : `这会用 Scheme 面板原始值替换 SOURCE，并切换到嵌套解析、打开深度解析报告。\n当前 SOURCE: ${getContentSizeSummary(sourceContent)}\nScheme 原始值: ${getContentSizeSummary(schemeSourceText)}`
);

export const isPlaceholderFillTemplateJson = (templateJson: string): boolean => {
  try {
    const parsed = JSON.parse(templateJson) as unknown;
    return isRecord(parsed) && parsed.kind === PLACEHOLDER_FILL_TEMPLATE_KIND;
  } catch {
    return false;
  }
};
