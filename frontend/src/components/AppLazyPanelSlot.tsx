import React, { Suspense } from 'react';

interface AppLazyPanelSlotProps {
  isLoaded: boolean;
  children: React.ReactNode;
}

export const AppLazyPanelSlot: React.FC<AppLazyPanelSlotProps> = ({
  isLoaded,
  children,
}) => {
  if (!isLoaded) return null;

  return (
    <Suspense fallback={null}>
      {children}
    </Suspense>
  );
};
