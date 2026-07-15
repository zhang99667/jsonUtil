import { getDocumentStats } from './documentStats';

export const SCHEME_QR_CODE_LEVEL_M_MAX_BYTES = 2_331;
export const SCHEME_QR_CODE_LEVEL_M_MAX_ALPHANUMERIC_CHARACTERS = 3_391;
export const SCHEME_QR_CODE_LEVEL_M_MAX_NUMERIC_CHARACTERS = 5_596;

export type SchemeViewerQrCodeMode = 'numeric' | 'alphanumeric' | 'byte';
export type SchemeViewerQrCodeBlockReason = 'empty' | 'too-long' | 'invalid-unicode' | null;

export interface SchemeViewerQrCodeCapacity {
  canRender: boolean;
  blockReason: SchemeViewerQrCodeBlockReason;
  maxInputLength: number;
  mode: SchemeViewerQrCodeMode;
  utf8ByteLength: number;
}

const QR_CODE_ALPHANUMERIC_PATTERN = /^[A-Z0-9 $%*+./:-]+$/;

const getQrCodeMode = (content: string): SchemeViewerQrCodeMode => {
  if (/^\d+$/.test(content)) return 'numeric';
  if (QR_CODE_ALPHANUMERIC_PATTERN.test(content)) return 'alphanumeric';
  return 'byte';
};

export const getSchemeViewerQrCodeCapacity = (
  content: string,
): SchemeViewerQrCodeCapacity => {
  const { utf8ByteLength } = getDocumentStats(content);
  const mode = getQrCodeMode(content);
  const maxInputLength = mode === 'numeric'
    ? SCHEME_QR_CODE_LEVEL_M_MAX_NUMERIC_CHARACTERS
    : mode === 'alphanumeric'
      ? SCHEME_QR_CODE_LEVEL_M_MAX_ALPHANUMERIC_CHARACTERS
      : SCHEME_QR_CODE_LEVEL_M_MAX_BYTES;
  const inputLength = mode === 'byte' ? utf8ByteLength : content.length;

  let blockReason: SchemeViewerQrCodeBlockReason = null;
  if (!content) {
    blockReason = 'empty';
  } else if (inputLength > maxInputLength) {
    blockReason = 'too-long';
  } else if (mode === 'byte') {
    try {
      encodeURI(content);
    } catch {
      blockReason = 'invalid-unicode';
    }
  }

  return {
    canRender: blockReason === null,
    blockReason,
    maxInputLength,
    mode,
    utf8ByteLength,
  };
};
