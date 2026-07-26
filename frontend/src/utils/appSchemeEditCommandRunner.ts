import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';
import { getDetailedErrorMessage } from './errors';
import { showError, showSuccess } from './toast';

interface RunAppSchemeEditCommandInput {
  previewText: string;
  jsonPath: string;
  newValue: string;
  pointer?: string;
  onPreviewChange: (nextPreviewText: string) => void;
}

export const runAppSchemeEditCommand = async ({
  previewText,
  jsonPath,
  newValue,
  pointer,
  onPreviewChange,
}: RunAppSchemeEditCommandInput): Promise<void> => {
  try {
    const { applySchemeEditToPreviewText } = await import('./appSchemeEditPreview');
    onPreviewChange(applySchemeEditToPreviewText({ previewText, jsonPath, newValue, pointer }));
    showSuccess('Scheme 修改已应用');
  } catch (error) {
    if (dispatchChunkLoadRecoveryEvent(error)) return;

    console.error('应用 Scheme 修改失败:', error);
    showError(getDetailedErrorMessage(error, '应用修改失败'));
  }
};
