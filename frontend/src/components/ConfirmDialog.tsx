import React, { useId } from 'react';
import { NativeDialog } from './NativeDialog';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  const titleId = useId();
  const messageId = useId();

  const confirmClassName = variant === 'danger'
    ? 'app-button--danger'
    : 'app-button--primary';

  return (
    <NativeDialog
      isOpen={isOpen}
      onRequestClose={onCancel}
      data-tour="confirm-dialog"
      className="w-[calc(100%-2rem)] max-w-[420px] overflow-visible border-0 bg-transparent p-0 text-left backdrop:bg-black/60"
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div
        className="w-full rounded-lg border border-editor-border bg-editor-sidebar shadow-2xl"
      >
        <div className="border-b border-editor-border px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-white">
            {title}
          </h2>
        </div>
        <div className="px-4 py-4">
          <p id={messageId} className="whitespace-pre-line text-sm leading-6 text-gray-300">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-editor-border px-4 py-3">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="app-button app-button--secondary px-3 py-1.5 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`app-button px-3 py-1.5 text-sm ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </NativeDialog>
  );
};
