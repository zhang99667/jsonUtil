import type { KeyboardEvent, MouseEvent, RefObject } from 'react';
import type { FileTab } from '../types';

interface TabBarProps {
  files: FileTab[];
  activeFileId: string | null;
  onTabClick: (id: string) => void;
  onCloseFile: (id: string) => void;
  onNewTab: () => void;
  tabsContainerRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  showScrollbar: boolean;
  thumbSize: number;
  thumbOffset: number;
  onScrollbarMouseDown: (event: MouseEvent) => void;
}

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

const getTabAriaLabel = (file: FileTab): string => (
  file.isDirty ? `${file.name}，未保存` : file.name
);

const getCloseAriaLabel = (file: FileTab): string => (
  file.isDirty ? `关闭未保存标签 ${file.name}` : `关闭标签 ${file.name}`
);

export const TabBar = ({
  files,
  activeFileId,
  onTabClick,
  onCloseFile,
  onNewTab,
  tabsContainerRef,
  onScroll,
  showScrollbar,
  thumbSize,
  thumbOffset,
  onScrollbarMouseDown,
}: TabBarProps) => {
  const focusTabByIndex = (index: number) => {
    const tabElements = tabsContainerRef.current?.querySelectorAll('[data-file-tab="true"]');
    (tabElements?.[index] as HTMLElement | undefined)?.focus();
  };

  const activateTabByIndex = (index: number) => {
    const nextFile = files[index];
    if (!nextFile) return;

    onTabClick(nextFile.id);
    window.requestAnimationFrame(() => focusTabByIndex(index));
  };

  const closeTabByIndex = (index: number) => {
    const currentFile = files[index];
    if (!currentFile) return;

    onCloseFile(currentFile.id);
    if (!currentFile.isDirty && files.length > 1) {
      const nextFocusIndex = Math.min(index, files.length - 2);
      window.requestAnimationFrame(() => focusTabByIndex(nextFocusIndex));
    }
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const currentFile = files[index];
    if (!currentFile) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onTabClick(currentFile.id);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        activateTabByIndex((index - 1 + files.length) % files.length);
        break;
      case 'ArrowRight':
        event.preventDefault();
        activateTabByIndex((index + 1) % files.length);
        break;
      case 'Home':
        event.preventDefault();
        activateTabByIndex(0);
        break;
      case 'End':
        event.preventDefault();
        activateTabByIndex(files.length - 1);
        break;
      case 'Delete':
        event.preventDefault();
        closeTabByIndex(index);
        break;
      default:
        break;
    }
  };

  return (
    <div className="flex-1 h-full relative min-w-0 ml-2 flex flex-col justify-end">
      <div
        data-tour="editor-tabs"
        ref={tabsContainerRef}
        onScroll={onScroll}
        onWheel={(event) => {
          const container = tabsContainerRef.current;
          if (!container) return;

          const delta = event.deltaY || event.deltaX;
          if (delta !== 0) {
            container.scrollLeft += delta;
          }
        }}
        className="flex items-center h-full overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden scrollbar-hide"
      >
        {files.length > 0 && (
          <div role="tablist" aria-label="已打开文件标签" className="flex items-center h-full flex-shrink-0">
            {files.map((file, index) => (
              <div
                key={file.id}
                data-file-tab="true"
                role="tab"
                aria-selected={file.id === activeFileId}
                aria-label={getTabAriaLabel(file)}
                tabIndex={file.id === activeFileId ? 0 : -1}
                onClick={() => onTabClick(file.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.stopPropagation();
                    // 阻止部分浏览器启动自动滚动。
                    e.preventDefault();
                    onCloseFile(file.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-1.5 h-full border-r border-r-editor-sidebar text-[13px] select-none cursor-pointer group/tab min-w-[96px] max-w-[180px] flex-shrink-0 ${file.id === activeFileId
                  ? 'bg-editor-bg text-white border-t-2 border-t-brand-primary'
                  : 'bg-editor-header text-editor-fg-sub border-t-2 border-t-transparent hover:bg-editor-hover'
                  }`}
                title={file.name}
              >
                {getFileIcon(file.name)}
                <span className="truncate flex-1">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseFile(file.id);
                  }}
                  onKeyDown={(e) => e.stopPropagation()}
                  className={`rounded-md p-1 transition-all ml-1 flex-shrink-0 group/close flex items-center justify-center w-5 h-5 ${file.id === activeFileId ? 'hover:bg-editor-border' : 'hover:bg-editor-active'}`}
                  title={getCloseAriaLabel(file)}
                  aria-label={getCloseAriaLabel(file)}
                >
                  {file.isDirty ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full group-hover/close:hidden" />
                      <svg className="w-3.5 h-3.5 text-gray-400 hidden group-hover/close:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center h-full px-1">
          <button
            type="button"
            onClick={onNewTab}
            className="flex items-center justify-center w-6 h-6 rounded-md text-editor-fg-sub hover:text-white hover:bg-editor-active transition-all cursor-pointer flex-shrink-0"
            title="新建标签 (Cmd+N)"
            aria-label="新建标签 (Cmd+N)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>
      </div>

      {showScrollbar && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] z-10 opacity-0 group-hover/header:opacity-100 transition-opacity duration-200">
          <div
            className="h-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative"
            style={{
              width: `${thumbSize}%`,
              left: `${thumbOffset}%`,
            }}
            onMouseDown={onScrollbarMouseDown}
          />
        </div>
      )}
    </div>
  );
};
