import { useCallback } from 'react';
import { showError, showSuccess } from '../utils/toast';
import type { AppSaveEditor } from '../utils/appSaveActionPlan';
import type { AppSaveTrackEvent } from '../utils/appSaveCommandTypes';
import {
  runAppSaveShortcutCommand,
  runAppToolbarSaveCommand,
} from '../utils/appSaveCommandRunner';
import { savePreviewTextAsJsonFile } from '../utils/previewSaveFile';

interface UseAppSaveCommandsInput {
  activeEditor: AppSaveEditor;
  hasActiveFile: boolean;
  activeFileHasHandle: boolean;
  previewText: string;
  isOutputTransforming: boolean;
  onSaveFile: (content?: string) => Promise<boolean>;
  onSaveSourceAs: () => Promise<boolean>;
  onTrackToolEvent: AppSaveTrackEvent;
}

export const useAppSaveCommands = ({
  activeEditor,
  hasActiveFile,
  activeFileHasHandle,
  previewText,
  isOutputTransforming,
  onSaveFile,
  onSaveSourceAs,
  onTrackToolEvent,
}: UseAppSaveCommandsInput) => {
  const savePreview = useCallback(() => savePreviewTextAsJsonFile({
    previewText,
    isOutputTransforming,
  }), [isOutputTransforming, previewText]);

  const handleSaveShortcut = useCallback(() => runAppSaveShortcutCommand({
    activeEditor,
    hasActiveFile,
    activeFileHasHandle,
    previewText,
    isOutputTransforming,
  }, {
    onSaveFile,
    onSaveSourceAs,
    onSavePreviewAs: savePreview,
    onShowError: showError,
    onShowSuccess: showSuccess,
    onTrackToolEvent,
  }), [
    activeEditor,
    activeFileHasHandle,
    hasActiveFile,
    isOutputTransforming,
    onSaveFile,
    onSaveSourceAs,
    onTrackToolEvent,
    previewText,
    savePreview,
  ]);

  const handleToolbarSave = useCallback(() => runAppToolbarSaveCommand({
    activeEditor,
    hasActiveFile,
  }, {
    onSaveFile,
    onSaveSourceAs,
    onSavePreviewAs: savePreview,
    onShowError: showError,
    onShowSuccess: showSuccess,
    onTrackToolEvent,
  }), [activeEditor, hasActiveFile, onSaveFile, onSaveSourceAs, onTrackToolEvent, savePreview]);

  return { handleSaveShortcut, handleToolbarSave };
};
