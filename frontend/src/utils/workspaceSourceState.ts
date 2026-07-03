import type { TransformMode } from '../types';

interface ApplyWorkspaceSourceStateInput {
  content: string;
  mode?: TransformMode;
  inputRef: { current: string };
  onBeforeSourceWorkspaceChange?: () => void;
  setInput: (value: string) => void;
  setMode: (mode: TransformMode) => void;
}

export const applyWorkspaceSourceState = ({
  content,
  mode,
  inputRef,
  onBeforeSourceWorkspaceChange,
  setInput,
  setMode,
}: ApplyWorkspaceSourceStateInput) => {
  onBeforeSourceWorkspaceChange?.();
  setInput(content);
  inputRef.current = content;
  if (mode !== undefined) {
    setMode(mode);
  }
};
