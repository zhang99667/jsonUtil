import React from 'react';
import {
  AppPreviewCodeEditor,
  type AppPreviewCodeEditorProps,
} from './AppPreviewCodeEditor';

export type AppPreviewEditorPaneProps = AppPreviewCodeEditorProps;

export const AppPreviewEditorPane: React.FC<AppPreviewEditorPaneProps> = (previewEditorProps) => (
  <div data-tour="preview-editor" className="flex-1 flex flex-col min-w-[100px] h-full relative">
    <AppPreviewCodeEditor {...previewEditorProps} />
  </div>
);
