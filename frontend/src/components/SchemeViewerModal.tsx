import React, { useDeferredValue, useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { 
  buildSchemePlaceholderGroups,
  deepDecodeScheme, 
  encodeWithLayers, 
  type SchemeDecodeResult,
  type SchemeType
} from '../utils/schemeUtils';
import { QRCodeCanvas } from 'qrcode.react';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import {
  extractBase64MetaInfo,
  extractSchemeCommandSummaryInfo,
  formatSchemeInsightItems,
  formatBase64MetaDisplayValue,
  formatPrimaryCmdHandlerCompatibleResult,
  type Base64MetaInfo,
  type SchemeCommandSummaryInfo,
} from '../utils/schemeMetadata';
import {
  buildSchemeQualitySummary,
  formatSchemeQualitySnapshotJsonText,
  formatSchemeQualitySummaryText,
  type SchemeQualityLevel,
  type SchemeQualitySummaryItem,
} from '../utils/schemeQualitySummary';
import {
  buildSchemePathValuesForCopy,
  formatSchemePathValueCountLabel,
} from '../utils/schemePathValues';
import {
  buildSchemeDiagnosticSummaryItems,
  buildSchemeViewerParamSections,
  getSchemeViewerParamCount,
  getSchemeViewerParamEntries,
  hasSchemeDiagnosticDetails,
  sumSchemeSkippedDecodeCount,
} from '../utils/schemeViewerDiagnostics';
import { buildSchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import {
  formatSchemeCopySizeLabel,
  formatSchemeLayerSizeLabel,
  formatSchemeParamStageValue,
  formatSchemeParamTooltipValue,
  formatSchemeParamValue,
  formatSchemePlaceholderValue,
  formatSchemeSummaryValue,
  formatSchemeTooltipValue,
  getSchemeLayerAfterContent,
  getSchemeLayerReversibleLabel,
  schemeLayerTypeLabels,
  schemeParamStageSourceLabels,
} from '../utils/schemeViewerFormatters';

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
  onInspectOriginal?: (value: string) => void; // 将原始值送回主工作台排查
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
    { includeCommandFieldRows: false, source: result.original }
  ),
});

const getSchemeQualityClassName = (level: SchemeQualityLevel): string => {
  switch (level) {
    case 'success':
      return 'border-emerald-700/50 bg-emerald-950/30 text-emerald-100';
    case 'warning':
      return 'border-amber-700/50 bg-amber-950/30 text-amber-100';
    case 'error':
      return 'border-red-700/50 bg-red-950/30 text-red-100';
    case 'info':
    default:
      return 'border-cyan-700/50 bg-cyan-950/30 text-cyan-100';
  }
};

