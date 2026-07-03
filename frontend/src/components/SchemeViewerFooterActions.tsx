import React from 'react';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import { SchemeViewerFooterActionButton } from './SchemeViewerFooterActionButton';

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
        <SchemeViewerFooterActionButton
          dataTour="scheme-cancel-decode"
          onClick={onCancelDecode}
          tone="warning"
          label="取消解析"
          title="停止当前大内容解析"
          ariaLabel="取消解析，停止当前大内容解析"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
        />
      )}
      <button
        type="button"
        data-tour="scheme-close-button"
        onClick={onClose}
        className="shrink-0 whitespace-nowrap px-2.5 py-1 text-sm text-gray-400 hover:text-white transition-colors"
        title="关闭 Scheme 解析"
        aria-label="关闭 Scheme 解析"
      >
        关闭
      </button>
      <SchemeViewerFooterActionButton
        dataTour="scheme-qrcode-button"
        onClick={onToggleQRCode}
        disabled={!canShowQRCode}
        ariaPressed={showQRCode}
        ariaLabel={`二维码，${actionTitles.qrCode}`}
        tone={showQRCode ? 'success' : 'neutral'}
        label="二维码"
        title={actionTitles.qrCode}
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />}
      />
      <SchemeViewerFooterActionButton
        dataTour="scheme-copy-original"
        onClick={onCopyOriginal}
        disabled={!canCopyOriginal}
        title={actionTitles.copyOriginal}
        ariaLabel={`复制原始值，${actionTitles.copyOriginal}`}
        label="复制原始值"
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />}
      />
      <SchemeViewerFooterActionButton
        dataTour="scheme-copy-decoded"
        onClick={onCopyDecoded}
        disabled={!canCopyDecoded}
        title={actionTitles.copyDecoded}
        ariaLabel={`复制解码结果，${actionTitles.copyDecoded}`}
        label="复制解码结果"
        icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />}
      />
      {hasCommandSummary && (
        <SchemeViewerFooterActionButton
          dataTour="scheme-copy-cmd-structure"
          onClick={onCopyCmdStructure}
          disabled={!canCopyCmdStructure}
          title={actionTitles.copyCmdStructure}
          ariaLabel={`复制 CMD 结构，${actionTitles.copyCmdStructure}`}
          label="复制 CMD 结构"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 12h8M8 17h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />}
        />
      )}
      {isJsonResult && (
        <SchemeViewerFooterActionButton
          dataTour="scheme-copy-path-values"
          onClick={onCopyPathValues}
          disabled={!canCopyPathValues}
          title={actionTitles.copyPathValues}
          ariaLabel={`复制路径和值，${actionTitles.copyPathValues}`}
          label="复制路径和值"
          icon={(
            <>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M8 4h8l4 4v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 4v4h4" />
            </>
          )}
        />
      )}
      {isStandalone && hasDecodeLayers && (
        <SchemeViewerFooterActionButton
          dataTour="scheme-copy-serialized"
          onClick={onCopySerialized}
          disabled={!canCopySerializedContent}
          title={actionTitles.copySerialized}
          ariaLabel={`复制序列化结果，${actionTitles.copySerialized}`}
          label="复制序列化结果"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h10m0 0l-3-3m3 3l-3 3m9 7H10m0 0l3 3m-3-3l3-3" />}
        />
      )}
      {canShowApplyEdit && (
        <SchemeViewerFooterActionButton
          dataTour="scheme-apply-edit"
          onClick={onApplyEdit}
          disabled={!canApplyEdit}
          title={actionTitles.applyEdit}
          ariaLabel={`应用修改，${actionTitles.applyEdit}`}
          tone="primary"
          label="应用修改"
          icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />}
        />
      )}
    </div>
  </div>
);
