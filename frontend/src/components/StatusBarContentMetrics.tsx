import React from 'react';

interface StatusBarContentMetricsProps {
  activeContentLength: number;
  byteSizeText: string;
  totalLines: number;
  maxColumns: number;
  isStatsLimited: boolean;
  cursorLine?: number;
  cursorColumn?: number;
}

export const StatusBarContentMetrics: React.FC<StatusBarContentMetricsProps> = ({
  activeContentLength,
  byteSizeText,
  totalLines,
  maxColumns,
  isStatsLimited,
  cursorLine,
  cursorColumn,
}) => (
  <>
    <span className="flex shrink-0 items-center gap-1">
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
      {' '}UTF-8
    </span>
    <span className="shrink-0">Length: {activeContentLength}</span>
    <span
      data-tour="statusbar-byte-size"
      className="shrink-0"
      title={isStatsLimited ? '大文件只估算已扫描内容的 UTF-8 字节数' : '当前聚焦内容的 UTF-8 字节数'}
    >
      Size: {byteSizeText}
    </span>
    {cursorLine != null && cursorColumn != null && (
      <span className="shrink-0 font-mono">
        Ln {cursorLine}, Col {cursorColumn}
      </span>
    )}
    <span className="shrink-0 font-mono">
      {isStatsLimited ? (
        <span title={`大文件只统计前半段，已扫描到 ${totalLines} 行、${maxColumns} 列`}>
          行列统计已简化
        </span>
      ) : (
        `${totalLines} 行, ${maxColumns} 列`
      )}
    </span>
  </>
);
