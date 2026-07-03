import { useCallback } from 'react';
import { setLegacyJsonPathValue } from '../utils/appLegacyJsonPath';
import { getDetailedErrorMessage } from '../utils/errors';
import { setJsonPointerValue } from '../utils/jsonPointer';
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
      const parsed: unknown = JSON.parse(previewText);
      const updatedRoot = pointer !== undefined
        ? setJsonPointerValue(parsed, pointer, newValue)
        : setLegacyJsonPathValue(parsed, jsonPath, newValue);

      onPreviewChange(JSON.stringify(updatedRoot, null, 2));
      showSuccess('Scheme 修改已应用');
    } catch (err) {
      console.error('Failed to apply scheme edit:', err);
      showError(getDetailedErrorMessage(err, '应用修改失败'));
    }
  }, [onPreviewChange, previewText]);

  return { handleSchemeEdit };
};
