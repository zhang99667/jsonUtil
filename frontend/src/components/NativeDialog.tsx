import React, { useLayoutEffect, useRef } from 'react';

interface NativeDialogProps extends Omit<
  React.DialogHTMLAttributes<HTMLDialogElement>,
  'onCancel' | 'onKeyDown' | 'onMouseDown' | 'open'
> {
  isOpen: boolean;
  onRequestClose: () => void;
}

export const NativeDialog: React.FC<NativeDialogProps> = ({
  isOpen,
  onRequestClose,
  children,
  ...dialogProps
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
      if (previousActiveElement?.isConnected) {
        previousActiveElement.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      {...dialogProps}
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onRequestClose();
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLDialogElement>) => {
        if (event.key !== 'Tab') return;

        const focusableElements = Array.from(event.currentTarget.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter((element): element is HTMLElement => (
          element instanceof HTMLElement && element.getClientRects().length > 0
        ));
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (!firstElement || !lastElement) {
          event.preventDefault();
          return;
        }

        const activeElement = document.activeElement;
        const shouldWrapBackward = event.shiftKey
          && (activeElement === firstElement || activeElement === event.currentTarget);
        const shouldWrapForward = !event.shiftKey && activeElement === lastElement;

        if (shouldWrapBackward || shouldWrapForward) {
          event.preventDefault();
          (shouldWrapBackward ? lastElement : firstElement).focus();
        }
      }}
      onMouseDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const isBackdrop = event.clientX < bounds.left
          || event.clientX > bounds.right
          || event.clientY < bounds.top
          || event.clientY > bounds.bottom;

        if (isBackdrop) {
          event.preventDefault();
          onRequestClose();
        }
      }}
    >
      {children}
    </dialog>
  );
};
