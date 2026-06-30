import React from 'react';
import {
  AppSourceCodeEditor,
  type AppSourceCodeEditorProps,
} from './AppSourceCodeEditor';

export interface AppSourceEditorPaneProps extends AppSourceCodeEditorProps {
  leftPaneWidthPercent: number;
}

export const AppSourceEditorPane: React.FC<AppSourceEditorPaneProps> = ({
  leftPaneWidthPercent,
  ...sourceEditorProps
}) => (
  <div data-tour="source-editor" style={{ width: `${leftPaneWidthPercent}%` }} className="flex flex-col min-w-[100px] h-full relative">
    <AppSourceCodeEditor {...sourceEditorProps} />
  </div>
);
