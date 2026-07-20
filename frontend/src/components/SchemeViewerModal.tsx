import React, { useState, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { SimpleEditor } from './SimpleEditor';
import { DraggablePanel, PanelIcons } from './DraggablePanel';
import { useCustomScrollbar } from '../hooks/useCustomScrollbar';
import { useSchemeViewerDecode } from '../hooks/useSchemeViewerDecode';
import {
  buildSchemePlaceholderGroups,
  encodeWithLayers,
} from '../utils/schemeUtils';
import { copyText, getClipboardErrorMessage } from '../utils/clipboard';
import { formatUnknownError } from '../utils/errors';
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
  createSchemeViewerDecodeProjection,
  createSchemeViewerEncodingInput,
  restoreSchemeViewerDecodeProjection,
} from '../utils/schemeViewerDecodeProjection';
import { SchemeViewerDiagnosticsPanel } from './SchemeViewerDiagnosticsPanel';
import { SchemeViewerFooterActions } from './SchemeViewerFooterActions';
import {
  SchemeViewerQRCodePanel,
  type SchemeViewerQRCodeType,
} from './SchemeViewerQRCodePanel';

interface SchemeCopyFeedback {
  successMessage: string;
  warningMessage: string;
  fallbackErrorMessage?: string;
}

const copySchemeTextWithFeedback = async (
  content: string,
  feedback: SchemeCopyFeedback,
): Promise<void> => {
  try {
    await copyText(content);
    toast.success(feedback.successMessage, { duration: 2000 });
  } catch (error) {
    console.warn(feedback.warningMessage, error);
    toast.error(getClipboardErrorMessage(error, feedback.fallbackErrorMessage), { duration: 2000 });
  }
};

