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
import { formatPrimaryCmdHandlerCompatibleResult } from '../utils/schemeMetadata';
import {
  buildSchemeQualitySummary,
  formatSchemeQualitySnapshotJsonText,
  formatSchemeQualitySummaryText,
} from '../utils/schemeQualitySummary';
import {
  buildSchemePathValuesForCopy,
  formatSchemePathValueCountLabel,
} from '../utils/schemePathValues';
import {
  buildSchemeDiagnosticSummaryItems,
  buildSchemeViewerParamSections,
  hasSchemeDiagnosticDetails,
  sumSchemeSkippedDecodeCount,
} from '../utils/schemeViewerDiagnostics';
import { buildSchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import {
  formatSchemeCopySizeLabel,
} from '../utils/schemeViewerFormatters';
import {
  buildSchemeViewerDecodeMetadata,
  createEmptySchemeDecodeResult,
  type SchemeViewerDecodeMetadata,
} from '../utils/schemeViewerDecodeMetadata';
import { SchemeViewerDiagnosticsPanel } from './SchemeViewerDiagnosticsPanel';
import { SchemeViewerFooterActions } from './SchemeViewerFooterActions';

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
  metadata?: SchemeViewerDecodeMetadata;
  error?: string;
}

interface SchemeDecodeWorkerState {
  source: string;
  result: SchemeDecodeResult | null;
  metadata: SchemeViewerDecodeMetadata | null;
}

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
      return createEmptySchemeDecodeResult();
    }

    if (shouldDecodeInWorker) {
      if (isCurrentDecodeCancelled) {
        return createEmptySchemeDecodeResult(decodeSourceValue);
      }

      return hasFreshWorkerDecodeResult && workerDecodeState.result
        ? workerDecodeState.result
        : createEmptySchemeDecodeResult(decodeSourceValue);
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
          metadata: buildSchemeViewerDecodeMetadata(fallbackResult, {
            includeCommandFieldRows: false,
          }),
        });
        return;
      }

      setWorkerDecodeState({
        source: decodeSourceValue,
        result: event.data.result,
        metadata: event.data.metadata || buildSchemeViewerDecodeMetadata(event.data.result, {
          includeCommandFieldRows: false,
        }),
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
        metadata: buildSchemeViewerDecodeMetadata(fallbackResult, {
          includeCommandFieldRows: false,
        }),
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
  const schemeDecodeMetadata = useMemo(() => (
    freshWorkerDecodeMetadata ?? buildSchemeViewerDecodeMetadata(decodeResult)
  ), [decodeResult, freshWorkerDecodeMetadata]);
  const base64MetaInfo = schemeDecodeMetadata.base64MetaInfo;
  const commandSummaryInfo = schemeDecodeMetadata.commandSummaryInfo;
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
  const handleToggleQRCode = () => {
    setShowQRCode(current => !current);
  };

  // 底部操作栏
  const footer = (
    <SchemeViewerFooterActions
      decodeStatusText={decodeStatusText}
      canCancelDecode={canCancelDecode}
      onCancelDecode={handleCancelDecode}
      onClose={onClose}
      showQRCode={showQRCode}
      canShowQRCode={Boolean(actualValue)}
      onToggleQRCode={handleToggleQRCode}
      canCopyOriginal={Boolean(actualValue)}
      onCopyOriginal={handleCopyOriginal}
      canCopyDecoded={Boolean(editedContent && !isDecodePending)}
      onCopyDecoded={handleCopy}
      hasCommandSummary={Boolean(commandSummaryInfo)}
      canCopyCmdStructure={canCopyCmdHandlerCompatibleResult}
      onCopyCmdStructure={handleCopyCmdHandlerCompatibleResult}
      isJsonResult={decodeResult.isJson}
      canCopyPathValues={canCopyPathValues}
      onCopyPathValues={handleCopyPathValues}
      isStandalone={standalone}
      hasDecodeLayers={decodeResult.layers.length > 0}
      canCopySerializedContent={canCopySerializedContent}
      onCopySerialized={handleCopySerialized}
      canShowApplyEdit={Boolean(onApply && isEditing)}
      canApplyEdit={canApplyEdit}
      onApplyEdit={handleApply}
      actionTitles={actionTitles}
    />
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

          <SchemeViewerDiagnosticsPanel
            hasDiagnosticDetails={hasDiagnosticDetails}
            isExpanded={isDiagnosticsExpanded}
            onToggleExpanded={() => setIsDiagnosticsExpanded(expanded => !expanded)}
            schemeQualitySummary={schemeQualitySummary}
            diagnosticSummaryItems={diagnosticSummaryItems}
            canInspectOriginal={Boolean(standalone && onInspectOriginal)}
            onInspectOriginal={handleInspectOriginal}
            onCopyQualitySummary={handleCopyQualitySummary}
            onCopyQualitySnapshot={handleCopyQualitySnapshot}
            copyQualitySnapshotTitle={actionTitles.copyQualitySnapshot}
            schemeInfo={decodeResult.schemeInfo}
            commandSummaryInfo={commandSummaryInfo}
            placeholders={placeholders}
            placeholderGroups={placeholderGroups}
            decodeWarnings={decodeWarnings}
            paramSections={paramSections}
            paramStages={paramStages}
            base64MetaInfo={base64MetaInfo}
            layers={decodeResult.layers}
            decodedContent={decodeResult.decoded}
            isJson={decodeResult.isJson}
          />

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
