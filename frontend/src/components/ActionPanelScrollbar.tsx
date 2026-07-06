import React from 'react';

interface ActionPanelScrollbarProps {
  showScrollbar: boolean;
  thumbHeight: number;
  thumbTop: number;
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const ActionPanelScrollbar: React.FC<ActionPanelScrollbarProps> = ({
  showScrollbar,
  thumbHeight,
  thumbTop,
  onMouseDown,
}) => {
  if (!showScrollbar) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-[10px] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-200">
      <div
        className="absolute right-[2px] w-[6px] bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer"
        style={{
          height: `${thumbHeight}%`,
          top: `${thumbTop}%`,
        }}
        onMouseDown={onMouseDown}
      />
    </div>
  );
};
