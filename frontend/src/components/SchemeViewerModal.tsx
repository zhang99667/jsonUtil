import React, { useDeferredValue, useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { 
  buildSchemePlaceholderGroups,
  deepDecodeScheme, 
  encodeWithLayers, 
  SchemeDecodeResult,
  SchemeType 
} from '../utils/schemeUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { copyText } from '../utils/clipboard';
import {
  extractBase64MetaInfo,
  extractSchemeCommandSummaryInfo,
  formatSchemeInsightItems,
  formatBase64MetaDisplayValue,
  formatCmdHandlerCompatibleResult,
  type Base64MetaInfo,
  type SchemeCommandSummaryInfo,
} from '../utils/schemeMetadata';

const ASYNC_SCHEME_DECODE_THRESHOLD = 50_000;

interface SchemeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  path?: string;           // JSON Path，如 "$.action_cmd"（独立模式下可选）
  value?: string;          // 原始 scheme 字符串（独立模式下可选）
  sourceLabel?: string;    // 来源业务标签，如 extraParam
  onApply?: (newValue: string) => void;  // 应用修改后的值
  standalone?: boolean;    // 是否为独立模式（侧边栏打开，可手动输入）
  initialStandaloneInput?: string; // 独立模式下从外部入口预填的内容
  initialStandaloneInputKey?: number; // 用于同一内容重复打开时触发重新预填
}

const schemeTypeLabels: Record<SchemeType, string> = {
  'url': 'URL',
  'query-string': 'CMD 参数',
  'url-encoded': 'URL 编码',
  'base64': 'Base64',
  'jwt': 'JWT Token',
  'json': 'JSON',
  'plain': '纯文本',
};

type SchemeParams = NonNullable<SchemeDecodeResult['schemeInfo']>['params'];

interface SchemeParamSection {
  title: string;
  params: SchemeParams;
}

interface SchemeDecodeWorkerResponse {
  id: number;
  result?: SchemeDecodeResult;
  metadata?: SchemeDecodeWorkerMetadata;
  error?: string;
}

interface SchemeDecodeWorkerMetadata {
  base64MetaInfo: Base64MetaInfo | null;
  commandSummaryInfo: SchemeCommandSummaryInfo | null;
}

interface SchemeDecodeWorkerState {
  source: string;
  result: SchemeDecodeResult | null;
  metadata: SchemeDecodeWorkerMetadata | null;
}

const createEmptyDecodeResult = (original = ''): SchemeDecodeResult => ({
  original,
  decoded: '',
  layers: [],
  isJson: false,
});

const buildSchemePanelMetadata = (result: SchemeDecodeResult): SchemeDecodeWorkerMetadata => ({
  base64MetaInfo: extractBase64MetaInfo(result.decoded, result.isJson),
  commandSummaryInfo: extractSchemeCommandSummaryInfo(
    result.decoded,
    result.isJson,
    result.schemeInfo,
    { includeCommandFieldRows: false }
  ),
});

const getParamCount = (params: SchemeParams): number => {
  if (!params) return 0;

  return Object.values(params).reduce((count, value) => (
    count + (Array.isArray(value) ? value.length : 1)
  ), 0);
};

const formatTextPreview = (value: string, maxLength: number): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

const formatJoinedValuePreview = (values: string[], maxLength: number): string => {
  let preview = '';

  for (const value of values) {
    const nextPreview = preview ? `${preview}, ${value}` : value;
    if (nextPreview.length > maxLength) {
      return `${nextPreview.slice(0, maxLength)}...`;
    }
    preview = nextPreview;
  }

  return preview;
};

const formatParamValue = (value: string | string[]): string => (
  Array.isArray(value)
    ? formatJoinedValuePreview(value, 48)
    : formatTextPreview(value, 48)
);

const formatPlaceholderValue = (value: string): string => (
  formatTextPreview(value, 32)
);

const formatSummaryValue = (value: string, maxLength = 56): string => (
  formatTextPreview(value, maxLength)
);

const formatTooltipValue = (value: string, maxLength = 160): string => (
  formatTextPreview(value, maxLength)
);

const formatParamTooltipValue = (value: string | string[]): string => (
  Array.isArray(value)
    ? formatJoinedValuePreview(value, 160)
    : formatTooltipValue(value)
);

const MAX_SCHEME_PATH_VALUE_COPY_ROWS = 500;

