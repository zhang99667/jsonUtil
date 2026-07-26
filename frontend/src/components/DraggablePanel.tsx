import React, { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { CodeOutlined, LinkOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { Rnd, type DraggableData, type RndResizeCallback } from 'react-rnd';
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
  /** 标题图标 */
  icon: ReactNode;
  /** 头部额外内容（如路径标签），显示在标题后、关闭按钮前 */
  headerExtra?: ReactNode;
  /** 浏览器本地存储键前缀 */
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
  /** 额外样式类名 */
  className?: string;
  /** 引导定位属性 */
  dataTour?: string;
}

const DEFAULT_POSITION = { x: 100, y: 100 };
const DEFAULT_SIZE = { width: 600, height: 400 };
const DEFAULT_MIN_SIZE = { width: 300, height: 200 };
const MIN_VISIBLE_PANEL_EDGE = 80;
const VIEWPORT_PADDING = 24;
const DRAG_HANDLE_CLASS = 'draggable-panel-drag-handle';
const NO_DRAG_CLASS = 'draggable-panel-no-drag';

const RESIZE_HANDLE_COMPONENTS = {
  right: (
    <div className="flex h-full w-4 items-center justify-end p-0.5">
      <div className="h-8 w-2 rounded-full bg-gray-600 opacity-0 transition-opacity hover:opacity-50" />
    </div>
  ),
  bottom: (
    <div className="group/resize-h relative h-2 w-full">
      <div className="absolute bottom-0 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-gray-600 opacity-0 transition-opacity group-hover/resize-h:opacity-50" />
    </div>
  ),
  bottomRight: (
    <svg
      className="h-3 w-3 text-gray-600 opacity-0 transition-opacity group-hover/resize-both:opacity-70"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" />
    </svg>
  ),
};

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

const getMaxPanelSize = (minSize: PanelSize, viewport: ViewportSize): PanelSize => ({
  width: Math.max(minSize.width, viewport.width - VIEWPORT_PADDING),
  height: Math.max(minSize.height, viewport.height - VIEWPORT_PADDING),
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

  // 退出键仅在焦点位于面板内时关闭面板
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

  // 保存位置到浏览器本地存储
  useEffect(() => {
    safeSetStorageItem(`${storageKey}-position`, JSON.stringify(position));
  }, [position, storageKey]);

  // 保存大小到浏览器本地存储
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

  // 配置备份导入后，从浏览器本地存储重新读取布局并夹取到当前视口
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

  const handleDragStop = (_event: unknown, data: DraggableData) => {
    setPosition(normalizePanelPosition(data, size, getViewportSize()));
  };

  const handleResizeStop: RndResizeCallback = (
    _event,
    _direction,
    element,
    _delta,
    nextPosition
  ) => {
    const viewport = getViewportSize();
    const nextSize = normalizePanelSize({
      width: element.offsetWidth,
      height: element.offsetHeight,
    }, minSize, viewport);
    setSize(nextSize);
    setPosition(normalizePanelPosition(nextPosition, nextSize, viewport));
  };

  // 早期返回必须位于所有状态钩子之后
  if (!isOpen) return null;

  const showWidthHandle = resizeDirections.includes('width');
  const showHeightHandle = resizeDirections.includes('height');
  const showBothHandle = resizeDirections.includes('both');
  const maxSize = getMaxPanelSize(minSize, getViewportSize());

  return (
    <Rnd
      size={size}
      position={position}
      minWidth={minSize.width}
      minHeight={minSize.height}
      maxWidth={maxSize.width}
      maxHeight={maxSize.height}
      dragHandleClassName={DRAG_HANDLE_CLASS}
      cancel={`.${NO_DRAG_CLASS}`}
      enableResizing={{
        right: showWidthHandle,
        bottom: showHeightHandle,
        bottomRight: showBothHandle,
      }}
      resizeHandleComponent={RESIZE_HANDLE_COMPONENTS}
      resizeHandleClasses={{
        right: 'z-10',
        bottom: 'z-10',
        bottomRight: 'group/resize-both z-20 flex items-end justify-end pb-0.5 pr-0.5',
      }}
      data-tour={dataTour}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      className={`fixed bg-editor-sidebar border border-editor-border rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden ${className}`}
      style={{ position: 'fixed' }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : titleId}
        className="flex h-full flex-col overflow-hidden"
      >
        <div
          className={`${DRAG_HANDLE_CLASS} flex flex-shrink-0 cursor-grab items-center justify-between rounded-t-lg border-b border-editor-border bg-editor-sidebar px-4 py-2 active:cursor-grabbing`}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex-shrink-0 text-emerald-400">{icon}</span>
            <div id={titleId} className="flex-shrink-0 text-sm font-semibold text-gray-200">{title}</div>
            {headerExtra && <div className="min-w-0 flex-1">{headerExtra}</div>}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={closeButtonLabel}
            className={`${NO_DRAG_CLASS} ml-2 flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-editor-hover hover:text-white`}
            title="关闭"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>

        {footer && (
          <div className="flex flex-shrink-0 items-center justify-between border-t border-editor-border bg-editor-sidebar py-2 pl-4 pr-7">
            {footer}
          </div>
        )}
      </div>
    </Rnd>
  );
};

export const PanelIcons = {
  Search: <SearchOutlined className="text-base" />,
  Link: <LinkOutlined className="text-base" />,
  Code: <CodeOutlined className="text-base" />,
  Settings: <SettingOutlined className="text-base" />,
};
