import { vi } from 'vitest';
import type { AppPreviewOutputChangeHandlerInput } from './appPreviewOutputChangeHandler';
import { createPreviewOutputChangeTaskInput } from './appPreviewOutputSyncTestFixture';
import type { MutableValueRef } from './mutableValueRef';

type PreviewOutputChangeHandlerInputOverrides = NonNullable<Parameters<typeof createPreviewOutputChangeTaskInput>[0]> & {
  isUpdatingFromOutput?: MutableValueRef<boolean>;
  updatePreviewValidation?: (previewText: string) => void;
};

export const createPreviewOutputChangeHandlerInput = ({
  isUpdatingFromOutput,
  updatePreviewValidation,
  ...taskOverrides
}: PreviewOutputChangeHandlerInputOverrides = {}): AppPreviewOutputChangeHandlerInput => {
  const { request, ...handlerInput } = createPreviewOutputChangeTaskInput(taskOverrides);
  const { previewText, ...handlerRequest } = request;
  void previewText;

  return {
    ...handlerInput,
    request: handlerRequest,
    isUpdatingFromOutput: isUpdatingFromOutput ?? { current: false },
    updatePreviewValidation: updatePreviewValidation ?? vi.fn(),
  };
};