interface SchemePathValueCollectState {
  rows: string[];
  limit: number;
  isTruncated: boolean;
}

const formatJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const formatJsonPathValue = (value: unknown): string => {
  if (typeof value === 'string') return JSON.stringify(value);
  return JSON.stringify(value) ?? String(value);
};

const pushSchemePathValueRow = (
  state: SchemePathValueCollectState,
  path: string,
  value: unknown
) => {
  if (state.rows.length >= state.limit) {
    state.isTruncated = true;
    return;
  }

  state.rows.push(`${path} = ${formatJsonPathValue(value)}`);
};

const collectSchemePathValues = (
  value: unknown,
  path: string,
  state: SchemePathValueCollectState
) => {
  if (state.isTruncated) return;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      pushSchemePathValueRow(state, path, value);
      return;
    }

    for (let index = 0; index < value.length; index++) {
      collectSchemePathValues(value[index], `${path}[${index}]`, state);
      if (state.isTruncated) return;
    }
    return;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      pushSchemePathValueRow(state, path, value);
      return;
    }

    for (const [key, item] of entries) {
      collectSchemePathValues(item, formatJsonPathKey(path, key), state);
      if (state.isTruncated) return;
    }
    return;
  }

  pushSchemePathValueRow(state, path, value);
};

const formatSchemePathValuesForCopy = (content: string): string => {
  try {
    const parsed: unknown = JSON.parse(content);
    const state: SchemePathValueCollectState = {
      rows: [],
      limit: MAX_SCHEME_PATH_VALUE_COPY_ROWS,
      isTruncated: false,
    };

    collectSchemePathValues(parsed, '$', state);
    return [
      ...state.rows,
      ...(state.isTruncated ? ['... 还有更多路径未复制'] : []),
    ].join('\n');
  } catch {
    return '';
  }
};

const buildParamSections = (
  schemeInfo: SchemeDecodeResult['schemeInfo']
): SchemeParamSection[] => {
  if (!schemeInfo) return [];

  return [
    { title: 'Query 参数', params: schemeInfo.params },
    { title: 'Hash 参数', params: schemeInfo.hashParams },
  ].filter(section => getParamCount(section.params) > 0);
};

const getParamEntries = (params: SchemeParams): Array<[string, string | string[]]> => (
  Object.entries(params || {}) as Array<[string, string | string[]]>
);

