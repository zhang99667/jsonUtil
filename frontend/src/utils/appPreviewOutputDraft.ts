interface MutableValueRef<T> {
  current: T;
}

export const beginPreviewOutputDraft = (
  isUpdatingFromOutput: MutableValueRef<boolean>,
  pendingOutputValue: MutableValueRef<string>,
  previewText: string,
) => {
  pendingOutputValue.current = previewText;
  isUpdatingFromOutput.current = true;
};

export const keepPreviewOutputDraft = (
  pendingOutputValue: MutableValueRef<string>,
  previewText: string,
) => {
  pendingOutputValue.current = previewText;
};

export const clearPreviewOutputDraft = (
  isUpdatingFromOutput: MutableValueRef<boolean>,
  pendingOutputValue: MutableValueRef<string>,
) => {
  isUpdatingFromOutput.current = false;
  pendingOutputValue.current = '';
};
