import React from 'react';
import { AppFileDropOverlay } from './AppFileDropOverlay';
import { AppResizeCaptureOverlay } from './AppResizeCaptureOverlay';
import { AppToastHost } from './AppToastHost';

interface AppWorkspaceOverlaysProps {
  isResizing: boolean;
  isDraggingFile: boolean;
}

export const AppWorkspaceOverlays: React.FC<AppWorkspaceOverlaysProps> = ({
  isResizing,
  isDraggingFile,
}) => (
  <>
    {isResizing && <AppResizeCaptureOverlay />}

    {isDraggingFile && <AppFileDropOverlay />}

    <AppToastHost />
  </>
);
