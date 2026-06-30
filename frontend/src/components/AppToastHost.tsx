import React from 'react';
import { Toaster } from 'react-hot-toast';

export const AppToastHost: React.FC = () => (
  <Toaster
    position="top-center"
    toastOptions={{
      className: '',
      style: {
        marginTop: '16px',
      },
    }}
  />
);
