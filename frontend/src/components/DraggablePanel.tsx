import React, { useState, useEffect, useId, useRef, ReactNode } from 'react';
import { isFiniteNumber, isRecord, parseJsonWithFallback, safeGetStorageItem, safeSetStorageItem } from '../utils/storage';
import { APP_BACKUP_IMPORTED_EVENT } from '../utils/appBackup';
import { PANEL_LAYOUT_RESET_EVENT } from '../utils/panelLayout';

export type ResizeDirection = 'width' | 'height' | 'both';

export interface DraggablePanelProps {
  /** 是否显示面板 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 面板标题 */
  title: ReactNode;
  /** 面板可访问名称，标题为复杂节点时使用 */
  ariaLabel?: string;
  /** 打开后优先聚焦的元素；未传时默认聚焦关闭按钮 */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** 标题图标 (SVG ReactNode) */
  icon: ReactNode;
  /** 头部额外内容（如 path 标签），显示在标题后、关闭按钮前 */
  headerExtra?: ReactNode;
  /** localStorage 的存储键前缀 */
  storageKey: string;
  /** 默认位置 */
  defaultPosition?: { x: number; y: number };
  /** 默认尺寸 */
  defaultSize?: { width: number; height: number };
  /** 最小尺寸 */
  minSize?: { width: number; height: number };
  /** 支持的调整方向，默认 ['width', 'height', 'both'] */
  resizeDirections?: ResizeDirection[];
  /** 面板内容 */
  children: ReactNode;
  /** 底部操作栏 */
  footer?: ReactNode;
  /** 额外的 className */
  className?: string;
  /** data-tour 属性，用于引导 */
  dataTour?: string;
}

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 600, height: 400 };
const DEFAULT_MIN_SIZE = { width: 300, height: 200 };
const MIN_VISIBLE_PANEL_EDGE = 80;
const VIEWPORT_PADDING = 24;

export type PanelPosition = { x: number; y: number };
export type PanelSize = { width: number; height: number };
export type ViewportSize = { width: number; height: number };

const isPanelPosition = (value: unknown): value is PanelPosition => {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
};

const isPanelSize = (value: unknown): value is PanelSize => {
  return isRecord(value) && isFiniteNumber(value.width) && isFiniteNumber(value.height);
};

export const normalizePanelSize = (
  size: PanelSize,
  minSize: PanelSize,
  viewport: ViewportSize
): PanelSize => {
  const maxWidth = Math.max(minSize.width, viewport.width - VIEWPORT_PADDING);
  const maxHeight = Math.max(minSize.height, viewport.height - VIEWPORT_PADDING);

  return {
    width: Math.min(Math.max(size.width, minSize.width), maxWidth),
    height: Math.min(Math.max(size.height, minSize.height), maxHeight),
  };
};

export const normalizePanelPosition = (
  position: PanelPosition,
  size: PanelSize,
  viewport: ViewportSize
): PanelPosition => {
  return {
    x: Math.min(
      Math.max(position.x, -size.width + MIN_VISIBLE_PANEL_EDGE),
      viewport.width - MIN_VISIBLE_PANEL_EDGE
    ),
    y: Math.min(
      Math.max(position.y, 0),
      viewport.height - MIN_VISIBLE_PANEL_EDGE
    ),
  };
};

