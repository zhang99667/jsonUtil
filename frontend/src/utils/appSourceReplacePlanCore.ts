export type AppSourceReplacePlan =
  | {
      action: 'skip';
      feedback: 'error' | 'success';
      message: string;
    }
  | {
      action: 'confirm';
      pendingText: string;
    }
  | {
      action: 'apply';
      text: string;
      successMessage: string;
    };

export interface AppSourceReplacePlanOptions {
  sourceText: string;
  replacementText: string;
  isReplacementEmpty: (replacementText: string) => boolean;
  emptyMessage: string;
  sameMessage: string;
  applyMessage: string;
}

export const buildSourceReplacePlan = ({
  sourceText,
  replacementText,
  isReplacementEmpty,
  emptyMessage,
  sameMessage,
  applyMessage,
}: AppSourceReplacePlanOptions): AppSourceReplacePlan => {
  if (isReplacementEmpty(replacementText)) {
    return {
      action: 'skip',
      feedback: 'error',
      message: emptyMessage,
    };
  }

  if (replacementText === sourceText) {
    return {
      action: 'skip',
      feedback: 'success',
      message: sameMessage,
    };
  }

  if (sourceText.trim()) {
    return {
      action: 'confirm',
      pendingText: replacementText,
    };
  }

  return {
    action: 'apply',
    text: replacementText,
    successMessage: applyMessage,
  };
};
