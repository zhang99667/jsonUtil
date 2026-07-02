import React, { useEffect, useRef } from 'react';

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
  const dialogPanelRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key === 'Tab') {
        const focusableElements: HTMLElement[] = dialogPanelRef.current
          ? Array.from(dialogPanelRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ))
          : [];
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (!firstElement || !lastElement) return;

        if (!dialogPanelRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          firstElement.focus();
          return;
        }

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
          return;
        }

        if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
          return;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElementRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const focusTimer = window.setTimeout(() => cancelButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;

    const previousActiveElement = previousActiveElementRef.current;
    previousActiveElementRef.current = null;
    if (!previousActiveElement?.isConnected) return;

    const restoreTimer = window.setTimeout(() => previousActiveElement.focus(), 0);
    return () => window.clearTimeout(restoreTimer);
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmClassName = variant === 'danger'
    ? 'app-button--danger'
    : 'app-button--primary';

  return (
    <div
      data-tour="confirm-dialog"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        ref={dialogPanelRef}
        className="w-full max-w-[420px] rounded-lg border border-editor-border bg-editor-sidebar shadow-2xl"
      >
        <div className="border-b border-editor-border px-4 py-3">
          <h2 id="confirm-dialog-title" className="text-sm font-semibold text-white">
            {title}
          </h2>
        </div>
        <div className="px-4 py-4">
          <p id="confirm-dialog-message" className="whitespace-pre-line text-sm leading-6 text-gray-300">
            {message}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-editor-border px-4 py-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="app-button app-button--secondary px-3 py-1.5 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`app-button px-3 py-1.5 text-sm ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