interface SchemeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  path?: string; // JSON 路径，如 "$.action_cmd"（独立模式下可选）
  value?: string; // 原始协议字符串（独立模式下可选）
  sourceLabel?: string; // 来源业务标签，如 extraParam
  onApply?: (newValue: string) => void; // 应用修改后的值
  standalone?: boolean; // 是否为独立模式（侧边栏打开，可手动输入）
  initialStandaloneInput?: string; // 独立模式下从外部入口预填的内容
  initialStandaloneInputKey?: number; // 用于同一内容重复打开时触发重新预填
  onInspectOriginal?: (value: string) => void; // 将原始值送回主工作台排查
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

  // 二维码状态
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeType, setQRCodeType] = useState<SchemeViewerQRCodeType>('original');
  const qrCodeRef = useRef<HTMLCanvasElement>(null);
  
  // 实际使用的原始值：独立模式使用输入值，否则使用属性传入值
  const actualValue = standalone ? standaloneInput : (value || '');
  const {
    decodeResult,
    decodeMetadata: schemeDecodeMetadata,
    isDecodePending,
    isDecodeCancelled: isCurrentDecodeCancelled,
    hasDecodeFailed,
    canCancelDecode,
    cancelDecode,
  } = useSchemeViewerDecode(actualValue, { enabled: isOpen });
  const decodeProjection = useMemo(() => (
    createSchemeViewerDecodeProjection(decodeResult.decoded, decodeResult.original)
  ), [decodeResult.decoded, decodeResult.original]);

  // 自定义滚动条钩子
  const {
    scrollContainerRef,
    handleScroll,
    handleMouseDown: handleScrollbarMouseDown,
    thumbSize: thumbHeight,
    thumbOffset: thumbTop,
    showScrollbar,
  } = useCustomScrollbar('vertical', isOpen ? actualValue : null);

  const handleCancelDecode = () => {
    if (!cancelDecode()) return;
    toast.success('已取消解析', { duration: 1600 });
  };

  // 初始化编辑内容
  useEffect(() => {
    setEditedContent(decodeProjection.content);
    setIsEditing(false);
  }, [decodeProjection.content, decodeResult.original]);

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
    await copySchemeTextWithFeedback(editedContent, {
      successMessage: `已复制解码结果（${formatSchemeCopySizeLabel(editedContent)}）`,
      warningMessage: '复制 Scheme 解码结果失败:',
    });
  };

  const handleCopyPathValues = async () => {
    if (!canCopyPathValues) return;

    const pathValueCopyResult = buildSchemePathValuesForCopy(editedContent);
    if (!pathValueCopyResult?.text) return;

    await copySchemeTextWithFeedback(pathValueCopyResult.text, {
      successMessage: `已复制路径和值（${formatSchemePathValueCountLabel(pathValueCopyResult.rowCount, pathValueCopyResult.isTruncated)}）`,
      warningMessage: '复制 Scheme 路径和值失败:',
    });
  };

  const handleCopyOriginal = async () => {
    await copySchemeTextWithFeedback(actualValue, {
      successMessage: `已复制原始值（${formatSchemeCopySizeLabel(actualValue)}）`,
      warningMessage: '复制 Scheme 原始值失败:',
    });
  };

  const handleCopyPath = async () => {
    if (!path) return;

    await copySchemeTextWithFeedback(path, {
      successMessage: '已复制路径',
      warningMessage: '复制 Scheme 来源路径失败:',
    });
  };

  // JSON 解码结果被编辑后需要重新校验，避免非法内容写回原始字段。
  const isPristineDecodedContent = !isEditing && editedContent === decodeProjection.content;
  const editedJsonError = useMemo(() => {
    if (!decodeResult.isJson) return '';
    if (!editedContent.trim()) return 'JSON 内容不能为空';
    if (isPristineDecodedContent) return '';

    try {
      JSON.parse(editedContent);
      return '';
    } catch (error) {
      const message = formatUnknownError(error);
      return `JSON 内容格式有误: ${message}`;
    }
  }, [decodeResult.isJson, editedContent, isPristineDecodedContent]);
  const hasNonReversibleLayer = useMemo(() => (
    decodeResult.layers.some(layer => layer.reversible === false)
  ), [decodeResult.layers]);
  const canApplyEdit = Boolean(
    onApply &&
    isEditing &&
    !isDecodePending &&
    !hasDecodeFailed &&
    !editedJsonError &&
    !hasNonReversibleLayer,
  );
  const canCopySerializedContent = Boolean(
    !isDecodePending &&
    !hasDecodeFailed &&
    actualValue &&
    editedContent &&
    !editedJsonError &&
    !hasNonReversibleLayer &&
    decodeResult.layers.length > 0
  );
  const canCopyPathValues = Boolean(
    decodeResult.isJson && !isDecodePending && !hasDecodeFailed && !editedJsonError,
  );

  const handleCopySerialized = async () => {
    if (!canCopySerializedContent) return;

    const encodingInput = createSchemeViewerEncodingInput(
      editedContent,
      decodeResult.original,
      decodeResult.layers,
      decodeProjection.headerKey,
    );
    const serializedContent = encodeWithLayers(encodingInput.content, encodingInput.layers);
    if (!serializedContent) return;

    await copySchemeTextWithFeedback(serializedContent, {
      successMessage: `已复制序列化结果（${formatSchemeCopySizeLabel(serializedContent)}）`,
      warningMessage: '复制 Scheme 序列化结果失败:',
    });
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
      const encodingInput = createSchemeViewerEncodingInput(
        editedContent,
        decodeResult.original,
        decodeResult.layers,
        decodeProjection.headerKey,
      );
      const encoded = encodeWithLayers(encodingInput.content, encodingInput.layers);
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

  // 自动检测语言
  const editorLanguage = useMemo(() => {
    if (decodeResult.isJson) return 'json';
    // 尝试检测其他格式
    const trimmed = editedContent.trim();
    if (trimmed.startsWith('<')) return 'xml';
    return 'plaintext';
  }, [decodeResult.isJson, editedContent]);
  const editorLanguageLabel = editorLanguage === 'plaintext'
    ? '纯文本'
    : editorLanguage.toUpperCase();

  const paramSections = useMemo(() => (
    buildSchemeViewerParamSections(decodeResult.schemeInfo)
  ), [decodeResult.schemeInfo]);
  const paramStages = useMemo(() => decodeResult.paramStages ?? [], [decodeResult.paramStages]);
  const placeholders = useMemo(() => decodeResult.placeholders ?? [], [decodeResult.placeholders]);
  const decodeWarnings = useMemo(() => decodeResult.warnings ?? [], [decodeResult.warnings]);
  const placeholderGroups = useMemo(() => (
    buildSchemePlaceholderGroups(placeholders)
  ), [placeholders]);
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

    const restoredContent = restoreSchemeViewerDecodeProjection(
      editedContent,
      decodeResult.original,
      decodeProjection.headerKey,
    );
    const cmdHandlerCompatibleCopyText = formatPrimaryCmdHandlerCompatibleResult(
      restoredContent.content,
      commandSummaryInfo?.commandSchema,
      restoredContent.source
    );
    if (!cmdHandlerCompatibleCopyText) return;

    await copySchemeTextWithFeedback(cmdHandlerCompatibleCopyText, {
      successMessage: '已复制 CMD 结构',
      warningMessage: '复制 CMD 结构失败:',
    });
  };

  const handleCopyQualitySummary = async () => {
    if (!schemeQualitySummary) return;

    const qualitySummaryText = formatSchemeQualitySummaryText(schemeQualitySummary);
    await copySchemeTextWithFeedback(qualitySummaryText, {
      successMessage: `已复制质量摘要（${formatSchemeCopySizeLabel(qualitySummaryText)}）`,
      warningMessage: '复制 Scheme 质量摘要失败:',
      fallbackErrorMessage: '复制质量摘要失败',
    });
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
    await copySchemeTextWithFeedback(qualitySnapshotText, {
      successMessage: `已复制质量快照（${formatSchemeCopySizeLabel(qualitySnapshotText)}）`,
      warningMessage: '复制 Scheme 质量快照失败:',
      fallbackErrorMessage: '复制质量快照失败',
    });
  };

  const handleInspectOriginal = () => {
    if (!actualValue || !onInspectOriginal) return;

    onInspectOriginal(actualValue);
  };

  // 头部额外内容：非独立模式显示来源路径标签，并支持复制到 JSONPath 面板继续定位
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
    if (hasDecodeFailed) return '解析失败';
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
      canCopyDecoded={Boolean(editedContent && !isDecodePending && !hasDecodeFailed)}
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
                  type="button"
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

          <SchemeViewerQRCodePanel
            isVisible={showQRCode}
            qrCodeType={qrCodeType}
            originalContent={actualValue}
            decodedContent={editedContent}
            isDecodePending={isDecodePending}
            qrCodeRef={qrCodeRef}
            onTypeChange={setQRCodeType}
            onDownload={handleDownloadQRCode}
          />

          {/* 可编辑的解码结果 */}
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
                <span className="text-xs text-gray-500 font-mono uppercase bg-editor-bg px-1.5 py-0.5 rounded">{editorLanguageLabel}</span>
                {decodeResult.isJson && (
                  <span className={`text-xs px-2 py-0.5 rounded border ${
                    editedJsonError
                      ? 'text-status-error-text bg-status-error-bg border-status-error-border'
                      : 'text-status-success-text bg-status-success-bg border-status-success-border'
                  }`}>
                    {editedJsonError ? 'JSON 无效' : 'JSON 有效'}
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
