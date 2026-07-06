import { useCallback } from 'react';
import { runAppSchemeEditCommand } from '../utils/appSchemeEditCommandRunner';

interface UseAppSchemeEditCommandInput {
  previewText: string;
  onPreviewChange: (nextPreviewText: string) => void;
}

export const useAppSchemeEditCommand = ({
  previewText,
  onPreviewChange,
}: UseAppSchemeEditCommandInput) => {
  const handleSchemeEdit = useCallback((jsonPath: string, newValue: string, pointer?: string) => {
    runAppSchemeEditCommand({ previewText, jsonPath, newValue, pointer, onPreviewChange });
  }, [onPreviewChange, previewText]);

  return { handleSchemeEdit };
};
