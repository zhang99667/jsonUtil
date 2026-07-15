import { getDetailedErrorMessage, isAbortError } from './errors';
import { writeTextToFileHandleQueued } from './browserFileHandleWrite';
import { triggerTextDownload } from './browserFileSave';
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

  let usedDownloadFallback = false;

  try {
    if (typeof window.showSaveFilePicker === 'function') {
      let handle: FileSystemFileHandle;
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: 'preview_result.json',
          types: [{
            description: 'JSON 文件',
            accept: { 'application/json': ['.json'] },
          }],
        });
      } catch (error) {
        if (isAbortError(error)) return false;
        throw error;
      }

      await writeTextToFileHandleQueued(handle, previewText);
    } else {
      // 兼容不支持 File System Access API 的浏览器。
      triggerTextDownload({
        text: previewText,
        fileName: 'preview_result.json',
        mimeType: 'application/json',
      });
      usedDownloadFallback = true;
    }
    showSuccess(usedDownloadFallback ? '已开始下载预览结果' : '已保存预览结果');
    return true;
  } catch (error) {
    console.error('保存预览结果失败:', error);
    showError(getDetailedErrorMessage(error, '保存预览结果失败'));
    return false;
  }
};
