import type { SchemeLocation } from '../utils/schemeScanner';

export interface EditorSchemeModalState {
  isOpen: boolean;
  path: string;
  pointer: string;
  value: string;
  source: string;
  label?: string;
}

export const createClosedEditorSchemeModal = (): EditorSchemeModalState => ({
  isOpen: false,
  path: '',
  pointer: '',
  value: '',
  source: '',
});

export const createOpenEditorSchemeModal = (
  location: SchemeLocation,
  source: string,
): EditorSchemeModalState => ({
  isOpen: true,
  path: location.path,
  pointer: location.pointer,
  value: location.value,
  source,
  ...(location.label ? { label: location.label } : {}),
});

export const shouldCloseEditorSchemeModal = (
  modal: EditorSchemeModalState,
  currentSource: string,
): boolean => modal.isOpen && modal.source !== currentSource;

export const canApplyEditorSchemeModal = (
  modal: EditorSchemeModalState,
  currentSource: string,
): boolean => modal.isOpen && Boolean(modal.path) && modal.source === currentSource;
