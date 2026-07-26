import toast from 'react-hot-toast';

export const SETTINGS_DIALOG_TOASTER_ID = 'settings-dialog';

const successStyle = {
  background: 'var(--brand-primary)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
};

const errorStyle = {
  background: 'var(--brand-danger)',
  color: '#fff',
  fontSize: '14px',
  fontWeight: '500',
};

const showSuccessToast = (message: string, duration: number, toasterId?: string) => {
  toast.success(message, {
    duration,
    style: successStyle,
    iconTheme: { primary: '#fff', secondary: 'var(--brand-primary)' },
    ...(toasterId ? { toasterId } : {}),
  });
};

const showErrorToast = (message: string, duration: number, toasterId?: string) => {
  toast.error(message, {
    duration,
    style: errorStyle,
    ...(toasterId ? { toasterId } : {}),
  });
};

export const showSuccess = (message: string, duration = 2000) => {
  showSuccessToast(message, duration);
};

export const showError = (message: string, duration = 3000) => {
  showErrorToast(message, duration);
};

export const showSettingsDialogSuccess = (message: string, duration = 2000) => {
  showSuccessToast(message, duration, SETTINGS_DIALOG_TOASTER_ID);
};

export const showSettingsDialogError = (message: string, duration = 3000) => {
  showErrorToast(message, duration, SETTINGS_DIALOG_TOASTER_ID);
};
