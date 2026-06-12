import { getErrorMessage } from './errors';

/**
 * 复制文本到剪贴板。
 * 优先使用现代 Clipboard API，失败时回退到传统 textarea 方案，兼容部分 WebView/Electron 权限场景。
 */
export const copyText = async (text: string): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // 继续尝试传统复制方案，避免权限或非安全上下文导致复制彻底不可用。
    }
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    throw new Error('当前环境不支持剪贴板复制');
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const copied = document.execCommand('copy');
    if (!copied) {
      throw new Error('浏览器拒绝复制操作');
    }
  } finally {
    textarea.remove();
  }
};

export const getClipboardErrorMessage = (
  error: unknown,
  fallbackMessage = '复制失败'
): string => (
  getErrorMessage(error, fallbackMessage)
);
