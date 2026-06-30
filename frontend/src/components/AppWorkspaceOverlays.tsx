import React from 'react';
import { AppInteractionOverlays } from './AppInteractionOverlays';
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
    <AppInteractionOverlays isResizing={isResizing} isDraggingFile={isDraggingFile} />
    <AppToastHost />
  </>
);
