/**
 * 判断浏览器文件选择、保存选择等用户取消操作。
 */
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return typeof DOMException !== 'undefined'
    && error instanceof DOMException
    && error.name === 'AbortError';
};

/**
 * 提取可展示给用户的错误原因。
 */
export const getErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message.length > 0) {
      return message;
    }
  }

  return fallbackMessage;
};

/**
 * 保留底层错误原文，适合 worker 或日志通道直接回传异常信息。
 */
export const formatUnknownError = (error: unknown): string => (
  error instanceof Error ? error.message : String(error)
);

/**
 * 将操作上下文和底层错误原因组合成更可操作的提示。
 */
export const getDetailedErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const detail = getErrorMessage(error, '');
  if (!detail) {
    return fallbackMessage;
  }

  if (detail === fallbackMessage || detail.startsWith(`${fallbackMessage}：`)) {
    return detail;
  }

  return `${fallbackMessage}：${detail}`;
};
