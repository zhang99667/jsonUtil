import { useCallback } from 'react';
import { applySchemeEditToPreviewText } from '../utils/appSchemeEditPreview';
import { getDetailedErrorMessage } from '../utils/errors';
import { showError, showSuccess } from '../utils/toast';

interface UseAppSchemeEditCommandInput {
  previewText: string;
  onPreviewChange: (nextPreviewText: string) => void;
}

export const useAppSchemeEditCommand = ({
  previewText,
  onPreviewChange,
}: UseAppSchemeEditCommandInput) => {
  const handleSchemeEdit = useCallback((jsonPath: string, newValue: string, pointer?: string) => {
    try {
      onPreviewChange(applySchemeEditToPreviewText({ previewText, jsonPath, newValue, pointer }));
      showSuccess('Scheme 修改已应用');
    } catch (err) {
      console.error('Failed to apply scheme edit:', err);
      showError(getDetailedErrorMessage(err, '应用修改失败'));
    }
  }, [onPreviewChange, previewText]);

  return { handleSchemeEdit };
};