const getSchemeQualityItemClassName = (tone: SchemeQualitySummaryItem['tone'] = 'default'): string => {
  switch (tone) {
    case 'success':
      return 'bg-emerald-900/30 text-emerald-200 border-emerald-700/40';
    case 'warning':
      return 'bg-amber-900/30 text-amber-200 border-amber-700/40';
    case 'cyan':
      return 'bg-cyan-900/30 text-cyan-200 border-cyan-700/40';
    case 'default':
    default:
      return 'bg-editor-bg text-gray-300 border-editor-border';
  }
};

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
  onInspectOriginal,
}) => {
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDiagnosticsExpanded, setIsDiagnosticsExpanded] = useState(false);

  // 独立模式下的输入值
  const [standaloneInput, setStandaloneInput] = useState<string>('');
  const [workerDecodeState, setWorkerDecodeState] = useState<SchemeDecodeWorkerState>({
    source: '',
    result: null,
    metadata: null,
  });
  const [cancelledDecodeSource, setCancelledDecodeSource] = useState('');
  const currentWorkerRef = useRef<Worker | null>(null);
  const workerDecodeRequestIdRef = useRef(0);

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
  const isCurrentDecodeCancelled = Boolean(
    shouldDecodeInWorker && cancelledDecodeSource === decodeSourceValue
  );
  const hasFreshWorkerDecodeResult = Boolean(
    shouldDecodeInWorker &&
    !isCurrentDecodeCancelled &&
    workerDecodeState.source === decodeSourceValue &&
    workerDecodeState.result
  );
  const freshWorkerDecodeMetadata = hasFreshWorkerDecodeResult
    ? workerDecodeState.metadata
    : null;
  const isDecodePending = Boolean(
    actualValue && deferredActualValue !== actualValue
  ) || (shouldDecodeInWorker && !isCurrentDecodeCancelled && !hasFreshWorkerDecodeResult);
  const canCancelDecode = Boolean(
    shouldDecodeInWorker &&
    !isCurrentDecodeCancelled &&
    workerDecodeState.source === decodeSourceValue &&
    !hasFreshWorkerDecodeResult
  );

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
      if (isCurrentDecodeCancelled) {
        return createEmptyDecodeResult(decodeSourceValue);
      }

      return hasFreshWorkerDecodeResult && workerDecodeState.result
        ? workerDecodeState.result
        : createEmptyDecodeResult(decodeSourceValue);
    }

    return deepDecodeScheme(decodeSourceValue);
  }, [decodeSourceValue, hasFreshWorkerDecodeResult, isCurrentDecodeCancelled, shouldDecodeInWorker, workerDecodeState.result]);

  useEffect(() => {
    if (cancelledDecodeSource && cancelledDecodeSource !== decodeSourceValue) {
      setCancelledDecodeSource('');
    }
  }, [cancelledDecodeSource, decodeSourceValue]);

  useEffect(() => {
    if (!decodeSourceValue || !shouldDecodeInWorker) {
      setWorkerDecodeState(current => (
        current.source || current.result || current.metadata ? { source: '', result: null, metadata: null } : current
      ));
      return;
    }

    if (isCurrentDecodeCancelled) {
      setWorkerDecodeState(current => (
        current.source === decodeSourceValue && !current.result && !current.metadata
          ? current
          : { source: decodeSourceValue, result: null, metadata: null }
      ));
      return;
    }

    let isCancelled = false;
    const requestId = workerDecodeRequestIdRef.current + 1;
    workerDecodeRequestIdRef.current = requestId;
    const worker = new Worker(new URL('../workers/schemeDecode.worker.ts', import.meta.url), { type: 'module' });
    currentWorkerRef.current?.terminate();
    currentWorkerRef.current = worker;
    setWorkerDecodeState({ source: decodeSourceValue, result: null, metadata: null });

    worker.onmessage = (event: MessageEvent<SchemeDecodeWorkerResponse>) => {
      worker.terminate();
      if (currentWorkerRef.current === worker) {
        currentWorkerRef.current = null;
      }
      if (isCancelled || requestId !== workerDecodeRequestIdRef.current) return;

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
      if (currentWorkerRef.current === worker) {
        currentWorkerRef.current = null;
      }
      if (isCancelled || requestId !== workerDecodeRequestIdRef.current) return;

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
      if (currentWorkerRef.current === worker) {
        currentWorkerRef.current = null;
      }
      worker.terminate();
    };
  }, [decodeSourceValue, isCurrentDecodeCancelled, shouldDecodeInWorker]);

  const handleCancelDecode = () => {
    if (!canCancelDecode) return;

    currentWorkerRef.current?.terminate();
    currentWorkerRef.current = null;
    workerDecodeRequestIdRef.current += 1;
    setCancelledDecodeSource(decodeSourceValue);
    setWorkerDecodeState({ source: decodeSourceValue, result: null, metadata: null });
    toast.success('已取消解析', { duration: 1600 });
  };

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

  useEffect(() => {
    if (!isOpen) {
      setIsDiagnosticsExpanded(false);
    }
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await copyText(editedContent);
      toast.success(`已复制解码结果（${formatSchemeCopySizeLabel(editedContent)}）`, { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 解码结果失败:', err);
      toast.error(getClipboardErrorMessage(err), { duration: 2000 });
    }
  };

  const handleCopyPathValues = async () => {
    if (!canCopyPathValues) return;

    const pathValueCopyResult = buildSchemePathValuesForCopy(editedContent);
    if (!pathValueCopyResult?.text) return;

    try {
      await copyText(pathValueCopyResult.text);
      toast.success(`已复制路径和值（${formatSchemePathValueCountLabel(pathValueCopyResult.rowCount, pathValueCopyResult.isTruncated)}）`, { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 路径和值失败:', err);
      toast.error(getClipboardErrorMessage(err), { duration: 2000 });
    }
  };

  const handleCopyOriginal = async () => {
    try {
      await copyText(actualValue);
      toast.success(`已复制原始值（${formatSchemeCopySizeLabel(actualValue)}）`, { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 原始值失败:', err);
      toast.error(getClipboardErrorMessage(err), { duration: 2000 });
    }
  };

  const handleCopyPath = async () => {
    if (!path) return;

    try {
      await copyText(path);
      toast.success('已复制路径', { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 来源路径失败:', err);
      toast.error(getClipboardErrorMessage(err), { duration: 2000 });
    }
  };

  // JSON 解码结果被编辑后需要重新校验，避免非法内容写回原始字段。
  const isPristineDecodedContent = !isEditing && editedContent === decodeResult.decoded;
  const editedJsonError = useMemo(() => {
    if (!decodeResult.isJson) return '';
    if (!editedContent.trim()) return 'JSON 内容不能为空';
    if (isPristineDecodedContent) return '';

    try {
      JSON.parse(editedContent);
      return '';
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `JSON 内容格式有误: ${message}`;
    }
  }, [decodeResult.isJson, editedContent, isPristineDecodedContent]);
  const hasNonReversibleLayer = useMemo(() => (
    decodeResult.layers.some(layer => layer.reversible === false)
  ), [decodeResult.layers]);
  const canApplyEdit = Boolean(onApply && isEditing && !isDecodePending && !editedJsonError && !hasNonReversibleLayer);
  const canCopySerializedContent = Boolean(
    !isDecodePending &&
    actualValue &&
    editedContent &&
    !editedJsonError &&
    !hasNonReversibleLayer &&
    decodeResult.layers.length > 0
  );
  const canCopyPathValues = Boolean(decodeResult.isJson && !isDecodePending && !editedJsonError);

  const handleCopySerialized = async () => {
    if (!canCopySerializedContent) return;

    const serializedContent = encodeWithLayers(editedContent, decodeResult.layers);
    if (!serializedContent) return;

    try {
      await copyText(serializedContent);
      toast.success(`已复制序列化结果（${formatSchemeCopySizeLabel(serializedContent)}）`, { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 序列化结果失败:', err);
      toast.error(getClipboardErrorMessage(err), { duration: 2000 });
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
    buildSchemeViewerParamSections(decodeResult.schemeInfo)
  ), [decodeResult.schemeInfo]);
  const paramStages = decodeResult.paramStages || [];
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
          decodeResult.schemeInfo,
          { source: decodeResult.original }
        )
  ), [decodeResult.decoded, decodeResult.isJson, decodeResult.original, decodeResult.schemeInfo, freshWorkerDecodeMetadata]);
  const schemeQualitySummary = useMemo(() => (
    buildSchemeQualitySummary({
      actualValue,
      isDecodePending,
      isDecodeCancelled: isCurrentDecodeCancelled,
      editedJsonError,
      decodeResult,
      commandSummaryInfo,
      placeholders,
      decodeWarnings,
    })
  ), [
    actualValue,
    commandSummaryInfo,
    decodeResult,
    decodeWarnings,
    editedJsonError,
    isCurrentDecodeCancelled,
    isDecodePending,
    placeholders,
  ]);
  const canCopyCmdHandlerCompatibleResult = Boolean(
    commandSummaryInfo && decodeResult.isJson && !isDecodePending && !editedJsonError
  );
  const actionTitles = useMemo(() => (
    buildSchemeViewerActionTitles({
      hasOriginalValue: Boolean(actualValue),
      showQRCode,
      isDecodePending,
      hasDecodedContent: Boolean(editedContent),
      hasSchemeQualitySummary: Boolean(schemeQualitySummary),
      hasEditedJsonError: Boolean(editedJsonError),
      isJsonResult: decodeResult.isJson,
      hasNonReversibleLayer,
      decodeLayerCount: decodeResult.layers.length,
      isEditing,
    })
  ), [
    actualValue,
    decodeResult.isJson,
    decodeResult.layers.length,
    editedContent,
    editedJsonError,
    hasNonReversibleLayer,
    isDecodePending,
    isEditing,
    schemeQualitySummary,
    showQRCode,
  ]);
  const nestedCommandInsight = commandSummaryInfo
    ? formatSchemeInsightItems('cmd解析', commandSummaryInfo.commandFields)
    : undefined;
  const extInsight = commandSummaryInfo
    ? formatSchemeInsightItems('ext解析', commandSummaryInfo.extFields)
    : undefined;
  const base64SuffixInsight = commandSummaryInfo
    ? formatSchemeInsightItems('Base64 后缀', commandSummaryInfo.base64SuffixFields, 6)
    : undefined;
  const skippedDecodeCount = useMemo(() => (
    sumSchemeSkippedDecodeCount(decodeWarnings)
  ), [decodeWarnings]);
  const diagnosticSummaryItems = useMemo(() => (
    buildSchemeDiagnosticSummaryItems({
      decodeResult,
      commandSummaryInfo,
      paramSections,
      paramStages,
      placeholders,
      skippedDecodeCount,
      base64MetaInfo,
    })
  ), [
    base64MetaInfo,
    commandSummaryInfo,
    decodeResult,
    paramSections,
    paramStages,
    placeholders,
    skippedDecodeCount,
  ]);
  const hasDiagnosticDetails = useMemo(() => (
    hasSchemeDiagnosticDetails({
      schemeQualitySummary,
      decodeResult,
      commandSummaryInfo,
      paramSections,
      paramStages,
      placeholders,
      decodeWarnings,
      base64MetaInfo,
    })
  ), [
    base64MetaInfo,
    commandSummaryInfo,
    decodeResult,
    decodeWarnings,
    paramSections,
    paramStages,
    placeholders,
    schemeQualitySummary,
  ]);

  const handleCopyCmdHandlerCompatibleResult = async () => {
    if (!canCopyCmdHandlerCompatibleResult) return;

    const cmdHandlerCompatibleCopyText = formatPrimaryCmdHandlerCompatibleResult(
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
      toast.error(getClipboardErrorMessage(err), { duration: 2000 });
    }
  };

  const handleCopyQualitySummary = async () => {
    if (!schemeQualitySummary) return;

    const qualitySummaryText = formatSchemeQualitySummaryText(schemeQualitySummary);
    try {
      await copyText(qualitySummaryText);
      toast.success(`已复制质量摘要（${formatSchemeCopySizeLabel(qualitySummaryText)}）`, { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 质量摘要失败:', err);
      toast.error(getClipboardErrorMessage(err, '复制质量摘要失败'), { duration: 2000 });
    }
  };

  const handleCopyQualitySnapshot = async () => {
    if (!schemeQualitySummary) return;

    const qualitySnapshotText = formatSchemeQualitySnapshotJsonText({
      summary: schemeQualitySummary,
      decodeResult,
      commandSummaryInfo,
      placeholders,
      decodeWarnings,
    });
    try {
      await copyText(qualitySnapshotText);
      toast.success(`已复制质量快照（${formatSchemeCopySizeLabel(qualitySnapshotText)}）`, { duration: 2000 });
    } catch (err) {
      console.warn('复制 Scheme 质量快照失败:', err);
      toast.error(getClipboardErrorMessage(err, '复制质量快照失败'), { duration: 2000 });
    }
  };

  const handleInspectOriginal = () => {
    if (!actualValue || !onInspectOriginal) return;

    onInspectOriginal(actualValue);
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
        aria-label="复制路径，复制 Scheme 来源路径"
      >
        复制路径
      </button>
    </div>
  ) : null;
  const decodeStatusText = (() => {
    if (isCurrentDecodeCancelled) return '已取消解析';
    if (isDecodePending) return '解析中...';
    if (decodeResult.layers.length > 0) return `${decodeResult.layers.length} 层解码`;
    return actualValue ? '无需解码' : '请输入待解码内容';
  })();

  // 底部操作栏
  const footer = (
    <div className="flex w-full flex-wrap items-center justify-between gap-2">
      <div data-tour="scheme-decode-status" className="shrink-0 text-xs text-gray-500">
        {decodeStatusText}
      </div>
      <div data-tour="scheme-footer-actions" className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
        {canCancelDecode && (
          <button
            data-tour="scheme-cancel-decode"
            onClick={handleCancelDecode}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-amber-700/80 text-white rounded hover:bg-amber-700 transition-colors"
            title="停止当前大内容解析"
            aria-label="取消解析，停止当前大内容解析"
          >
            取消解析
          </button>
        )}
        <button
          data-tour="scheme-close-button"
          onClick={onClose}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors"
          title="关闭 Scheme 解析"
          aria-label="关闭 Scheme 解析"
        >
          关闭
        </button>
        <button
          data-tour="scheme-qrcode-button"
          onClick={() => setShowQRCode(!showQRCode)}
          disabled={!actualValue}
          aria-pressed={showQRCode}
          aria-label={`二维码，${actionTitles.qrCode}`}
          className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
            showQRCode 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-editor-active text-gray-200 hover:bg-editor-border'
          }`}
          title={actionTitles.qrCode}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          二维码
        </button>
        <button
          data-tour="scheme-copy-original"
          onClick={handleCopyOriginal}
          disabled={!actualValue}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={actionTitles.copyOriginal}
          aria-label={`复制原始值，${actionTitles.copyOriginal}`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          复制原始值
        </button>
        <button
          data-tour="scheme-copy-decoded"
          onClick={handleCopy}
          disabled={!editedContent || isDecodePending}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={actionTitles.copyDecoded}
          aria-label={`复制解码结果，${actionTitles.copyDecoded}`}
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
            title={actionTitles.copyCmdStructure}
            aria-label={`复制 CMD 结构，${actionTitles.copyCmdStructure}`}
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
            title={actionTitles.copyPathValues}
            aria-label={`复制路径和值，${actionTitles.copyPathValues}`}
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
            disabled={!canCopySerializedContent}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title={actionTitles.copySerialized}
            aria-label={`复制序列化结果，${actionTitles.copySerialized}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h10m0 0l-3-3m3 3l-3 3m9 7H10m0 0l3 3m-3-3l3-3" />
            </svg>
            复制序列化结果
          </button>
        )}
        {onApply && isEditing && (
          <button
            data-tour="scheme-apply-edit"
            onClick={handleApply}
            disabled={!canApplyEdit}
            className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            title={actionTitles.applyEdit}
            aria-label={`应用修改，${actionTitles.applyEdit}`}
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
          {hasDiagnosticDetails && (
            <div
              data-tour="scheme-diagnostics-panel"
              className="bg-editor-sidebar rounded border border-editor-border"
            >
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setIsDiagnosticsExpanded(expanded => !expanded)}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded text-left focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
                  aria-expanded={isDiagnosticsExpanded}
                  aria-controls="scheme-diagnostics-detail"
                  title={isDiagnosticsExpanded ? '收起 Scheme 解析详情' : '展开 Scheme 解析详情'}
                >
                  <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${
                    schemeQualitySummary
                      ? getSchemeQualityClassName(schemeQualitySummary.level)
                      : 'border-editor-border bg-editor-bg text-gray-300'
                  }`}>
                    {schemeQualitySummary?.label || '解析信息'}
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap text-xs text-gray-400 [&::-webkit-scrollbar]:hidden">
                    {diagnosticSummaryItems.map(item => (
                      <span
                        key={item.key}
                        className="rounded bg-editor-bg px-2 py-0.5 font-mono text-gray-300"
                        title={item.title}
                      >
                        {item.label}
                      </span>
                    ))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsDiagnosticsExpanded(expanded => !expanded)}
                  className="shrink-0 rounded bg-editor-active px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-editor-border hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-300/30"
                  aria-expanded={isDiagnosticsExpanded}
                  aria-controls="scheme-diagnostics-detail"
                >
                  {isDiagnosticsExpanded ? '收起详情' : '展开详情'}
                </button>
              </div>
              {isDiagnosticsExpanded && (
                <div
                  id="scheme-diagnostics-detail"
                  className="flex flex-col gap-2 border-t border-editor-border px-3 py-2"
                >
              {/* 解析质量摘要 */}
              {schemeQualitySummary && (
                <div
                  data-tour="scheme-quality-summary"
                  className={`rounded border px-2.5 py-2 text-xs ${getSchemeQualityClassName(schemeQualitySummary.level)}`}
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="shrink-0 font-medium">{schemeQualitySummary.label}</span>
                    <span className="min-w-0 text-gray-300">{schemeQualitySummary.description}</span>
                    <div className="ml-auto flex shrink-0 items-center gap-1">
                      {standalone && onInspectOriginal && (
                        <button
                          data-tour="scheme-inspect-original"
                          type="button"
                          onClick={handleInspectOriginal}
                          className="rounded border border-emerald-500/40 bg-emerald-600/20 px-2 py-0.5 text-xs text-emerald-100 transition-colors hover:bg-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
                          title="将原始值送入 SOURCE 并打开深度解析报告"
                          aria-label="用原始值排查，将原始值送入 SOURCE 并打开深度解析报告"
                        >
                          用原始值排查
                        </button>
                      )}
                      <button
                        data-tour="scheme-copy-quality-summary"
                        type="button"
                        onClick={handleCopyQualitySummary}
                        className="rounded border border-current/20 px-2 py-0.5 text-xs text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/30"
                        title="复制当前 Scheme 解析质量摘要"
                        aria-label="复制质量摘要，复制当前 Scheme 解析质量摘要"
                      >
                        复制摘要
                      </button>
                      <button
                        data-tour="scheme-copy-quality-snapshot"
                        type="button"
                        onClick={handleCopyQualitySnapshot}
                        className="rounded border border-current/20 px-2 py-0.5 text-xs text-gray-200 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current/30"
                        title={actionTitles.copyQualitySnapshot}
                        aria-label={`复制质量快照，${actionTitles.copyQualitySnapshot}`}
                      >
                        复制快照
                      </button>
                    </div>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {schemeQualitySummary.items.map(item => (
                      <span
                        key={item.label}
                        className={`rounded border px-2 py-0.5 font-mono ${getSchemeQualityItemClassName(item.tone)}`}
                      >
                        {item.label} · {item.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

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
                    <span className="bg-editor-bg text-gray-400 px-2 py-0.5 rounded text-xs truncate max-w-[200px]" title={formatSchemeTooltipValue(decodeResult.schemeInfo.path)}>
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
                        title={formatSchemeTooltipValue(commandSummaryInfo.commandSchema)}
                      >
                        cmdSchema={formatSchemeSummaryValue(commandSummaryInfo.commandSchema)}
                      </span>
                    )}
                    {commandSummaryInfo.commandSchemaCount > 0 && (
                      <span
                        data-tour="scheme-command-schema-count"
                        className="bg-editor-bg text-cyan-200 px-2 py-0.5 rounded font-mono"
                        title="已从原始 source 对齐出来的 CMD Schema 数量"
                      >
                        Schema · {commandSummaryInfo.commandSchemaCount}
                      </span>
                    )}
                    {commandSummaryInfo.topCommandSchemas.length > 0 && (
                      <span data-tour="scheme-top-command-schemas" className="contents">
                        {commandSummaryInfo.topCommandSchemas.map(item => (
                          <span
                            key={item.schema}
                            className="bg-editor-bg text-cyan-100 px-2 py-0.5 rounded font-mono max-w-full truncate"
                            title={[
                              item.schema,
                              ...item.paths,
                              ...(item.hasMorePaths ? ['...'] : []),
                            ].join('\n')}
                          >
                            {formatSchemeSummaryValue(item.schema, 42)} ×{item.count}
                          </span>
                        ))}
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
                        title={formatSchemeTooltipValue(key, 80)}
                      >
                        {formatSchemeSummaryValue(key, 24)}
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
                          title={`${placeholder.path} = ${formatSchemeTooltipValue(placeholder.value)}\n${placeholder.description}`}
                        >
                          {placeholder.path}={formatSchemePlaceholderValue(placeholder.value)}
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
                            title={formatSchemeTooltipValue(itemPath)}
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
                  {paramSections.map(section => {
                    const entries = getSchemeViewerParamEntries(section.params);

                    return (
                      <div key={section.title} className="flex items-start gap-2 text-xs">
                        <span className="shrink-0 text-gray-500 bg-editor-bg px-2 py-0.5 rounded">
                          {section.title} · {getSchemeViewerParamCount(section.params)}
                        </span>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {entries.slice(0, 6).map(([key, paramValue]) => (
                            <span
                              key={key}
                              className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                              title={`${key}=${formatSchemeParamTooltipValue(paramValue)}`}
                            >
                              {key}={formatSchemeParamValue(paramValue)}
                            </span>
                          ))}
                          {entries.length > 6 && (
                            <span className="text-gray-500 px-1 py-0.5">
                              +{entries.length - 6}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Query 参数分层解析 */}
              {paramStages.length > 0 && (
                <div data-tour="scheme-param-stages" className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
                      参数分层 · {paramStages.length}
                    </span>
                    <span className="text-gray-500">
                      Raw → URL Decode → JSON/CMD 解析 → 重新编码
                    </span>
                  </div>
                  <div className="grid gap-1">
                    {paramStages.slice(0, 6).map(stage => {
                      const title = [
                        `${stage.path} (${schemeParamStageSourceLabels[stage.source]})`,
                        '',
                        'Raw:',
                        formatSchemeTooltipValue(stage.raw, 320),
                        '',
                        'URL Decode:',
                        formatSchemeTooltipValue(stage.urlDecoded, 320),
                        '',
                        'JSON/CMD 解析:',
                        formatSchemeTooltipValue(stage.parsed, 320),
                        '',
                        '重新编码:',
                        formatSchemeTooltipValue(stage.reencoded, 320),
                        stage.repairHint ? `\n修复提示: ${stage.repairHint}` : '',
                      ].filter(Boolean).join('\n');

                      return (
                        <div
                          key={`${stage.source}:${stage.path}`}
                          data-tour="scheme-param-stage"
                          className="flex flex-wrap items-center gap-1 rounded border border-editor-border bg-editor-bg/70 px-2 py-1"
                          title={title}
                        >
                          <span className="rounded bg-editor-sidebar px-2 py-0.5 text-cyan-200">
                            {schemeParamStageSourceLabels[stage.source]}
                          </span>
                          <span className="rounded bg-gray-800 px-2 py-0.5 font-mono text-gray-200">
                            {stage.path}
                          </span>
                          <span className="rounded bg-editor-sidebar px-2 py-0.5 font-mono text-gray-300">
                            {stage.key}
                          </span>
                          <span className="text-gray-500">
                            {formatSchemeLayerSizeLabel(stage.raw)} → {formatSchemeLayerSizeLabel(stage.parsed)}
                          </span>
                          {stage.repairHint && (
                            <span className="rounded bg-amber-900/30 px-2 py-0.5 text-amber-200">
                              {stage.repairHint}
                            </span>
                          )}
                          <span className={stage.reversible
                            ? 'rounded bg-emerald-900/20 px-2 py-0.5 text-emerald-200'
                            : 'rounded bg-amber-900/30 px-2 py-0.5 text-amber-200'}
                          >
                            {stage.reversible ? '可重新编码' : '需确认'}
                          </span>
                          <span className="min-w-0 truncate text-gray-500">
                            {formatSchemeParamStageValue(stage.urlDecoded)}
                          </span>
                        </div>
                      );
                    })}
                    {paramStages.length > 6 && (
                      <div className="text-xs text-gray-500">
                        还有 {paramStages.length - 6} 个参数分层未展示
                      </div>
                    )}
                  </div>
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
                        title={formatSchemeTooltipValue(base64MetaInfo.prefix)}
                      >
                        头部={formatBase64MetaDisplayValue(base64MetaInfo.prefix, 24)}
                      </span>
                    )}
                    {base64MetaInfo.suffix && (
                      <span
                        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatSchemeTooltipValue(base64MetaInfo.suffix)}
                      >
                        后缀={formatBase64MetaDisplayValue(base64MetaInfo.suffix, 32)}
                      </span>
                    )}
                    {base64MetaInfo.suffixDecodePrefix && (
                      <span
                        className="bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={formatSchemeTooltipValue(base64MetaInfo.suffixDecodePrefix)}
                      >
                        跳过={formatBase64MetaDisplayValue(base64MetaInfo.suffixDecodePrefix, 16)}
                      </span>
                    )}
                    {base64MetaInfo.suffixDecodedEntries.slice(0, 6).map(entry => (
                      <span
                        key={entry.key}
                        className="bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate"
                        title={`${entry.key}=${formatSchemeTooltipValue(entry.displayValue)}`}
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
                <div data-tour="scheme-decode-layers" className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      解析链路 · {decodeResult.layers.length} 层
                    </span>
                    <span className="rounded bg-editor-bg px-2 py-0.5 font-mono text-gray-400">
                      原始 → {decodeResult.isJson ? 'JSON' : '文本'}
                    </span>
                  </div>
                  <div className="grid gap-1">
                    {decodeResult.layers.map((layer, index) => {
                      const afterContent = getSchemeLayerAfterContent(decodeResult.layers, index, decodeResult.decoded);
                      const title = [
                        layer.description,
                        `输入: ${formatSchemeLayerSizeLabel(layer.before)}`,
                        `输出: ${formatSchemeLayerSizeLabel(afterContent)}`,
                        `类型: ${schemeLayerTypeLabels[layer.type]}`,
                        `模式: ${getSchemeLayerReversibleLabel(layer)}`,
                        '',
                        '输入预览:',
                        formatSchemeTooltipValue(layer.before, 260),
                        '',
                        '输出预览:',
                        formatSchemeTooltipValue(afterContent || '', 260),
                      ].join('\n');

                      return (
                        <div
                          key={`${layer.type}:${index}:${layer.description}`}
                          data-tour="scheme-decode-layer"
                          className="flex flex-wrap items-center gap-1 rounded border border-editor-border bg-editor-bg/70 px-2 py-1"
                          title={title}
                        >
                          <span className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-300">
                            {index + 1}
                          </span>
                          <span className="rounded bg-emerald-900/40 px-2 py-0.5 font-medium text-emerald-300">
                            {layer.description}
                          </span>
                          <span className="rounded bg-editor-sidebar px-2 py-0.5 font-mono text-cyan-200">
                            {schemeLayerTypeLabels[layer.type]}
                          </span>
                          <span className={layer.reversible === false
                            ? 'rounded bg-amber-900/30 px-2 py-0.5 text-amber-200'
                            : 'rounded bg-emerald-900/20 px-2 py-0.5 text-emerald-200'}
                          >
                            {getSchemeLayerReversibleLabel(layer)}
                          </span>
                          <span className="text-gray-500">
                            {formatSchemeLayerSizeLabel(layer.before)} → {formatSchemeLayerSizeLabel(afterContent)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
              <div data-tour="scheme-qrcode-preview" className="flex flex-col items-center justify-center py-4 bg-white rounded">
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
