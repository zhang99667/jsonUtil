import type {
  TransformReportCopyTextEffects,
  TransformReportCopyTextOptions,
} from './transformReportCopyActionRunnerTypes';

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
