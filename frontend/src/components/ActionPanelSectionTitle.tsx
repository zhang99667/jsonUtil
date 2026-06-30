import React from 'react';

interface ActionPanelSectionTitleProps {
  title: string;
  isCollapsed: boolean;
  isFirst?: boolean;
}

export const ActionPanelSectionTitle: React.FC<ActionPanelSectionTitleProps> = ({
  title,
  isCollapsed,
  isFirst = false,
}) => {
  if (isCollapsed) return null;

  return (
    <div className={`px-2 text-[10px] font-bold text-editor-fg-dim uppercase tracking-wider mb-2 ${isFirst ? 'mt-2' : ''}`}>
      {title}
    </div>
  );
};
