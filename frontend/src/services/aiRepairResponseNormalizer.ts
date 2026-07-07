import { AiRepairErrorCode, createAiRepairError } from '../utils/aiRepairErrors';

/**
 * 将 AI 返回内容规范化为有效的压缩 JSON，避免解释文本或 Markdown 写回编辑器
 */
const AI_INVALID_JSON_RESPONSE_MESSAGE = 'AI 返回内容不是有效 JSON，请重试或调整模型配置';
const AI_RESPONSE_SNIPPET_SCAN_TEXT_MAX_LENGTH = 240_000;
const AI_RESPONSE_SNIPPET_SCAN_CHAR_BUDGET = 2_000_000;

export const normalizeAiJsonResponse = (rawText: string): string => {
  const trimmed = rawText.trim();
  if (!trimmed) throw createAiRepairError(AiRepairErrorCode.InvalidResponse, AI_INVALID_JSON_RESPONSE_MESSAGE);

  const direct = tryNormalizeJson(trimmed);
  if (direct) return direct;

  const fenced = normalizeFirstValidCandidate(extractMarkdownFences(trimmed));
  if (fenced) return fenced;

  const snippet = normalizeLastValidCandidate(extractBalancedJsonSnippets(trimmed));
  if (snippet) return snippet;

  throw createAiRepairError(AiRepairErrorCode.InvalidResponse, AI_INVALID_JSON_RESPONSE_MESSAGE);
};

export const tryNormalizeJson = (candidate: string): string | null => {
  try {
    return JSON.stringify(JSON.parse(candidate));
  } catch {
    return null;
  }
};

const normalizeFirstValidCandidate = (candidates: string[]): string | null => {
  for (const candidate of candidates) {
    const normalized = tryNormalizeJson(candidate);
    if (normalized) return normalized;
  }

  return null;
};

const normalizeLastValidCandidate = (candidates: string[]): string | null => {
  for (let index = candidates.length - 1; index >= 0; index--) {
    const normalized = tryNormalizeJson(candidates[index]);
    if (normalized) return normalized;
  }

  return null;
};

const extractMarkdownFences = (text: string): string[] => {
  const matches = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
  return Array.from(matches, match => match[1].trim()).filter(Boolean);
};

const extractBalancedJsonSnippets = (text: string): string[] => {
  const scanText = getAiResponseSnippetScanText(text);
  const snippets: string[] = [];
  let remainingScanChars = AI_RESPONSE_SNIPPET_SCAN_CHAR_BUDGET;

  for (let i = 0; i < scanText.length && remainingScanChars > 0; i++) {
    const start = scanText[i];
    if (start !== '{' && start !== '[') continue;

    const endStack = [start === '{' ? '}' : ']'];
    let inString = false;
    let escaped = false;

    for (let j = i + 1; j < scanText.length && remainingScanChars > 0; j++, remainingScanChars--) {
      const char = scanText[j];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') {
        endStack.push('}');
      } else if (char === '[') {
        endStack.push(']');
      } else if (char === endStack[endStack.length - 1]) {
        endStack.pop();
        if (endStack.length === 0) {
          snippets.push(scanText.slice(i, j + 1));
          i = j;
          break;
        }
      }
    }
  }

  return snippets;
};

const getAiResponseSnippetScanText = (text: string): string => (
  text.length > AI_RESPONSE_SNIPPET_SCAN_TEXT_MAX_LENGTH
    ? text.slice(-AI_RESPONSE_SNIPPET_SCAN_TEXT_MAX_LENGTH)
    : text
);
