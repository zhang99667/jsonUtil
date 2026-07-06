import { applySchemeEditToPreviewText } from './appSchemeEditPreview';
import { getDetailedErrorMessage } from './errors';
import { showError, showSuccess } from './toast';

interface RunAppSchemeEditCommandInput {
  previewText: string;
  jsonPath: string;
  newValue: string;
  pointer?: string;
  onPreviewChange: (nextPreviewText: string) => void;
}

export const runAppSchemeEditCommand = ({
  previewText,
  jsonPath,
  newValue,
  pointer,
  onPreviewChange,
}: RunAppSchemeEditCommandInput) => {
  try {
    onPreviewChange(applySchemeEditToPreviewText({ previewText, jsonPath, newValue, pointer }));
    showSuccess('Scheme 修改已应用');
  } catch (err) {
    console.error('Failed to apply scheme edit:', err);
    showError(getDetailedErrorMessage(err, '应用修改失败'));
  }
};
