import { TransformMode, type ValidationResult } from '../types';
import { formatByteSize } from './documentStats';
import type { StandaloneDeepFormatInputKind } from './transformations';

export interface StatusBarBadgeState {
  label: string;
  className: string;
  title: string;
}

export interface StatusBarSourceValidationLocation {
  line: number;
  column: number;
}

export interface StatusBarSaveStatusInput {
  hasActiveFile: boolean;
  isSavedFile: boolean;
  isDirty: boolean;
  inputLength: number;
  isAutoSaveEnabled: boolean;
}

export interface StatusBarSourceValidationInput {
  hasSourceContent: boolean;
  isSourceJsonCandidate: boolean;
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  sourceValidation: ValidationResult;
  sourceValidationLocation: StatusBarSourceValidationLocation | null;
}

export const STATUS_BAR_MODE_LABELS: Record<TransformMode, string> = {
  [TransformMode.NONE]: '原始视图',
  [TransformMode.FORMAT]: '格式化',
  [TransformMode.DEEP_FORMAT]: '深度格式化',
  [TransformMode.MINIFY]: '压缩',
  [TransformMode.ESCAPE]: '转义',
  [TransformMode.UNESCAPE]: '反转义',
  [TransformMode.UNICODE_TO_CN]: 'Unicode 转中文',
  [TransformMode.CN_TO_UNICODE]: '中文 转 Unicode',
  [TransformMode.URL_ENCODE]: 'URL 编码',
  [TransformMode.URL_DECODE]: 'URL 解码',
  [TransformMode.BASE64_ENCODE]: 'Base64 编码',
  [TransformMode.BASE64_DECODE]: 'Base64 解码',
  [TransformMode.SORT_KEYS]: 'Key 排序',
  [TransformMode.JSON_TO_TYPESCRIPT]: 'JSON 转 TS',
};

export const getStatusBarByteSizeText = (
  activeContentByteLength: number,
  isStatsLimited: boolean,
): string => `${isStatsLimited ? '≥' : ''}${formatByteSize(activeContentByteLength)}`;

export const getStatusBarSaveStatus = ({
  hasActiveFile,
  isSavedFile,
  isDirty,
  inputLength,
  isAutoSaveEnabled,
}: StatusBarSaveStatusInput): StatusBarBadgeState => {
  if (!hasActiveFile) {
    return inputLength > 0
      ? { label: '草稿未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前内容还没有保存为文件' }
      : { label: '空白草稿', className: 'bg-white/15 text-white', title: '当前没有打开文件' };
  }

  if (!isSavedFile) {
    return isDirty
      ? { label: '未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前标签尚未保存到文件' }
      : { label: '未保存标签', className: 'bg-white/15 text-white', title: '当前标签尚未绑定本地文件' };
  }

  if (isDirty) {
    return isAutoSaveEnabled
      ? { label: '等待自动保存', className: 'bg-yellow-100 text-yellow-800', title: '自动保存会在编辑停止后写入文件' }
      : { label: '未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前文件有未保存修改' };
  }

  return isAutoSaveEnabled
    ? { label: '自动保存已同步', className: 'bg-green-100 text-green-800', title: '当前文件修改已自动同步' }
    : { label: '已保存', className: 'bg-white text-brand-primary', title: '当前文件没有未保存修改' };
};

export const getStatusBarSourceValidationStatus = ({
  hasSourceContent,
  isSourceJsonCandidate,
  sourceStandaloneDeepFormatKind,
  sourceValidation,
  sourceValidationLocation,
}: StatusBarSourceValidationInput): StatusBarBadgeState => {
  if (!hasSourceContent) {
    return {
      label: 'SOURCE 空',
      className: 'bg-white/15 text-white',
      title: 'SOURCE 为空，输入 JSON 后会展示校验状态',
    };
  }

  if (!isSourceJsonCandidate) {
    if (sourceStandaloneDeepFormatKind) {
      if (sourceStandaloneDeepFormatKind === 'url-encoded-json') {
        return {
          label: 'SOURCE 编码JSON',
          className: 'bg-blue-100 text-blue-800',
          title: '当前 SOURCE 是 URL 编码 JSON，已按深度解析处理',
        };
      }

      if (sourceStandaloneDeepFormatKind === 'url-encoded-scheme') {
        return {
          label: 'SOURCE 编码Scheme',
          className: 'bg-blue-100 text-blue-800',
          title: '当前 SOURCE 是 URL 编码 CMD/Scheme，已按深度解析处理',
        };
      }

      return {
        label: 'SOURCE Scheme',
        className: 'bg-blue-100 text-blue-800',
        title: '当前 SOURCE 是可直接解析的 CMD/Scheme，已按深度解析处理',
      };
    }

    return {
      label: 'SOURCE 文本',
      className: 'bg-white/15 text-white',
      title: '当前 SOURCE 不以 { 或 [ 开头，按普通文本处理',
    };
  }

  if (sourceValidation.isValid) {
    return {
      label: 'JSON 有效',
      className: 'bg-green-100 text-green-800',
      title: 'SOURCE JSON / JSON Lines 校验通过',
    };
  }

  const locationText = sourceValidationLocation
    ? ` L${sourceValidationLocation.line}:C${sourceValidationLocation.column}`
    : '';

  return {
    label: `JSON 无效${locationText}`,
    className: 'bg-red-100 text-red-800',
    title: sourceValidation.error ? `SOURCE JSON 无效: ${sourceValidation.error}` : 'SOURCE JSON 无效',
  };
};
