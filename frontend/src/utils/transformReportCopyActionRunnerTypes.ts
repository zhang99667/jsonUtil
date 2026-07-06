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
