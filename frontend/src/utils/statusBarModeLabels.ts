import { TransformMode } from '../types';

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
