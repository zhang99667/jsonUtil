import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatByteSize } from '../utils/documentStats';
import { getSchemeViewerQrCodeCapacity } from '../utils/schemeViewerQrCode';

export type SchemeViewerQRCodeType = 'original' | 'decoded';

interface SchemeViewerQRCodePanelProps {
  isVisible: boolean;
  qrCodeType: SchemeViewerQRCodeType;
  originalContent: string;
  decodedContent: string;
  isDecodePending: boolean;
  qrCodeRef: React.Ref<HTMLCanvasElement>;
  onTypeChange: (type: SchemeViewerQRCodeType) => void;
  onDownload: () => void;
}

export const SchemeViewerQRCodePanel: React.FC<SchemeViewerQRCodePanelProps> = ({
  isVisible,
  qrCodeType,
  originalContent,
  decodedContent,
  isDecodePending,
  qrCodeRef,
  onTypeChange,
  onDownload,
}) => {
  if (!isVisible) return null;

  const qrCodeContent = qrCodeType === 'decoded' && isDecodePending
    ? ''
    : (qrCodeType === 'original' ? originalContent : decodedContent);
  const capacity = getSchemeViewerQrCodeCapacity(qrCodeContent);
  const sizeLabel = `${qrCodeContent.length} 字符 / ${formatByteSize(capacity.utf8ByteLength)}`;
  const modeLabel = capacity.mode === 'numeric'
    ? '数字模式'
    : capacity.mode === 'alphanumeric'
      ? '字母数字模式'
      : '字节模式';
  const limitUnit = capacity.mode === 'byte' ? '字节' : '字符';

  return (
    <div className="bg-editor-sidebar rounded p-3 border border-editor-border">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-500 font-medium flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          二维码
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-editor-bg rounded p-0.5 text-xs">
            <button
              data-tour="scheme-qrcode-original"
              type="button"
              onClick={() => onTypeChange('original')}
              aria-pressed={qrCodeType === 'original'}
              className={`px-2 py-1 rounded transition-colors ${
                qrCodeType === 'original'
                  ? 'bg-editor-active text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              原始值
            </button>
            <button
              data-tour="scheme-qrcode-decoded"
              type="button"
              onClick={() => onTypeChange('decoded')}
              aria-pressed={qrCodeType === 'decoded'}
              className={`px-2 py-1 rounded transition-colors ${
                qrCodeType === 'decoded'
                  ? 'bg-editor-active text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              解码结果
            </button>
          </div>
          <button
            data-tour="scheme-qrcode-download"
            type="button"
            onClick={onDownload}
            disabled={!capacity.canRender}
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

      <div data-tour="scheme-qrcode-preview" className="flex flex-col items-center justify-center py-4 bg-white rounded">
        {capacity.canRender ? (
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
              {capacity.blockReason === 'empty'
                ? '无内容可生成二维码'
                : capacity.blockReason === 'invalid-unicode'
                  ? '内容包含不完整的 Unicode 字符，无法生成二维码'
                  : `内容过长，无法生成二维码（M 级${modeLabel}最多 ${capacity.maxInputLength} ${limitUnit}）`}
            </p>
            {qrCodeContent && <p className="text-xs mt-1">当前大小: {sizeLabel}</p>}
          </div>
        )}
      </div>

      {capacity.canRender && (
        <div className="text-xs text-gray-500 text-center mt-2">
          {qrCodeType === 'original' ? '原始值' : '解码结果'}: {sizeLabel}
        </div>
      )}
    </div>
  );
};
