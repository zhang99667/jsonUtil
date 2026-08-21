interface EditorTabViewStateRestoreInput {
  targetFileId: string;
  viewState: unknown;
  getActiveFileId: () => string | null | undefined;
  restoreViewState: (viewState: unknown) => void;
  requestFrame?: (callback: FrameRequestCallback) => number;
  cancelFrame?: (frameId: number) => void;
}

export const scheduleEditorTabViewStateRestore = ({
  targetFileId,
  viewState,
  getActiveFileId,
  restoreViewState,
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
}: EditorTabViewStateRestoreInput): (() => void) => {
  const frameId = requestFrame(() => {
    if (getActiveFileId() !== targetFileId) return;
    restoreViewState(viewState);
  });

  return () => cancelFrame(frameId);
};
