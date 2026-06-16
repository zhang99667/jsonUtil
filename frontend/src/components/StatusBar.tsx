import React from 'react';
import { TransformMode, FileTab, ValidationResult } from '../types';
import { APP_VERSION_LABEL } from '../utils/appVersion';
import { formatByteSize } from '../utils/documentStats';
import type { StandaloneDeepFormatInputKind } from '../utils/transformations';

interface SourceValidationLocation {
  line: number;
  column: number;
}

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
  [TransformMode.URL_ENCODE]: 'URL 编码',
  [TransformMode.URL_DECODE]: 'URL 解码',
  [TransformMode.BASE64_ENCODE]: 'Base64 编码',
  [TransformMode.BASE64_DECODE]: 'Base64 解码',
  [TransformMode.SORT_KEYS]: 'Key 排序',
};

/** StatusBar 组件 Props 定义 */
interface StatusBarProps {
  /** SOURCE 内容长度，用于判断草稿保存状态 */
  inputLength: number;
  /** 当前聚焦内容长度 */
  activeContentLength: number;
  /** 当前聚焦内容的 UTF-8 字节数 */
  activeContentByteLength: number;
  /** 文档总行数 */
  totalLines: number;
  /** 文档最大列数 */
  maxColumns: number;
  /** 行列统计是否为大文件采样结果 */
  isStatsLimited: boolean;
  /** 当前转换模式 */
  mode: TransformMode;
  /** 当前激活的文件 ID */
  activeFileId: string | null;
  /** 文件标签列表（用于获取文件名） */
  files: FileTab[];
  /** 自动保存是否开启 */
  isAutoSaveEnabled: boolean;
  /** SOURCE 是否有非空内容 */
  hasSourceContent: boolean;
  /** SOURCE 是否进入 JSON 容器校验 */
  isSourceJsonCandidate: boolean;
  /** SOURCE 独立深度解析输入类型 */
  sourceStandaloneDeepFormatKind: StandaloneDeepFormatInputKind | null;
  /** 打开 SOURCE 独立 Scheme/编码 JSON 到解析面板 */
  onOpenSourceSchemeInput?: () => void;
  /** SOURCE JSON 校验结果 */
  sourceValidation: ValidationResult;
  /** SOURCE JSON 错误定位 */
  sourceValidationLocation: SourceValidationLocation | null;
  /** 定位 SOURCE JSON 错误 */
  onLocateSourceError?: () => void;
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
  activeContentLength,
  activeContentByteLength,
  totalLines,
  maxColumns,
  isStatsLimited,
  mode,
  activeFileId,
  files,
  isAutoSaveEnabled,
  hasSourceContent,
  isSourceJsonCandidate,
  sourceStandaloneDeepFormatKind,
  onOpenSourceSchemeInput,
  sourceValidation,
  sourceValidationLocation,
  onLocateSourceError,
  cursorLine,
  cursorColumn,
}) => {
  // 查找当前激活的文件
  const activeFile = activeFileId ? files.find(f => f.id === activeFileId) : null;
  const isSavedFile = Boolean(activeFile?.handle);
  const byteSizeText = `${isStatsLimited ? '≥' : ''}${formatByteSize(activeContentByteLength)}`;
  const saveStatus = (() => {
    if (!activeFile) {
      return inputLength > 0
        ? { label: '草稿未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前内容还没有保存为文件' }
        : { label: '空白草稿', className: 'bg-white/15 text-white', title: '当前没有打开文件' };
    }

    if (!isSavedFile) {
      return activeFile.isDirty
        ? { label: '未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前标签尚未保存到文件' }
        : { label: '未保存标签', className: 'bg-white/15 text-white', title: '当前标签尚未绑定本地文件' };
    }

    if (activeFile.isDirty) {
      return isAutoSaveEnabled
        ? { label: '等待自动保存', className: 'bg-yellow-100 text-yellow-800', title: '自动保存会在编辑停止后写入文件' }
        : { label: '未保存', className: 'bg-yellow-100 text-yellow-800', title: '当前文件有未保存修改' };
    }

    return isAutoSaveEnabled
      ? { label: '自动保存已同步', className: 'bg-green-100 text-green-800', title: '当前文件修改已自动同步' }
      : { label: '已保存', className: 'bg-white text-brand-primary', title: '当前文件没有未保存修改' };
  })();
  const sourceValidationStatus = (() => {
    if (!hasSourceContent) {
      return {
        label: 'SOURCE 空',
        className: 'bg-white/15 text-white',
        title: 'SOURCE 为空，输入 JSON 后会展示校验状态',
      };
    }

    if (!isSourceJsonCandidate) {
      if (sourceStandaloneDeepFormatKind) {
        if (sourceStandaloneDeepFormatKind === 'url-encoded-json') {
          return {
            label: 'SOURCE 编码JSON',
            className: 'bg-blue-100 text-blue-800',
            title: '当前 SOURCE 是 URL 编码 JSON，已按深度解析处理',
          };
        }

        if (sourceStandaloneDeepFormatKind === 'url-encoded-scheme') {
          return {
            label: 'SOURCE 编码Scheme',
            className: 'bg-blue-100 text-blue-800',
            title: '当前 SOURCE 是 URL 编码 CMD/Scheme，已按深度解析处理',
          };
        }

        return {
          label: 'SOURCE Scheme',
          className: 'bg-blue-100 text-blue-800',
          title: '当前 SOURCE 是可直接解析的 CMD/Scheme，已按深度解析处理',
        };
      }

      return {
        label: 'SOURCE 文本',
        className: 'bg-white/15 text-white',
        title: '当前 SOURCE 不以 { 或 [ 开头，按普通文本处理',
      };
    }

    if (sourceValidation.isValid) {
      return {
        label: 'JSON 有效',
        className: 'bg-green-100 text-green-800',
        title: 'SOURCE JSON / JSON Lines 校验通过',
      };
    }

    const locationText = sourceValidationLocation
      ? ` L${sourceValidationLocation.line}:C${sourceValidationLocation.column}`
      : '';

    return {
      label: `JSON 无效${locationText}`,
      className: 'bg-red-100 text-red-800',
      title: sourceValidation.error ? `SOURCE JSON 无效: ${sourceValidation.error}` : 'SOURCE JSON 无效',
    };
  })();
  const canLocateSourceError = Boolean(!sourceValidation.isValid && sourceValidationLocation && onLocateSourceError);
  const canOpenSourceSchemeInput = Boolean(sourceStandaloneDeepFormatKind && onOpenSourceSchemeInput);

  return (
    <div
      data-tour="statusbar"
      className="h-6 bg-brand-primary flex items-center justify-between gap-2 overflow-hidden px-3 text-[11px] text-white select-none z-20 flex-shrink-0"
    >
      {/* 左侧：编码、长度、行列、文件名 */}
      <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
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
        {activeFile && (
          <span
            className="flex min-w-[4rem] max-w-[16rem] items-center gap-1 text-blue-200"
            title={activeFile.path || activeFile.name}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">{activeFile.name}</span>
          </span>
        )}
        <span
          data-tour="save-status"
          className={`shrink-0 px-1.5 py-0.5 rounded font-bold leading-none ${saveStatus.className}`}
          title={saveStatus.title}
        >
          {saveStatus.label}
        </span>
        {canLocateSourceError ? (
          <button
            data-tour="source-validation-status"
            type="button"
            aria-live="polite"
            onClick={onLocateSourceError}
            className={`shrink-0 px-1.5 py-0.5 rounded font-bold leading-none transition-colors hover:ring-1 hover:ring-white/70 focus:outline-none focus:ring-1 focus:ring-white ${sourceValidationStatus.className}`}
            title={`${sourceValidationStatus.title}，点击定位`}
          >
            {sourceValidationStatus.label}
          </button>
        ) : canOpenSourceSchemeInput ? (
          <button
            data-tour="source-validation-status"
            type="button"
            aria-live="polite"
            onClick={onOpenSourceSchemeInput}
            className={`shrink-0 px-1.5 py-0.5 rounded font-bold leading-none transition-colors hover:ring-1 hover:ring-white/70 focus:outline-none focus:ring-1 focus:ring-white ${sourceValidationStatus.className}`}
            title={`${sourceValidationStatus.title}，点击打开 Scheme 面板`}
          >
            {sourceValidationStatus.label}
          </button>
        ) : (
          <span
            data-tour="source-validation-status"
            aria-live="polite"
            className={`shrink-0 px-1.5 py-0.5 rounded font-bold leading-none ${sourceValidationStatus.className}`}
            title={sourceValidationStatus.title}
          >
            {sourceValidationStatus.label}
          </span>
        )}
      </div>

      {/* 右侧：当前视图模式与版本号 */}
      <div data-tour="statusbar-view" className="flex shrink-0 items-center gap-2">
        <span className="shrink-0 opacity-80">当前视图:</span>
        <span className="bg-white text-brand-primary px-1.5 py-0.5 rounded font-bold text-[11px] shadow-sm leading-none">
          {MODE_LABELS[mode]}
        </span>
        {mode === TransformMode.DEEP_FORMAT && (
          <span className="opacity-70 text-[10px] ml-1">
            · 自动展开多层嵌套的 JSON 字符串
          </span>
        )}
        <span
          data-tour="statusbar-version"
          className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-blue-100"
          title="当前版本"
        >
          {APP_VERSION_LABEL}
        </span>
      </div>
    </div>
  );
};
