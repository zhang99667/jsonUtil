import { getErrorMessage } from './errors';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';

export const copyText = async (text: string): Promise<void> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('当前环境不支持剪贴板复制');
  }

  try {
    const { default: copyToClipboard } = await import('copy-to-clipboard');
    if (await copyToClipboard(text)) return;
  } catch (error) {
    if (dispatchChunkLoadRecoveryEvent(error)) {
      throw new Error('复制能力加载失败，请刷新页面后重试', { cause: error });
    }
  }

  throw new Error('浏览器拒绝复制操作');
};

export const readClipboardText = async (): Promise<string> => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
    throw new Error('当前环境不支持读取剪贴板');
  }

  try {
    return await navigator.clipboard.readText();
  } catch {
    throw new Error('浏览器拒绝读取剪贴板');
  }
};

export const getClipboardErrorMessage = (
  error: unknown,
  fallbackMessage = '复制失败'
): string => (
  getErrorMessage(error, fallbackMessage)
);
