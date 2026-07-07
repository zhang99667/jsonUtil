import { base64Decode } from './schemeUtils';
import { AiRepairErrorCode, createAiRepairError } from './aiRepairErrors';

export const AI_REMOTE_REPAIR_MAX_INPUT_LENGTH = 200_000;
export const AI_SENSITIVE_INPUT_MESSAGE = '检测到疑似敏感字段，AI 修复默认不会发送原文。请先脱敏 token/sign/cookie/设备标识后再重试';
export const AI_INPUT_TOO_LARGE_MESSAGE = `输入内容过大，AI 修复不会发送超过 ${AI_REMOTE_REPAIR_MAX_INPUT_LENGTH.toLocaleString('en-US')} 字符的原文。请先使用本地格式化或截取片段后再重试`;

const SENSITIVE_FIELD_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: 'token', pattern: /(?:^|[{\s,"'&?])(?:access[_-]?token|refresh[_-]?token|token)["']?\s*[:=]/i },
  { label: 'sign', pattern: /(?:^|[{\s,"'&?])(?:sign|signature|sig)["']?\s*[:=]/i },
  { label: 'cookie', pattern: /(?:^|[{\s,"'&?])(?:cookie|authorization|auth)["']?\s*[:=]/i },
  { label: 'secret', pattern: /(?:^|[{\s,"'&?])(?:secret|api[_-]?key|apikey|akey|password|passwd)["']?\s*[:=]/i },
  { label: 'device', pattern: /(?:^|[{\s,"'&?])(?:device[_-]?id|android[_-]?id|imei(?:sum)?|idfa|oaid(?:[_-]?(?:v|sum))?|cuid)["']?\s*[:=]/i },
];

const SENSITIVE_URL_DECODE_ROUNDS = 5;
const SENSITIVE_MAX_SCAN_TEXTS = 200;
const SENSITIVE_MAX_BASE64_CANDIDATES = 500;
const SENSITIVE_MAX_DECODED_TEXT_LENGTH = 300_000;
const BASE64_SCAN_CANDIDATE_RE = /[A-Za-z0-9+/_-]{16,}(?:={1,2}[A-Za-z0-9+/_-]{8,})?={0,2}/g;

export interface AiRepairRequestPolicy {
  canUseExternalModel: boolean;
  isInputTooLarge: boolean;
  sensitiveLabels: string[];
  rejectionMessage: string | null;
}

const safeDecodeURIComponent = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

const normalizeBase64Candidate = (value: string): string | null => {
  const compact = value.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!compact || compact.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    return null;
  }
  const firstPaddingIndex = compact.indexOf('=');
  if (firstPaddingIndex !== -1 && /[^=]/.test(compact.slice(firstPaddingIndex))) {
    return null;
  }

  const paddingLength = (4 - (compact.length % 4)) % 4;
  return compact + '='.repeat(paddingLength);
};

const isReadableSensitiveDecodedText = (value: string): boolean => {
  if (!value.trim()) return false;
  const controlChars = value.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g);
  return !controlChars || controlChars.length / value.length < 0.05;
};

const safeBase64Decode = (value: string): string | null => {
  const normalized = normalizeBase64Candidate(value);
  if (!normalized) return null;

  try {
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
      bytes[index] = binary.charCodeAt(index);
    }
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return isReadableSensitiveDecodedText(decoded) ? decoded : null;
  } catch {
    return null;
  }
};

const appendSensitiveScanText = (texts: string[], value: string | null | undefined): boolean => {
  if (!value || value.length > SENSITIVE_MAX_DECODED_TEXT_LENGTH || texts.includes(value)) {
    return false;
  }

  if (texts.length >= SENSITIVE_MAX_SCAN_TEXTS) return false;
  texts.push(value);
  return true;
};

const appendUrlDecodedScanTexts = (texts: string[], value: string) => {
  let current = value;
  appendSensitiveScanText(texts, current);

  for (let index = 0; index < SENSITIVE_URL_DECODE_ROUNDS; index++) {
    const decoded = safeDecodeURIComponent(current);
    if (!decoded || decoded === current) break;
    if (!appendSensitiveScanText(texts, decoded)) break;
    current = decoded;
  }
};

const appendBase64DecodedScanTexts = (texts: string[], value: string) => {
  let checkedCount = 0;

  for (const match of value.matchAll(BASE64_SCAN_CANDIDATE_RE)) {
    if (checkedCount >= SENSITIVE_MAX_BASE64_CANDIDATES || texts.length >= SENSITIVE_MAX_SCAN_TEXTS) {
      break;
    }

    checkedCount++;
    const candidate = match[0];
    const decodedTexts = new Set<string>();
    const structuredDecoded = base64Decode(candidate);
    if (structuredDecoded !== candidate) {
      decodedTexts.add(structuredDecoded);
    }

    for (let offset = 0; offset <= 12 && offset < candidate.length; offset++) {
      const decoded = safeBase64Decode(candidate.slice(offset));
      if (decoded) decodedTexts.add(decoded);
    }

    decodedTexts.forEach(decoded => {
      if (decoded.length <= SENSITIVE_MAX_DECODED_TEXT_LENGTH) {
        appendUrlDecodedScanTexts(texts, decoded);
      }
    });
  }
};

const getSensitiveScanTexts = (input: string): string[] => {
  const texts: string[] = [];
  appendUrlDecodedScanTexts(texts, input);

  for (let index = 0; index < texts.length; index++) {
    appendBase64DecodedScanTexts(texts, texts[index]);
  }

  return texts;
};

export const detectAiSensitiveInputLabels = (input: string): string[] => {
  const scanTexts = getSensitiveScanTexts(input);
  const labels = SENSITIVE_FIELD_PATTERNS
    .filter(({ pattern }) => scanTexts.some(text => pattern.test(text)))
    .map(({ label }) => label);

  return Array.from(new Set(labels));
};

export const buildAiRepairRequestPolicy = (input: string): AiRepairRequestPolicy => {
  const isInputTooLarge = input.length > AI_REMOTE_REPAIR_MAX_INPUT_LENGTH;
  if (isInputTooLarge) {
    return {
      canUseExternalModel: false,
      isInputTooLarge,
      sensitiveLabels: [],
      rejectionMessage: AI_INPUT_TOO_LARGE_MESSAGE,
    };
  }

  const sensitiveLabels = detectAiSensitiveInputLabels(input);
  const rejectionMessage = sensitiveLabels.length > 0
    ? `${AI_SENSITIVE_INPUT_MESSAGE}（命中: ${sensitiveLabels.join('/')}）`
    : null;

  return {
    canUseExternalModel: !rejectionMessage,
    isInputTooLarge,
    sensitiveLabels,
    rejectionMessage,
  };
};

export const assertAiRepairInputCanUseExternalModel = (input: string): void => {
  const policy = buildAiRepairRequestPolicy(input);
  if (policy.rejectionMessage) {
    throw createAiRepairError(
      policy.isInputTooLarge ? AiRepairErrorCode.InputTooLarge : AiRepairErrorCode.SensitiveInput,
      policy.rejectionMessage
    );
  }
};
