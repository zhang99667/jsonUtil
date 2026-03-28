import React from 'react';
import { TransformMode, FileTab } from '../types';

/** 转换模式中文标签映射 */
const MODE_LABELS: Record<TransformMode, string> = {
  [TransformMode.NONE]: '原始视图',
  [TransformMode.FORMAT]: '格式化',
  [TransformMode.DEEP_FORMAT]: '深度格式化',
  [TransformMode.MINIFY]: '压缩',
  [TransformMode.ESCAPE]: '转义',
  [TransformMode.UNESCAPE]: '反转义',
  [TransformMode.UNICODE_TO_CN]: 'Unicode 转中文',
  [TransformMode.CN_TO_UNICODE]: '中文 转 Unicode',
  [TransformMode.SORT_KEYS]: 'Key 排序',
};

/** StatusBar 组件 Props 定义 */
interface StatusBarProps {
  /** 输入内容长度 */
  inputLength: number;
  /** 文档总行数 */
  totalLines: number;
  /** 文档最大列数 */
  maxColumns: number;
  /** 当前转换模式 */
  mode: TransformMode;
  /** 当前激活的文件 ID */
  activeFileId: string | null;
  /** 文件标签列表（用于获取文件名） */
  files: FileTab[];
  /** 光标所在行号 */
  cursorLine?: number;
  /** 光标所在列号 */
  cursorColumn?: number;
}

/**
 * 底部状态栏组件
 * 显示编码、内容长度、行列统计、当前文件名和视图模式
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  inputLength,
  totalLines,
  maxColumns,
  mode,
  activeFileId,
  files,
  cursorLine,
  cursorColumn,
}) => {
  // 查找当前激活的文件
  const activeFile = activeFileId ? files.find(f => f.id === activeFileId) : null;

  return (
    <div
      data-tour="statusbar"
      className="h-6 bg-brand-primary flex items-center justify-between px-3 text-[11px] text-white select-none z-20 flex-shrink-0"
    >
      {/* 左侧：编码、长度、行列、文件名 */}
      <div className="flex gap-4">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          {' '}UTF-8
        </span>
        <span>Length: {inputLength}</span>
        {cursorLine != null && cursorColumn != null && (
          <span className="font-mono">
            Ln {cursorLine}, Col {cursorColumn}
          </span>
        )}
        <span className="font-mono">
          {totalLines} 行, {maxColumns} 列
        </span>
        {activeFile && (
          <span
            className="flex items-center gap-1 text-blue-200"
            title={activeFile.path || activeFile.name}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {activeFile.name}
          </span>
        )}
      </div>

      {/* 右侧：当前视图模式 */}
      <div data-tour="statusbar-view" className="flex gap-2 items-center">
        <span className="opacity-80">当前视图:</span>
        <span className="bg-white text-brand-primary px-1.5 py-0.5 rounded font-bold text-[11px] shadow-sm leading-none">
          {MODE_LABELS[mode]}
        </span>
        {mode === TransformMode.DEEP_FORMAT && (
          <span className="opacity-70 text-[10px] ml-1">
            · 自动展开多层嵌套的 JSON 字符串
          </span>
        )}
      </div>
    </div>
  );
};