export const SchemeViewerModal: React.FC<SchemeViewerModalProps> = ({
  isOpen,
  onClose,
  path,
  value,
  sourceLabel,
  onApply,
  standalone = false,
  initialStandaloneInput,
  initialStandaloneInputKey,
}) => {
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  // 独立模式下的输入值
  const [standaloneInput, setStandaloneInput] = useState<string>('');
  const [workerDecodeState, setWorkerDecodeState] = useState<SchemeDecodeWorkerState>({
    source: '',
    result: null,
    metadata: null,
  });

  // 二维码状态
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeType, setQRCodeType] = useState<'original' | 'decoded'>('original');
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  
  // 实际使用的原始值：独立模式用输入值，否则用 prop 传入的值
  const actualValue = standalone ? standaloneInput : (value || '');
  const deferredActualValue = useDeferredValue(actualValue);
  // 大 response 粘贴后先保证输入响应，解析结果用低优先级值追赶。
  const decodeSourceValue = actualValue ? deferredActualValue : '';
  const shouldDecodeInWorker = decodeSourceValue.length >= ASYNC_SCHEME_DECODE_THRESHOLD;
  const hasFreshWorkerDecodeResult = Boolean(
    shouldDecodeInWorker &&
    workerDecodeState.source === decodeSourceValue &&
    workerDecodeState.result
  );
  const freshWorkerDecodeMetadata = hasFreshWorkerDecodeResult
    ? workerDecodeState.metadata
    : null;
  const isDecodePending = Boolean(
    actualValue && deferredActualValue !== actualValue
  ) || (shouldDecodeInWorker && !hasFreshWorkerDecodeResult);

  // 自定义滚动条 Hook
  const {
    scrollContainerRef,
    handleScroll,
    handleMouseDown: handleScrollbarMouseDown,
    thumbSize: thumbHeight,
    thumbOffset: thumbTop,
    showScrollbar,
  } = useCustomScrollbar('vertical', actualValue);

  // 解析 scheme（添加空值保护）
  const decodeResult = useMemo<SchemeDecodeResult>(() => {
    if (!decodeSourceValue) {
      return createEmptyDecodeResult();
    }

    if (shouldDecodeInWorker) {
      return hasFreshWorkerDecodeResult && workerDecodeState.result
        ? workerDecodeState.result
        : createEmptyDecodeResult(decodeSourceValue);
    }

    return deepDecodeScheme(decodeSourceValue);
  }, [decodeSourceValue, hasFreshWorkerDecodeResult, shouldDecodeInWorker, workerDecodeState.result]);

  useEffect(() => {
    if (!decodeSourceValue || !shouldDecodeInWorker) {
      setWorkerDecodeState(current => (
        current.source || current.result || current.metadata ? { source: '', result: null, metadata: null } : current
      ));
      return;
    }

    let isCancelled = false;
    const worker = new Worker(new URL('../workers/schemeDecode.worker.ts', import.meta.url), { type: 'module' });
    setWorkerDecodeState({ source: decodeSourceValue, result: null, metadata: null });

    worker.onmessage = (event: MessageEvent<SchemeDecodeWorkerResponse>) => {
      worker.terminate();
      if (isCancelled) return;

      if (event.data.error || !event.data.result) {
        console.warn('大 Response Scheme 解码 Worker 处理失败:', event.data.error);
        const fallbackResult = deepDecodeScheme(decodeSourceValue);
        setWorkerDecodeState({
          source: decodeSourceValue,
          result: fallbackResult,
          metadata: buildSchemePanelMetadata(fallbackResult),
        });
        return;
      }

      setWorkerDecodeState({
        source: decodeSourceValue,
        result: event.data.result,
        metadata: event.data.metadata || buildSchemePanelMetadata(event.data.result),
      });
    };
    worker.onerror = (event) => {
      worker.terminate();
      if (isCancelled) return;

      console.warn('大 Response Scheme 解码 Worker 运行失败:', event.message);
      const fallbackResult = deepDecodeScheme(decodeSourceValue);
      setWorkerDecodeState({
        source: decodeSourceValue,
        result: fallbackResult,
        metadata: buildSchemePanelMetadata(fallbackResult),
      });
    };
    worker.postMessage({ id: 1, input: decodeSourceValue });

    return () => {
      isCancelled = true;
      worker.terminate();
    };
  }, [decodeSourceValue, shouldDecodeInWorker]);

  // 初始化编辑内容
  useEffect(() => {
    setEditedContent(decodeResult.decoded);
    setIsEditing(false);
  }, [decodeResult.decoded]);

  // 独立模式从外部入口打开时，预填待排查内容。
  useEffect(() => {
    if (isOpen && standalone && initialStandaloneInput !== undefined) {
      setStandaloneInput(initialStandaloneInput);
    }
  }, [initialStandaloneInput, initialStandaloneInputKey, isOpen, standalone]);

  const handleCopy = async () => {
    try {
      await copyText(editedContent);
      toast.success('已复制解码结果', { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 解码结果失败:', err);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  const handleCopyPathValues = async () => {
    if (!canCopyPathValues) return;

    const pathValueCopyText = formatSchemePathValuesForCopy(editedContent);
    if (!pathValueCopyText) return;

    try {
      await copyText(pathValueCopyText);
      toast.success('已复制路径和值', { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 路径和值失败:', err);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  const handleCopyOriginal = async () => {
    try {
      await copyText(actualValue);
      toast.success('已复制原始值', { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 原始值失败:', err);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  const handleCopyPath = async () => {
    if (!path) return;

    try {
      await copyText(path);
      toast.success('已复制路径', { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 来源路径失败:', err);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  // JSON 解码结果被编辑后需要重新校验，避免非法内容写回原始字段。
  const editedJsonError = useMemo(() => {
    if (!decodeResult.isJson) return '';
    if (!editedContent.trim()) return 'JSON 内容不能为空';

    try {
      JSON.parse(editedContent);
      return '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `JSON 内容格式有误: ${message}`;
    }
  }, [decodeResult.isJson, editedContent]);
  const hasNonReversibleLayer = useMemo(() => (
    decodeResult.layers.some(layer => layer.reversible === false)
  ), [decodeResult.layers]);
  const canApplyEdit = Boolean(onApply && isEditing && !isDecodePending && !editedJsonError && !hasNonReversibleLayer);
  const serializedContent = useMemo(() => {
    if (isDecodePending || !actualValue || !editedContent || editedJsonError || hasNonReversibleLayer || decodeResult.layers.length === 0) {
      return '';
    }

    return encodeWithLayers(editedContent, decodeResult.layers);
  }, [actualValue, decodeResult.layers, editedContent, editedJsonError, hasNonReversibleLayer, isDecodePending]);
  const canCopyPathValues = Boolean(decodeResult.isJson && !isDecodePending && !editedJsonError);

  const handleCopySerialized = async () => {
    if (!serializedContent) return;

    try {
      await copyText(serializedContent);
      toast.success('已复制序列化结果', { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 序列化结果失败:', err);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  const handleApply = () => {
    if (editedJsonError) {
      toast.error('请先修正解码结果中的 JSON 错误', { duration: 2000 });
      return;
    }

    if (hasNonReversibleLayer) {
      toast.error('当前编码层不可逆，仅支持查看和复制', { duration: 2000 });
      return;
    }

    if (onApply) {
      // 将编辑后的内容按原编码层级重新编码
      const encoded = encodeWithLayers(editedContent, decodeResult.layers);
      onApply(encoded);
    }
    onClose();
  };

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setIsEditing(true);
  };

  // 下载二维码
  const handleDownloadQRCode = () => {
    const canvas = qrCodeRef.current;
    if (!canvas) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `scheme-qrcode-${qrCodeType}.png`;
    link.href = url;
    link.click();
  };

  // 获取二维码内容
  const qrCodeContent = useMemo(() => {
    if (qrCodeType === 'decoded' && isDecodePending) return '';
    return qrCodeType === 'original' ? actualValue : editedContent;
  }, [actualValue, editedContent, isDecodePending, qrCodeType]);

  // 检查内容是否适合生成二维码（不超过约2953字符）
  const isQRCodeValid = useMemo(() => {
    return qrCodeContent && qrCodeContent.length > 0 && qrCodeContent.length <= 2953;
  }, [qrCodeContent]);
  
  // 自动检测语言
  const editorLanguage = useMemo(() => {
    if (decodeResult.isJson) return 'json';
    // 尝试检测其他格式
    const trimmed = editedContent.trim();
    if (trimmed.startsWith('<')) return 'xml';
    return 'plaintext';
  }, [decodeResult.isJson, editedContent]);

  const paramSections = useMemo(() => (
    buildParamSections(decodeResult.schemeInfo)
  ), [decodeResult.schemeInfo]);
  const placeholders = decodeResult.placeholders || [];
  const decodeWarnings = decodeResult.warnings || [];
  const placeholderGroups = useMemo(() => (
    buildSchemePlaceholderGroups(placeholders)
  ), [placeholders]);
  const base64MetaInfo = useMemo(() => (
    freshWorkerDecodeMetadata
      ? freshWorkerDecodeMetadata.base64MetaInfo
      : extractBase64MetaInfo(decodeResult.decoded, decodeResult.isJson)
  ), [decodeResult.decoded, decodeResult.isJson, freshWorkerDecodeMetadata]);
  const commandSummaryInfo = useMemo(() => (
    freshWorkerDecodeMetadata
      ? freshWorkerDecodeMetadata.commandSummaryInfo
      : extractSchemeCommandSummaryInfo(
          decodeResult.decoded,
          decodeResult.isJson,
          decodeResult.schemeInfo
        )
  ), [decodeResult.decoded, decodeResult.isJson, decodeResult.schemeInfo, freshWorkerDecodeMetadata]);
  const canCopyCmdHandlerCompatibleResult = Boolean(
    commandSummaryInfo && decodeResult.isJson && !isDecodePending && !editedJsonError
  );
  const nestedCommandInsight = commandSummaryInfo
    ? formatSchemeInsightItems('cmd解析', commandSummaryInfo.commandFields)
    : undefined;
  const extInsight = commandSummaryInfo
    ? formatSchemeInsightItems('ext解析', commandSummaryInfo.extFields)
    : undefined;
  const base64SuffixInsight = commandSummaryInfo
    ? formatSchemeInsightItems('Base64 后缀', commandSummaryInfo.base64SuffixFields, 6)
    : undefined;

  const handleCopyCmdHandlerCompatibleResult = async () => {
    if (!canCopyCmdHandlerCompatibleResult) return;

    const cmdHandlerCompatibleCopyText = formatCmdHandlerCompatibleResult(
      editedContent,
      commandSummaryInfo?.commandSchema,
      actualValue
    );
    if (!cmdHandlerCompatibleCopyText) return;

    try {
      await copyText(cmdHandlerCompatibleCopyText);
      toast.success('已复制 CMD 结构', { duration: 2000 });
    } catch (err) {
      console.warn('复制 CMD 结构失败:', err);
      toast.error('复制失败', { duration: 2000 });
    }
  };

  // 头部额外内容：非独立模式显示 path 标签，并支持复制到 JSONPath 面板继续定位
  const headerExtra = !standalone && path ? (
    <div className="flex min-w-0 items-center gap-1.5">
      {sourceLabel && (
        <span
          data-tour="scheme-source-label"
          className="max-w-[120px] shrink-0 truncate rounded bg-cyan-900/40 px-2 py-0.5 text-xs text-cyan-200"
          title={sourceLabel}
        >
          {sourceLabel}
        </span>
      )}
      <span
        data-tour="scheme-source-path"
        className="min-w-0 max-w-[200px] truncate rounded bg-editor-active px-2 py-0.5 font-mono text-xs text-gray-400"
        title={path}
      >
        {path}
      </span>
      <button
        data-tour="scheme-copy-path"
        type="button"
        onClick={handleCopyPath}
        className="shrink-0 rounded bg-editor-active px-2 py-0.5 text-xs text-gray-300 transition-colors hover:bg-editor-border hover:text-white"
        title="复制路径"
      >
        复制路径
      </button>
    </div>
  ) : null;
  const decodeStatusText = (() => {
    if (isDecodePending) return '解析中...';
    if (decodeResult.layers.length > 0) return `${decodeResult.layers.length} 层解码`;
    return actualValue ? '无需解码' : '请输入待解码内容';
  })();

  // 底部操作栏
  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div className="shrink-0 text-xs text-gray-500">
        {decodeStatusText}
      </div>
      <div data-tour="scheme-footer-actions" className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
        <button
          onClick={onClose}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors"
        >
          关闭
        </button>
        <button
          onClick={() => setShowQRCode(!showQRCode)}
          disabled={!actualValue}
          className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            showQRCode 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-editor-active text-gray-200 hover:bg-editor-border'
          }`}
          title="生成二维码"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          二维码
        </button>
        <button
          onClick={handleCopyOriginal}
          disabled={!actualValue}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          复制原始值
        </button>
        <button
          onClick={handleCopy}
          disabled={!editedContent || isDecodePending}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          复制解码结果
        </button>
        {commandSummaryInfo && (
          <button
            data-tour="scheme-copy-cmd-structure"
            onClick={handleCopyCmdHandlerCompatibleResult}
            disabled={!canCopyCmdHandlerCompatibleResult}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
            复制 CMD 结构
          </button>
        )}
        {decodeResult.isJson && (
          <button
            data-tour="scheme-copy-path-values"
            onClick={handleCopyPathValues}
            disabled={!canCopyPathValues}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title="复制解码 JSON 中的路径和值"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
            </svg>
            复制路径和值
          </button>
        )}
        {standalone && decodeResult.layers.length > 0 && (
          <button
            data-tour="scheme-copy-serialized"
            onClick={handleCopySerialized}
            disabled={!serializedContent}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title={serializedContent ? '复制当前编辑内容重新编码后的结果' : '请先确保解码结果合法且编码层可逆'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h10m0 0l-3-3m3 3l-3 3m9 7H10m0 0l3 3m-3-3l3-3" />
            </svg>
            复制序列化结果
          </button>
        )}
        {onApply && isEditing && (
          <button
            onClick={handleApply}
            disabled={!canApplyEdit}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            应用修改
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DraggablePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Scheme 解析"
      icon={PanelIcons.Link}
      headerExtra={headerExtra}
      storageKey="scheme-panel"
      defaultPosition={{ x: 150, y: 80 }}
      defaultSize={{ width: 600, height: 600 }}
      minSize={{ width: 450, height: 300 }}
      footer={footer}
      dataTour="scheme-panel"
    >
      {/* 内容区域 */}
      <div className="flex-1 flex flex-col min-h-0 relative group/content">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 flex flex-col p-2 gap-1.5 bg-editor-bg min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        >
          {/* 独立模式：输入区域 */}
          {standalone && (
            <div className="bg-editor-sidebar rounded p-3 border border-editor-border">
              <div className="text-xs text-gray-500 mb-2 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                输入原始值
              </div>
              <textarea
                data-tour="scheme-standalone-input"
                value={standaloneInput}
                onChange={(e) => setStandaloneInput(e.target.value)}
                placeholder="粘贴需要解码的内容..."
                className="w-full h-20 bg-editor-bg text-gray-200 text-sm px-3 py-2 rounded border border-editor-border focus:border-emerald-500 focus:outline-none font-mono resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">{standaloneInput.length} 字符</span>
                <button
                  onClick={() => setStandaloneInput('')}
                  disabled={!standaloneInput}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  清空
                </button>
              </div>
            </div>
          )}

          {/* 上方信息卡片区域 */}
          {(decodeResult.schemeInfo || commandSummaryInfo || decodeResult.layers.length > 0 || placeholders.length > 0 || decodeWarnings.length > 0 || base64MetaInfo) && (
            <div className="bg-editor-sidebar rounded p-3 border border-editor-border flex flex-col gap-2">
              {/* Scheme 信息 */}
              {decodeResult.schemeInfo && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Scheme:
                  </span>
                  <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded font-mono text-xs">
                    {decodeResult.schemeInfo.protocol}
                  </span>
                  {decodeResult.schemeInfo.host && (
                    <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded text-xs">{decodeResult.schemeInfo.host}</span>
                  )}
                  {decodeResult.schemeInfo.path && (
                    <span className="bg-editor-bg text-gray-400 px-2 py-0.5 rounded text-xs truncate max-w-[200px]" title={formatTooltipValue(decodeResult.schemeInfo.path)}>
                      {decodeResult.schemeInfo.path}
                    </span>
                  )}
                </div>
              )}

              {/* CMD 结构摘要 */}
              {commandSummaryInfo && (
                <div data-tour="scheme-command-summary" className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
                    CMD 结构
                  </span>
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {commandSummaryInfo.commandSchema && (
                      <span
                        className="bg-editor-bg text-cyan-200 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatTooltipValue(commandSummaryInfo.commandSchema)}
                      >
                        cmdSchema={formatSummaryValue(commandSummaryInfo.commandSchema)}
                      </span>
                    )}
                    {commandSummaryInfo.paramCount > 0 && (
                      <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono">
                        cmdParams · {commandSummaryInfo.paramCount}
                      </span>
                    )}
                    {commandSummaryInfo.paramKeys.slice(0, 6).map(key => (
                      <span
                        key={key}
                        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatTooltipValue(key, 80)}
                      >
                        {formatSummaryValue(key, 24)}
                      </span>
                    ))}
                    {commandSummaryInfo.paramKeys.length > 6 && (
                      <span className="text-gray-500 px-1 py-0.5">
                        +{commandSummaryInfo.paramKeys.length - 6}
                      </span>
                    )}
                    {nestedCommandInsight && (
                      <span className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate" title={nestedCommandInsight}>
                        {nestedCommandInsight}
                      </span>
                    )}
                    {extInsight && (
                      <span className="bg-editor-bg text-amber-200 px-2 py-0.5 rounded font-mono max-w-full truncate" title={extInsight}>
                        {extInsight}
                      </span>
                    )}
                    {base64SuffixInsight && (
                      <span className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate" title={base64SuffixInsight}>
                        {base64SuffixInsight}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 运行时占位符 */}
              {placeholders.length > 0 && (
                <div data-tour="scheme-runtime-placeholders" className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                      运行时占位符 · {placeholders.length}
                    </span>
                    <div data-tour="scheme-runtime-placeholder-groups" className="flex flex-wrap gap-1 min-w-0">
                      {placeholderGroups.map(group => (
                        <span
                          key={group.value}
                          className="bg-editor-bg text-amber-100 px-2 py-0.5 rounded font-mono max-w-full truncate"
                          title={`${group.description}\n${group.paths.slice(0, 8).join('\n')}`}
                        >
                          {group.value} ×{group.count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                      路径明细
                    </span>
                    <div className="flex flex-wrap gap-1 min-w-0">
                      {placeholders.slice(0, 6).map(placeholder => (
                        <span
                          key={`${placeholder.path}:${placeholder.value}`}
                          className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                          title={`${placeholder.path} = ${formatTooltipValue(placeholder.value)}\n${placeholder.description}`}
                        >
                          {placeholder.path}={formatPlaceholderValue(placeholder.value)}
                        </span>
                      ))}
                      {placeholders.length > 6 && (
                        <span className="text-gray-500 px-1 py-0.5">
                          +{placeholders.length - 6}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 性能护栏提示 */}
              {decodeWarnings.length > 0 && (
                <div data-tour="scheme-decode-warnings" className="flex flex-col gap-1.5 text-xs">
                  {decodeWarnings.map(warning => (
                    <div key={warning.type} className="flex items-start gap-2">
                      <span className="shrink-0 text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded">
                        性能保护 · 跳过 {warning.skippedCount}
                      </span>
                      <div className="flex flex-wrap gap-1 min-w-0">
                        <span className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded">
                          {warning.message}
                        </span>
                        {warning.paths.map(itemPath => (
                          <span
                            key={itemPath}
                            className="bg-editor-bg text-amber-100 px-2 py-0.5 rounded font-mono max-w-full truncate"
                            title={formatTooltipValue(itemPath)}
                          >
                            {itemPath}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 参数来源 */}
              {paramSections.length > 0 && (
                <div data-tour="scheme-param-sections" className="flex flex-col gap-1.5">
                  {paramSections.map(section => (
                    <div key={section.title} className="flex items-start gap-2 text-xs">
                      <span className="shrink-0 text-gray-500 bg-editor-bg px-2 py-0.5 rounded">
                        {section.title} · {getParamCount(section.params)}
                      </span>
                      <div className="flex flex-wrap gap-1 min-w-0">
                        {getParamEntries(section.params).slice(0, 6).map(([key, paramValue]) => (
                          <span
                            key={key}
                            className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                            title={`${key}=${formatParamTooltipValue(paramValue)}`}
                          >
                            {key}={formatParamValue(paramValue)}
                          </span>
                        ))}
                        {getParamEntries(section.params).length > 6 && (
                          <span className="text-gray-500 px-1 py-0.5">
                            +{getParamEntries(section.params).length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 内部 Base64 元信息 */}
              {base64MetaInfo && (
                <div data-tour="scheme-base64-meta" className="flex items-start gap-2 text-xs">
                  <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
                    内部 Base64
                  </span>
                  <div className="flex flex-wrap gap-1 min-w-0">
                    {base64MetaInfo.prefix && (
                      <span
                        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatTooltipValue(base64MetaInfo.prefix)}
                      >
                        头部={formatBase64MetaDisplayValue(base64MetaInfo.prefix, 24)}
                      </span>
                    )}
                    {base64MetaInfo.suffix && (
                      <span
                        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatTooltipValue(base64MetaInfo.suffix)}
                      >
                        后缀={formatBase64MetaDisplayValue(base64MetaInfo.suffix, 32)}
                      </span>
                    )}
                    {base64MetaInfo.suffixDecodePrefix && (
                      <span
                        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatTooltipValue(base64MetaInfo.suffixDecodePrefix)}
                      >
                        跳过={formatBase64MetaDisplayValue(base64MetaInfo.suffixDecodePrefix, 16)}
                      </span>
                    )}
                    {base64MetaInfo.suffixDecodedEntries.slice(0, 6).map(entry => (
                      <span
                        key={entry.key}
                        className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={`${entry.key}=${formatTooltipValue(entry.displayValue)}`}
                      >
                        {entry.key}={entry.displayValue}
                      </span>
                    ))}
                    {base64MetaInfo.suffixDecodedCount > 6 && (
                      <span className="text-gray-500 px-1 py-0.5">
                        +{base64MetaInfo.suffixDecodedCount - 6}
                      </span>
                    )}
                    {base64MetaInfo.suffix && (
                      <span className="text-gray-500 px-1 py-0.5">
                        {base64MetaInfo.suffixLength} 字符
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 解码层级 */}
              {decodeResult.layers.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    解码:
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">原始</span>
                  {decodeResult.layers.map((layer, index) => (
                    <React.Fragment key={index}>
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded text-xs font-medium">
                        {layer.description}
                      </span>
                    </React.Fragment>
                  ))}
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded font-medium">
                    {decodeResult.isJson ? 'JSON' : '文本'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 原始值预览（非独立模式下折叠显示） */}
          {!standalone && (
            <details className="bg-editor-sidebar rounded border border-editor-border">
              <summary className="px-3 py-2 text-xs text-gray-400 cursor-pointer hover:text-gray-300 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                原始值 <span className="text-gray-500 font-normal">({actualValue?.length || 0} 字符)</span>
              </summary>
              <div className="px-3 pb-2">
                <div className="bg-editor-bg rounded p-2 text-xs font-mono text-gray-400 break-all max-h-20 overflow-auto border border-editor-border">
                  {actualValue || '(空)'}
                </div>
              </div>
            </details>
          )}

          {/* 二维码区域 */}
          {showQRCode && (
            <div className="bg-editor-sidebar rounded p-3 border border-editor-border">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  二维码
                </div>
                <div className="flex items-center gap-2">
                  {/* 类型切换 */}
                  <div className="flex items-center bg-editor-bg rounded p-0.5 text-xs">
                    <button
                      onClick={() => setQRCodeType('original')}
                      className={`px-2 py-1 rounded transition-colors ${
                        qrCodeType === 'original' 
                          ? 'bg-editor-active text-white' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      原始值
                    </button>
                    <button
                      onClick={() => setQRCodeType('decoded')}
                      className={`px-2 py-1 rounded transition-colors ${
                        qrCodeType === 'decoded' 
                          ? 'bg-editor-active text-white' 
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      解码结果
                    </button>
                  </div>
                  {/* 下载按钮 */}
                  <button
                    onClick={handleDownloadQRCode}
                    disabled={!isQRCodeValid}
                    className="px-2 py-1 text-xs bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="下载二维码"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </button>
                </div>
              </div>
              
              {/* 二维码显示 */}
              <div className="flex flex-col items-center justify-center py-4 bg-white rounded">
                {isQRCodeValid ? (
                  <QRCodeCanvas
                    ref={qrCodeRef}
                    value={qrCodeContent}
                    size={200}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm">
                      {!qrCodeContent 
                        ? '无内容可生成二维码' 
                        : '内容过长，无法生成二维码（最大约 2953 字符）'
                      }
                    </p>
                    {qrCodeContent && (
                      <p className="text-xs mt-1">当前长度: {qrCodeContent.length} 字符</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* 内容长度提示 */}
              {isQRCodeValid && (
                <div className="text-xs text-gray-500 text-center mt-2">
                  {qrCodeType === 'original' ? '原始值' : '解码结果'}: {qrCodeContent.length} 字符
                </div>
              )}
            </div>
          )}

          {/* 解码结果（可编辑，使用 SimpleEditor） */}
          <div data-tour="scheme-result" className="bg-editor-sidebar rounded p-3 border border-editor-border flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                解码结果
                {isEditing && <span className="text-yellow-400 ml-2 font-normal">· 已修改</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono uppercase bg-editor-bg px-1.5 py-0.5 rounded">{editorLanguage}</span>
                {decodeResult.isJson && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    editedJsonError
                      ? 'text-status-error-text bg-status-error-bg border-status-error-border'
                      : 'text-status-success-text bg-status-success-bg border-status-success-border'
                  }`}>
                    {editedJsonError ? 'Invalid JSON' : 'Valid JSON'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-[120px]">
              {actualValue ? (
                <SimpleEditor
                  value={editedContent}
                  onChange={handleContentChange}
                  language={editorLanguage}
                  height="100%"
                  className="border border-editor-border rounded h-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500 text-xs border border-editor-border rounded bg-editor-bg">
                  {standalone ? '请在上方输入待解码的内容' : '无内容'}
                </div>
              )}
            </div>
            {editedJsonError && (
              <div
                data-tour="scheme-json-edit-error"
                className="mt-2 text-xs text-status-error-text bg-status-error-bg border border-status-error-border rounded px-2.5 py-1.5"
              >
                {editedJsonError}
              </div>
            )}
            {isEditing && hasNonReversibleLayer && (
              <div className="mt-2 text-xs text-amber-200 bg-amber-900/30 border border-amber-700/50 rounded px-2.5 py-1.5">
                当前编码层不可逆，仅支持查看和复制，不能应用修改
              </div>
            )}
          </div>
        </div>

        {/* 自定义滚动条 */}
        {showScrollbar && (
          <div className="absolute right-0 top-0 bottom-0 w-[6px] z-10 opacity-0 group-hover/content:opacity-100 transition-opacity duration-200">
            <div
              className="w-full bg-scrollbar-bg hover:bg-scrollbar-hover rounded-full cursor-pointer relative"
              style={{
                height: `${thumbHeight}%`,
                top: `${thumbTop}%`
              }}
              onMouseDown={handleScrollbarMouseDown}
            />
          </div>
        )}
      </div>
    </DraggablePanel>
  );
};
