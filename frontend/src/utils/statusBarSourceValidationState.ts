import type {
  StatusBarBadgeState,
  StatusBarSourceValidationInput,
} from './statusBarStateTypes';

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
