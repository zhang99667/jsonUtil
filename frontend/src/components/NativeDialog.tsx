import React, { useLayoutEffect, useRef } from 'react';
import type { FocusTrap } from 'focus-trap';
import { dispatchChunkLoadRecoveryEvent } from '../utils/chunkLoadRecoveryDispatch';

interface NativeDialogProps extends Omit<
  React.DialogHTMLAttributes<HTMLDialogElement>,
  'onCancel' | 'onMouseDown' | 'open'
> {
  isOpen: boolean;
  onRequestClose: () => void;
  closeOnBackdrop?: boolean;
}

export const NativeDialog: React.FC<NativeDialogProps> = ({
  isOpen,
  onRequestClose,
  closeOnBackdrop = true,
  children,
  ...dialogProps
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (!dialog.open) dialog.showModal();
    let disposed = false;
    let focusTrap: FocusTrap | undefined;
    void import('focus-trap').then(({ createFocusTrap }) => {
      if (disposed || !dialog.open) return;
      focusTrap = createFocusTrap(dialog, {
        escapeDeactivates: false,
        fallbackFocus: dialog,
        initialFocus: false,
        returnFocusOnDeactivate: false,
      });
      focusTrap.activate();
    }).catch((error: unknown) => {
      if (disposed || dispatchChunkLoadRecoveryEvent(error)) return;
      console.warn('焦点管理组件加载失败，已退回原生对话框行为', error);
    });

    return () => {
      disposed = true;
      focusTrap?.deactivate();
      if (dialog.open) dialog.close();
      if (previousActiveElement?.isConnected) previousActiveElement.focus();
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
      onMouseDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const isBackdrop = event.clientX < bounds.left
          || event.clientX > bounds.right
          || event.clientY < bounds.top
          || event.clientY > bounds.bottom;

        if (!isBackdrop) return;

        event.preventDefault();
        if (closeOnBackdrop) onRequestClose();
      }}
    >
      {children}
    </dialog>
  );
};
