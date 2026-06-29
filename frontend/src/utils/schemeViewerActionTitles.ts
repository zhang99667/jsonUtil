export interface SchemeViewerActionTitleState {
  hasOriginalValue: boolean;
  showQRCode: boolean;
  isDecodePending: boolean;
  hasDecodedContent: boolean;
  hasSchemeQualitySummary: boolean;
  hasEditedJsonError: boolean;
  isJsonResult: boolean;
  hasNonReversibleLayer: boolean;
  decodeLayerCount: number;
  isEditing: boolean;
}

export interface SchemeViewerActionTitles {
  qrCode: string;
  copyOriginal: string;
  copyDecoded: string;
  copyQualitySnapshot: string;
  copyCmdStructure: string;
  copyPathValues: string;
  copySerialized: string;
  applyEdit: string;
}

const getQRCodeTitle = (state: Pick<SchemeViewerActionTitleState, 'hasOriginalValue' | 'showQRCode'>): string => {
  if (!state.hasOriginalValue) return '请输入内容后生成二维码';
  return state.showQRCode ? '隐藏二维码' : '生成二维码';
};

const getCopyDecodedTitle = (
  state: Pick<SchemeViewerActionTitleState, 'isDecodePending' | 'hasDecodedContent'>
): string => {
  if (state.isDecodePending) return '解析完成后可复制解码结果';
  if (!state.hasDecodedContent) return '暂无解码结果可复制';
  return '复制解码结果到剪贴板';
};

const getCopyCmdStructureTitle = (
  state: Pick<SchemeViewerActionTitleState, 'isDecodePending' | 'hasEditedJsonError' | 'isJsonResult'>
): string => {
  if (state.isDecodePending) return '解析完成后可复制 CMD 结构';
  if (state.hasEditedJsonError) return '请先修正解码结果中的 JSON 错误';
  if (!state.isJsonResult) return '当前结果不是 JSON，暂无 CMD 结构可复制';
  return '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构';
};

const getCopyPathValuesTitle = (
  state: Pick<SchemeViewerActionTitleState, 'isDecodePending' | 'hasEditedJsonError'>
): string => {
  if (state.isDecodePending) return '解析完成后可复制路径和值';
  if (state.hasEditedJsonError) return '请先修正解码结果中的 JSON 错误';
  return '复制解码 JSON 中的路径和值';
};

const getCopySerializedTitle = (
  state: Pick<
    SchemeViewerActionTitleState,
    'isDecodePending' | 'hasDecodedContent' | 'hasEditedJsonError' | 'hasNonReversibleLayer' | 'decodeLayerCount'
  >
): string => {
  if (state.isDecodePending) return '解析完成后可复制序列化结果';
  if (!state.hasDecodedContent) return '暂无编辑内容可序列化';
  if (state.hasEditedJsonError) return '请先修正解码结果中的 JSON 错误';
  if (state.hasNonReversibleLayer) return '当前编码层不可逆，仅支持查看和复制';
  if (state.decodeLayerCount === 0) return '当前内容无需重新编码';
  return '复制当前编辑内容重新编码后的结果';
};

const getApplyEditTitle = (
  state: Pick<
    SchemeViewerActionTitleState,
    'isDecodePending' | 'isEditing' | 'hasEditedJsonError' | 'hasNonReversibleLayer'
  >
): string => {
  if (state.isDecodePending) return '解析完成后可应用修改';
  if (!state.isEditing) return '修改解码结果后可应用';
  if (state.hasEditedJsonError) return '请先修正解码结果中的 JSON 错误';
  if (state.hasNonReversibleLayer) return '当前编码层不可逆，无法应用修改';
  return '将当前编辑内容重新编码并应用回来源';
};

export const buildSchemeViewerActionTitles = (
  state: SchemeViewerActionTitleState
): SchemeViewerActionTitles => ({
  qrCode: getQRCodeTitle(state),
  copyOriginal: state.hasOriginalValue ? '复制原始值到剪贴板' : '请输入待复制的原始值',
  copyDecoded: getCopyDecodedTitle(state),
  copyQualitySnapshot: state.hasSchemeQualitySummary
    ? '复制不含原始值的 Scheme 解析质量指标 JSON'
    : '暂无质量快照可复制',
  copyCmdStructure: getCopyCmdStructureTitle(state),
  copyPathValues: getCopyPathValuesTitle(state),
  copySerialized: getCopySerializedTitle(state),
  applyEdit: getApplyEditTitle(state),
});
