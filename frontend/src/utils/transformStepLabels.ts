import type { TransformStep, TransformStepType } from '../types';

const STEP_LABELS: Record<TransformStepType, string> = {
  json_parse: '嵌套 JSON',
  json_stringify: 'JSON 字符串化',
  scheme_decode: 'Scheme 解码',
  unicode_decode: 'Unicode 解码',
  unicode_encode: 'Unicode 编码',
  url_decode: 'URL 解码',
  url_encode: 'URL 编码',
  base64_decode: 'Base64 解码',
  base64_encode: 'Base64 编码',
  unescape: '反转义',
  escape: '转义',
};

const getSchemeTypeLabel = (step: TransformStep): string => {
  if (step.originalSchemeType === 'query-string') return 'CMD 参数';
  if (step.originalSchemeType === 'url') return 'URL Scheme';
  if (step.originalSchemeType === 'base64') return 'Base64';
  return 'Scheme';
};

export const getTransformStepLabel = (step: TransformStep): string => {
  if (step.type !== 'scheme_decode') return STEP_LABELS[step.type];

  const reversibleLabel = step.originalSchemeReversible === false ? '不可逆' : '可回写';
  return `${getSchemeTypeLabel(step)} · ${reversibleLabel}`;
};
