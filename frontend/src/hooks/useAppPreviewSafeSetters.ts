import { useCallback } from 'react';
import type { TransformMode } from '../types';

interface UseAppPreviewSafeModeSetterInput {
  onCancelOutputDraft: () => void;
  onSetMode: (mode: TransformMode) => void;
}

interface UseAppPreviewSafeSourceSetterInput {
  onCancelOutputDraft: () => void;
  onSetSourceText: (value: string) => void;
}

export const useAppPreviewSafeModeSetter = ({
  onCancelOutputDraft,
  onSetMode,
}: UseAppPreviewSafeModeSetterInput) => useCallback((nextMode: TransformMode) => {
  onCancelOutputDraft();
  onSetMode(nextMode);
}, [onCancelOutputDraft, onSetMode]);

export const useAppPreviewSafeSourceSetter = ({
  onCancelOutputDraft,
  onSetSourceText,
}: UseAppPreviewSafeSourceSetterInput) => useCallback((nextValue: string) => {
  onCancelOutputDraft();
  onSetSourceText(nextValue);
}, [onCancelOutputDraft, onSetSourceText]);
