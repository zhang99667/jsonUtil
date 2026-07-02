import React from 'react';

interface AppResizeSeparatorProps {
  tourId: string;
  ariaLabel: string;
  valueMin: number;
  valueMax: number;
  valueNow: number;
  valueText: string;
  className: string;
  title: string;
  style?: React.CSSProperties;
  onMouseDown: React.MouseEventHandler<HTMLDivElement>;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

export const resizeHandleBaseClassName = 'hover:bg-brand-primary focus-visible:bg-brand-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/70 cursor-col-resize z-20 transition-colors delay-100';

export const AppResizeSeparator: React.FC<AppResizeSeparatorProps> = ({
  tourId,
  ariaLabel,
  valueMin,
  valueMax,
  valueNow,
  valueText,
  className,
  title,
  style,
  onMouseDown,
  onKeyDown,
}) => (
  <div
    data-tour={tourId}
    role="separator"
    aria-label={ariaLabel}
    aria-orientation="vertical"
    aria-valuemin={valueMin}
    aria-valuemax={valueMax}
    aria-valuenow={valueNow}
    aria-valuetext={valueText}
    tabIndex={0}
    className={className}
    style={style}
    onMouseDown={onMouseDown}
    onKeyDown={onKeyDown}
    title={title}
  />
);
