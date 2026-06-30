export type TransformReportCopySuccessMessage = string | ((text: string) => string);

export interface TransformReportCopyTextOptions {
  text: string;
  successMessage: TransformReportCopySuccessMessage;
  errorLogMessage: string;
  duration?: number;
}

export interface TransformReportCopyTextEffects {
  copyText: (text: string) => Promise<void>;
  showSuccess: (message: string, options: { duration: number }) => void;
  showError: (message: string, error: unknown) => void;
}

export const runTransformReportCopyText = async (
  {
    text,
    successMessage,
    errorLogMessage,
    duration = 2000,
  }: TransformReportCopyTextOptions,
  effects: TransformReportCopyTextEffects,
): Promise<boolean> => {
  if (!text) return false;

  try {
    await effects.copyText(text);
    effects.showSuccess(
      typeof successMessage === 'function' ? successMessage(text) : successMessage,
      { duration }
    );
    return true;
  } catch (error) {
    effects.showError(errorLogMessage, error);
    return false;
  }
};
