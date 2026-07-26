import type { SchemeLocation } from '../utils/schemeScanner';
import type { SchemeDisplayHeaderMarker } from '../utils/schemeDisplayHeader';

export interface EditorSchemeModalState {
  isOpen: boolean;
  path: string;
  pointer: string;
  value: string;
  source: string;
  readOnly: boolean;
  label?: string;
}

export const createClosedEditorSchemeModal = (): EditorSchemeModalState => ({
  isOpen: false,
  path: '',
  pointer: '',
  value: '',
  source: '',
  readOnly: false,
});

export const createOpenEditorSchemeModal = (
  location: SchemeLocation,
  source: string,
  displayHeaderMarker?: SchemeDisplayHeaderMarker,
): EditorSchemeModalState => ({
  isOpen: true,
  path: location.path,
  pointer: location.pointer,
  value: displayHeaderMarker?.source ?? location.value,
  source,
  readOnly: Boolean(displayHeaderMarker),
  ...(location.label ? { label: location.label } : {}),
});

export const shouldCloseEditorSchemeModal = (
  modal: EditorSchemeModalState,
  currentSource: string,
): boolean => modal.isOpen && modal.source !== currentSource;

export const canApplyEditorSchemeModal = (
  modal: EditorSchemeModalState,
  currentSource: string,
): boolean => (
  modal.isOpen
  && !modal.readOnly
  && Boolean(modal.path)
  && modal.source === currentSource
);
