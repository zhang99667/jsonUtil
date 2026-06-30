import { getDetailedErrorMessage, isAbortError } from './errors';
import { showError, showSuccess } from './toast';

interface PreviewSaveFileInput {
  previewText: string;
  isOutputTransforming: boolean;
}

export const savePreviewTextAsJsonFile = async ({
  previewText,
  isOutputTransforming,
}: PreviewSaveFileInput): Promise<boolean> => {
  if (isOutputTransforming) {
    showError('预览仍在处理，请稍后再保存');
    return false;
  }

  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'preview_result.json',
        types: [{
          description: 'JSON File',
          accept: { 'application/json': ['.json'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(previewText);
      await writable.close();
    } else {
      // 兼容不支持 File System Access API 的浏览器。
      const blob = new Blob([previewText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'preview_result.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    }
    showSuccess('已保存预览结果');
    return true;
  } catch (error) {
    if (isAbortError(error)) {
      return false;
    }
    console.error('Failed to save preview:', error);
    showError(getDetailedErrorMessage(error, '保存预览结果失败'));
    return false;
  }
};