const getViewportSize = (): ViewportSize => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  initialFocusRef,
  icon,
  headerExtra,
  storageKey,
  defaultPosition = DEFAULT_POSITION,
  defaultSize = DEFAULT_SIZE,
  minSize = DEFAULT_MIN_SIZE,
  resizeDirections = ['width', 'height', 'both'],
  children,
  footer,
  className = '',
  dataTour,
}) => {
  const loadSize = () => normalizePanelSize(
    parseJsonWithFallback(
      safeGetStorageItem(`${storageKey}-size`),
      defaultSize,
      isPanelSize
    ),
    minSize,
    getViewportSize()
  );

  const loadPosition = (currentSize: PanelSize) => normalizePanelPosition(
    parseJsonWithFallback(
      safeGetStorageItem(`${storageKey}-position`),
      defaultPosition,
      isPanelPosition
    ),
    currentSize,
    getViewportSize()
  );

  // 面板位置（持久化）
  const [position, setPosition] = useState<PanelPosition>(() => loadPosition(loadSize()));

  // 面板大小（持久化）
  const [size, setSize] = useState<PanelSize>(loadSize);

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 调整大小状态
  const [isResizing, setIsResizing] = useState<ResizeDirection | false>(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 });
  const [startSize, setStartSize] = useState({ width: 0, height: 0 });

  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);
  const titleId = useId();
  const panelLabel = ariaLabel || (typeof title === 'string' ? title : '浮动面板');
  const closeButtonLabel = `关闭 ${panelLabel}`;

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      previousActiveElementRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

      const focusTimer = window.setTimeout(() => {
        (initialFocusRef?.current || closeButtonRef.current)?.focus();
      }, 0);

      return () => window.clearTimeout(focusTimer);
    }

    if (!wasOpenRef.current) return;

    wasOpenRef.current = false;
    const previousActiveElement = previousActiveElementRef.current;
    previousActiveElementRef.current = null;

    if (!previousActiveElement?.isConnected) return;

    const restoreTimer = window.setTimeout(() => {
      previousActiveElement.focus();
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, [initialFocusRef, isOpen]);

  // ESC 键关闭面板（仅在焦点位于面板内时生效）
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const panel = panelRef.current;
        if (
          panel &&
          (panel.contains(document.activeElement) || panel === document.activeElement)
        ) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 保存位置到 localStorage
  useEffect(() => {
    safeSetStorageItem(`${storageKey}-position`, JSON.stringify(position));
  }, [position, storageKey]);

  // 保存大小到 localStorage
  useEffect(() => {
    safeSetStorageItem(`${storageKey}-size`, JSON.stringify(size));
  }, [size, storageKey]);

  // 全局恢复布局时，同步重置当前已挂载的面板状态
  useEffect(() => {
    const handleLayoutReset = () => {
      const viewport = getViewportSize();
      const nextSize = normalizePanelSize(defaultSize, minSize, viewport);
      setSize(nextSize);
      setPosition(normalizePanelPosition(defaultPosition, nextSize, viewport));
    };

    window.addEventListener(PANEL_LAYOUT_RESET_EVENT, handleLayoutReset);
    return () => window.removeEventListener(PANEL_LAYOUT_RESET_EVENT, handleLayoutReset);
  }, [
    defaultPosition.x,
    defaultPosition.y,
    defaultSize.width,
    defaultSize.height,
    minSize.width,
    minSize.height,
  ]);

  // 配置备份导入后，从 localStorage 重新读取布局并夹取到当前视口
  useEffect(() => {
    const handleBackupImported = () => {
      const nextSize = loadSize();
      setSize(nextSize);
      setPosition(loadPosition(nextSize));
    };

    window.addEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
    return () => window.removeEventListener(APP_BACKUP_IMPORTED_EVENT, handleBackupImported);
  }, [
    storageKey,
    defaultPosition.x,
    defaultPosition.y,
    defaultSize.width,
    defaultSize.height,
    minSize.width,
    minSize.height,
  ]);

  // 窗口尺寸变化时重新夹取面板，避免分屏/外接屏切换后面板不可见
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      const viewport = getViewportSize();

      setSize((prevSize) => {
        const nextSize = normalizePanelSize(prevSize, minSize, viewport);
        setPosition((prevPosition) => normalizePanelPosition(prevPosition, nextSize, viewport));
        return nextSize;
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, minSize.width, minSize.height]);

  // 处理拖动和调整大小
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // 计算新位置，并 clamp 到视口边界，确保面板始终至少有 80px 可见区域
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition(normalizePanelPosition({ x: newX, y: newY }, size, getViewportSize()));
      } else if (isResizing) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;

        if (isResizing === 'width') {
          setSize((prev) => ({
            ...prev,
            width: Math.max(minSize.width, startSize.width + deltaX),
          }));
        } else if (isResizing === 'height') {
          setSize((prev) => ({
            ...prev,
            height: Math.max(minSize.height, startSize.height + deltaY),
          }));
        } else if (isResizing === 'both') {
          setSize({
            width: Math.max(minSize.width, startSize.width + deltaX),
            height: Math.max(minSize.height, startSize.height + deltaY),
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, isResizing, resizeStart, startSize, minSize, size]);

  // 拖动面板头部
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  // 调整大小
  const handleResizeMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    e.stopPropagation();
    setResizeStart({ x: e.clientX, y: e.clientY });
    setStartSize({ width: size.width, height: size.height });
    setIsResizing(direction);
  };

  // 早期返回必须在所有 hooks 之后
  if (!isOpen) return null;

  const showWidthHandle = resizeDirections.includes('width');
  const showHeightHandle = resizeDirections.includes('height');
  const showBothHandle = resizeDirections.includes('both');

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      data-tour={dataTour}
      role="dialog"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabel ? undefined : titleId}
      className={`fixed bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* 头部 - 可拖动 */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-editor-sidebar border-b border-editor-border rounded-t-lg cursor-grab active:cursor-grabbing flex-shrink-0"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 图标 */}
          <span className="flex-shrink-0 text-emerald-400">{icon}</span>
          {/* 标题 */}
          <div id={titleId} className="text-sm font-semibold text-gray-200 flex-shrink-0">{title}</div>
          {/* 额外内容 */}
          {headerExtra && <div className="min-w-0 flex-1">{headerExtra}</div>}
        </div>
        {/* 关闭按钮 */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={closeButtonLabel}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-editor-hover flex-shrink-0 ml-2"
          title="关闭"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>

      {/* 底部操作栏 */}
      {footer && (
        <div className="flex items-center justify-between pl-4 pr-7 py-2 border-t border-editor-border bg-editor-sidebar flex-shrink-0">
          {footer}
        </div>
      )}

      {/* 右侧调整宽度手柄 */}
      {showWidthHandle && (
        <div
          className="absolute top-0 right-0 w-4 h-full z-10 flex items-center justify-end p-0.5 pointer-events-none"
        >
          <div
            className="w-2 h-8 cursor-ew-resize bg-gray-600 rounded-full opacity-0 transition-opacity hover:opacity-50 pointer-events-auto"
            onMouseDown={(e) => handleResizeMouseDown(e, 'width')}
          />
        </div>
      )}

      {/* 底部调整高度手柄 */}
      {showHeightHandle && (
        <div
          className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize z-10 group/resize-h"
          onMouseDown={(e) => handleResizeMouseDown(e, 'height')}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-12 bg-gray-600 rounded-full opacity-0 group-hover/resize-h:opacity-50 transition-opacity" />
        </div>
      )}

      {/* 右下角同时调整宽高手柄 */}
      {showBothHandle && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 group/resize-both"
          onMouseDown={(e) => handleResizeMouseDown(e, 'both')}
        >
          <svg
            className="w-3 h-3 text-gray-600 opacity-0 group-hover/resize-both:opacity-70 transition-opacity absolute bottom-0.5 right-0.5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
          </svg>
        </div>
      )}
    </div>
  );
};

// 导出常用图标，方便复用
export const PanelIcons = {
  /** 搜索图标 */
  Search: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  /** 链接图标 */
  Link: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
  /** 代码图标 */
  Code: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  /** 设置图标 */
  Settings: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};
