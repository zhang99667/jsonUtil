import React from 'react';
import toast, { Toaster } from 'react-hot-toast';

interface AppToastHostProps {
  toasterId?: string;
  dismissOnUnmount?: boolean;
}

export const AppToastHost: React.FC<AppToastHostProps> = ({
  toasterId,
  dismissOnUnmount = false,
}) => {
  React.useEffect(() => {
    if (!dismissOnUnmount || !toasterId) {
      return undefined;
    }

    return () => toast.removeAll(toasterId);
  }, [dismissOnUnmount, toasterId]);

  return (
    <Toaster
      toasterId={toasterId}
      position="top-center"
      toastOptions={{
        className: '',
        style: {
          marginTop: '16px',
        },
      }}
    />
  );
};
