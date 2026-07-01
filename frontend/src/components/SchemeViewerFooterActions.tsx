import React from 'react';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';

interface SchemeViewerFooterActionsProps {
  decodeStatusText: string;
  canCancelDecode: boolean;
  onCancelDecode: () => void;
  onClose: () => void;
  showQRCode: boolean;
  canShowQRCode: boolean;
  onToggleQRCode: () => void;
  canCopyOriginal: boolean;
  onCopyOriginal: () => void;
  canCopyDecoded: boolean;
  onCopyDecoded: () => void;
  hasCommandSummary: boolean;
  canCopyCmdStructure: boolean;
  onCopyCmdStructure: () => void;
  isJsonResult: boolean;
  canCopyPathValues: boolean;
  onCopyPathValues: () => void;
  isStandalone: boolean;
  hasDecodeLayers: boolean;
  canCopySerializedContent: boolean;
  onCopySerialized: () => void;
  canShowApplyEdit: boolean;
  canApplyEdit: boolean;
  onApplyEdit: () => void;
  actionTitles: SchemeViewerActionTitles;
}

interface SchemeViewerFooterIconProps {
  children: React.ReactNode;
}

const SchemeViewerFooterIcon: React.FC<SchemeViewerFooterIconProps> = ({ children }) => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    {children}
  </svg>
);

export const SchemeViewerFooterActions: React.FC<SchemeViewerFooterActionsProps> = ({
  decodeStatusText,
  canCancelDecode,
  onCancelDecode,
  onClose,
  showQRCode,
  canShowQRCode,
  onToggleQRCode,
  canCopyOriginal,
  onCopyOriginal,
  canCopyDecoded,
  onCopyDecoded,
  hasCommandSummary,
  canCopyCmdStructure,
  onCopyCmdStructure,
  isJsonResult,
  canCopyPathValues,
  onCopyPathValues,
  isStandalone,
  hasDecodeLayers,
  canCopySerializedContent,
  onCopySerialized,
  canShowApplyEdit,
  canApplyEdit,
  onApplyEdit,
  actionTitles,
}) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div data-tour="scheme-decode-status" className="shrink-0 text-xs text-gray-500">
      {decodeStatusText}
    </div>
    <div data-tour="scheme-footer-actions" className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
      {canCancelDecode && (
        <button
          data-tour="scheme-cancel-decode"
          onClick={onCancelDecode}
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
        onClick={onToggleQRCode}
        disabled={!canShowQRCode}
        aria-pressed={showQRCode}
        aria-label={`二维码，${actionTitles.qrCode}`}
        className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-sm rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ${
          showQRCode 
            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
            : 'bg-editor-active text-gray-200 hover:bg-editor-border'
        }`}
        title={actionTitles.qrCode}
      >
        <SchemeViewerFooterIcon>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </SchemeViewerFooterIcon>
        二维码
      </button>
      <button
        data-tour="scheme-copy-original"
        onClick={onCopyOriginal}
        disabled={!canCopyOriginal}
        className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        title={actionTitles.copyOriginal}
        aria-label={`复制原始值，${actionTitles.copyOriginal}`}
      >
        <SchemeViewerFooterIcon>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </SchemeViewerFooterIcon>
        复制原始值
      </button>
      <button
        data-tour="scheme-copy-decoded"
        onClick={onCopyDecoded}
        disabled={!canCopyDecoded}
        className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        title={actionTitles.copyDecoded}
        aria-label={`复制解码结果，${actionTitles.copyDecoded}`}
      >
        <SchemeViewerFooterIcon>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </SchemeViewerFooterIcon>
        复制解码结果
      </button>
      {hasCommandSummary && (
        <button
          data-tour="scheme-copy-cmd-structure"
          onClick={onCopyCmdStructure}
          disabled={!canCopyCmdStructure}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={actionTitles.copyCmdStructure}
          aria-label={`复制 CMD 结构，${actionTitles.copyCmdStructure}`}
        >
          <SchemeViewerFooterIcon>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
          </SchemeViewerFooterIcon>
          复制 CMD 结构
        </button>
      )}
      {isJsonResult && (
        <button
          data-tour="scheme-copy-path-values"
          onClick={onCopyPathValues}
          disabled={!canCopyPathValues}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={actionTitles.copyPathValues}
          aria-label={`复制路径和值，${actionTitles.copyPathValues}`}
        >
          <SchemeViewerFooterIcon>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
          </SchemeViewerFooterIcon>
          复制路径和值
        </button>
      )}
      {isStandalone && hasDecodeLayers && (
        <button
          data-tour="scheme-copy-serialized"
          onClick={onCopySerialized}
          disabled={!canCopySerializedContent}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-editor-active text-gray-200 rounded hover:bg-editor-border transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={actionTitles.copySerialized}
          aria-label={`复制序列化结果，${actionTitles.copySerialized}`}
        >
          <SchemeViewerFooterIcon>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h10m0 0l-3-3m3 3l-3 3m9 7H10m0 0l3 3m-3-3l3-3" />
          </SchemeViewerFooterIcon>
          复制序列化结果
        </button>
      )}
      {canShowApplyEdit && (
        <button
          data-tour="scheme-apply-edit"
          onClick={onApplyEdit}
          disabled={!canApplyEdit}
          className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          title={actionTitles.applyEdit}
          aria-label={`应用修改，${actionTitles.applyEdit}`}
        >
          <SchemeViewerFooterIcon>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </SchemeViewerFooterIcon>
          应用修改
        </button>
      )}
    </div>
  </div>
);
