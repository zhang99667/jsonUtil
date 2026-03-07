import React from 'react';
import { FileTab } from '../types';

/** TabBar 组件 Props 定义 */
interface TabBarProps {
  /** 文件标签列表 */
  files: FileTab[];
  /** 当前激活的文件 ID */
  activeFileId: string | null;
  /** 点击标签切换文件 */
  onTabClick: (id: string) => void;
  /** 关闭文件标签 */
  onCloseFile: (id: string) => void;
  /** 新建标签 */
  onNewTab: () => void;
  /** 标签容器 ref（用于滚动控制） */
  tabsContainerRef: React.RefObject<HTMLDivElement | null>;
  /** 滚动事件处理 */
  onScroll: () => void;
  /** 自定义滚动条：是否显示 */
  showScrollbar: boolean;
  /** 自定义滚动条：滑块宽度百分比 */
  thumbWidth: number;
  /** 自定义滚动条：滑块偏移百分比 */
  thumbLeft: number;
  /** 自定义滚动条：鼠标按下事件 */
  onScrollbarMouseDown: (e: React.MouseEvent) => void;
}

/**
 * 获取文件类型图标
 * 根据文件扩展名返回对应的图标元素
 */
const getFileIcon = (filename: string) => {
  if (!filename) {
    return (
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'json':
      return <span className="text-yellow-400 font-bold text-[11px] w-4 text-center flex-shrink-0">J</span>;
    case 'js':
    case 'jsx':
      return <span className="text-yellow-300 font-bold text-[11px] w-4 text-center flex-shrink-0">JS</span>;
    case 'ts':
    case 'tsx':
      return <span className="text-blue-400 font-bold text-[11px] w-4 text-center flex-shrink-0">TS</span>;
    case 'css':
      return <span className="text-blue-300 font-bold text-[11px] w-4 text-center flex-shrink-0">#</span>;
    case 'html':
      return <span className="text-orange-400 font-bold text-[11px] w-4 text-center flex-shrink-0">&lt;&gt;</span>;
    case 'md':
      return <span className="text-gray-300 font-bold text-[11px] w-4 text-center flex-shrink-0">M↓</span>;
    default:
      return (
        <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

/**
 * 标签栏组件
 * 展示已打开的文件标签，支持切换、关闭、新建标签和横向滚动
 */
export const TabBar: React.FC<TabBarProps> = ({
  files,
  activeFileId,
  onTabClick,
  onCloseFile,
  onNewTab,
  tabsContainerRef,
  onScroll,
  showScrollbar,
  thumbWidth,
  thumbLeft,
  onScrollbarMouseDown,
}) => {
  return (
    <div className="flex-1 h-full relative min-w-0 ml-2 flex flex-col justify-end">
      <div
        data-tour="editor-tabs"
        ref={tabsContainerRef}
        onScroll={onScroll}
        onWheel={(e) => {
          if (tabsContainerRef.current) {
            // 将垂直滚动转换为水平滚动
            const delta = e.deltaY || e.deltaX;
            if (delta !== 0) {
              tabsContainerRef.current.scrollLeft += delta;
            }
          }
        }}
        className="flex items-center h-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden scrollbar-hide"
      >
        {files.length > 0 && files.map(file => (
          <div
            key={file.id}
            onClick={() => onTabClick(file.id)}
            onAuxClick={(e) => {
              // 鼠标中键 (button 1) 关闭标签
              if (e.button === 1) {
                e.stopPropagation();
                e.preventDefault(); // 阻止部分浏览器的自动滚动行为
                onCloseFile(file.id);
              }
            }}
            className={`flex items-center gap-1.5 px-1.5 h-full border-r border-r-editor-sidebar text-[13px] select-none cursor-pointer group/tab min-w-[120px] max-w-[200px] flex-shrink-0 ${file.id === activeFileId
              ? 'bg-editor-bg text-white border-t-2 border-t-brand-primary'
              : 'bg-editor-header text-editor-fg-sub border-t-2 border-t-transparent hover:bg-editor-hover'
              }`}
            title={file.name}
          >
            {getFileIcon(file.name)}
            <span className="truncate flex-1">{file.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCloseFile(file.id);
              }}
              className={`rounded-md p-1 transition-all ml-1 flex-shrink-0 group/close flex items-center justify-center w-5 h-5 ${file.id === activeFileId ? 'hover:bg-editor-border' : 'hover:bg-editor-active'}`}
              title={file.isDirty ? "未保存" : "关闭"}
            >
              {file.isDirty ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full group-hover/close:hidden"></div>
                  <svg className="w-3.5 h-3.5 text-gray-400 hidden group-hover/close:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </>
              ) : (
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </button>
          </div>
        ))}

        {/* 新建标签按钮 */}
        <div className="flex items-center justify-center h-full px-1">
          <button
            onClick={() => onNewTab()}
            className="flex items-center justify-center w-6 h-6 rounded-md text-editor-fg-sub hover:text-white hover:bg-editor-active transition-all cursor-pointer flex-shrink-0"
            title="新建标签 (Cmd+N)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      {/* 自定义滚动条 */}
      {showScrollbar && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] z-10 opacity-0 group-hover/header:opacity-100 transition-opacity duration-200">
          <div
            className="h-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative"
            style={{
              width: `${thumbWidth}%`,
              left: `${thumbLeft}%`
            }}
            onMouseDown={onScrollbarMouseDown}
          />
        </div>
      )}
    </div>
  );
};
