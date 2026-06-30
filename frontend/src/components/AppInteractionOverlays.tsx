import React from 'react';
import { AppFileDropOverlay } from './AppFileDropOverlay';
import { AppResizeCaptureOverlay } from './AppResizeCaptureOverlay';

interface AppInteractionOverlaysProps {
  isResizing: boolean;
  isDraggingFile: boolean;
}

export const AppInteractionOverlays: React.FC<AppInteractionOverlaysProps> = ({
  isResizing,
  isDraggingFile,
}) => (
  <>
    {isResizing && <AppResizeCaptureOverlay />}
    {isDraggingFile && <AppFileDropOverlay />}
  </>
);
