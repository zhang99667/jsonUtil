import { GoogleGenAI } from "@google/genai";
import { AIConfig, AIProvider } from "../types";
import { base64Decode } from "../utils/schemeUtils";

export const AI_REPAIR_TIMEOUT_MS = 30_000;
export const AI_REPAIR_TIMEOUT_MESSAGE = 'AI 修复超时，请稍后重试或检查网络/模型配置';
export const AI_CONNECTION_TEST_TIMEOUT_MS = 10_000;
export const AI_CONNECTION_TEST_TIMEOUT_MESSAGE = 'AI 连接测试超时，请检查网络/模型配置';
export const AI_SENSITIVE_INPUT_MESSAGE = '检测到疑似敏感字段，AI 修复默认不会发送原文。请先脱敏 token/sign/cookie/设备标识后再重试';

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

interface FixJsonWithAIOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  allowLocalRepair?: boolean;
}

export interface LocalJsonRepairReport {
  fixedJson: string;
  ruleLabels: string[];
}

export interface FixJsonResult {
  fixedJson: string;
  repairMethod: 'local' | 'ai';
  localRuleLabels: string[];
}

interface LocalRepairCandidate {
  value: string;
  ruleLabels: string[];
}

/**
 * 将 AI 返回内容规范化为有效的压缩 JSON，避免解释文本或 Markdown 写回编辑器
 */
export const normalizeAiJsonResponse = (rawText: string): string => {
  const trimmed = rawText.trim();
  if (!trimmed) return '{}';

  const direct = tryNormalizeJson(trimmed);
  if (direct) return direct;

  const fenced = extractMarkdownFence(trimmed);
  if (fenced) {
    const normalized = tryNormalizeJson(fenced);
    if (normalized) return normalized;
  }

  const snippet = extractBalancedJsonSnippet(trimmed);
  if (snippet) {
    const normalized = tryNormalizeJson(snippet);
    if (normalized) return normalized;
  }

  throw new Error('AI 返回内容不是有效 JSON，请重试或调整模型配置');
};

/**
 * 对常见 JSON 小错误做本地确定性修复，能修好时避免把原文发送给模型
 */
export const repairJsonLocally = (input: string): string | null => {
  return repairJsonLocallyWithReport(input)?.fixedJson || null;
};

export const repairJsonLocallyWithReport = (input: string): LocalJsonRepairReport | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const candidates = new Map<string, LocalRepairCandidate>();
  const appendCandidate = (value: string, ruleLabels: string[]) => {
    if (!value.trim()) return;
    if (!candidates.has(value)) {
      candidates.set(value, { value, ruleLabels });
    }

    const escapedControls = escapeRawControlsInDoubleQuotedStrings(value);
    if (escapedControls !== value && !candidates.has(escapedControls)) {
      candidates.set(escapedControls, {
        value: escapedControls,
        ruleLabels: [...ruleLabels, '转义字符串内换行/控制字符'],
      });
    }
  };

  const strippedComments = stripJsonComments(trimmed);
  const baseCandidates: LocalRepairCandidate[] = [
    { value: trimmed, ruleLabels: [] },
    ...(strippedComments !== trimmed
      ? [{ value: strippedComments, ruleLabels: ['移除 JSON 注释'] }]
      : []),
  ];

  baseCandidates.forEach(base => {
    appendCandidate(base.value, base.ruleLabels);

    const withoutTrailingCommas = removeTrailingCommas(base.value);
    appendCandidate(
      withoutTrailingCommas,
      appendRepairRuleLabel(
        base.ruleLabels,
        withoutTrailingCommas !== base.value,
        '移除尾随逗号'
      )
    );

    const looseNormalized = normalizeLooseJsonSyntax(base.value);
    const looseRuleLabels = appendRepairRuleLabel(
      base.ruleLabels,
      looseNormalized !== base.value,
      '修正常见 JS 对象写法'
    );
    appendCandidate(
      looseNormalized,
      looseRuleLabels
    );

    const looseWithoutTrailingCommas = removeTrailingCommas(looseNormalized);
    appendCandidate(
      looseWithoutTrailingCommas,
      appendRepairRuleLabel(
        looseRuleLabels,
        looseWithoutTrailingCommas !== looseNormalized,
        '移除尾随逗号'
      )
    );
  });

  for (const candidate of candidates.values()) {
    const normalized = tryNormalizeJson(candidate.value);
    if (normalized) {
      return {
        fixedJson: normalized,
        ruleLabels: Array.from(new Set(
          candidate.ruleLabels.length > 0 ? candidate.ruleLabels : ['规范化 JSON']
        )),
      };
    }
  }

  return null;
};

const appendRepairRuleLabel = (
  ruleLabels: string[],
  shouldAppend: boolean,
  label: string
): string[] => (shouldAppend ? [...ruleLabels, label] : ruleLabels);

interface JsonStringScanState {
  inString: boolean;
  quote: string;
  escaped: boolean;
}

const createJsonStringScanState = (): JsonStringScanState => ({
  inString: false,
  quote: '',
  escaped: false,
});

const enterJsonStringIfQuote = (
  state: JsonStringScanState,
  char: string,
  allowedQuotes: string
): boolean => {
  if (!allowedQuotes.includes(char)) return false;

  state.inString = true;
  state.quote = char;
  state.escaped = false;
  return true;
};

const advanceJsonStringScanState = (state: JsonStringScanState, char: string) => {
  if (state.escaped) {
    state.escaped = false;
    return;
  }

  if (char === '\\') {
    state.escaped = true;
    return;
  }

  if (char === state.quote) {
    state.inString = false;
    state.quote = '';
  }
};

const stripJsonComments = (source: string): string => {
  let output = '';
  const stringState = createJsonStringScanState();

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    const next = source[index + 1];

    if (stringState.inString) {
      output += char;
      advanceJsonStringScanState(stringState, char);
      continue;
    }

    if (enterJsonStringIfQuote(stringState, char, '"\'')) {
      output += char;
      continue;
    }

    if (char === '/' && next === '/') {
      while (index + 1 < source.length && source[index + 1] !== '\n') {
        index++;
      }
      continue;
    }

    if (char === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        index++;
      }
      index++;
      continue;
    }

    output += char;
  }

  return output;
};

const removeTrailingCommas = (source: string): string => {
  let output = '';
  const stringState = createJsonStringScanState();

  for (let index = 0; index < source.length; index++) {
    const char = source[index];

    if (stringState.inString) {
      output += char;
      advanceJsonStringScanState(stringState, char);
      continue;
    }

    if (enterJsonStringIfQuote(stringState, char, '"\'')) {
      output += char;
      continue;
    }

    if (char === ',') {
      let nextIndex = index + 1;
      while (/\s/.test(source[nextIndex] || '')) {
        nextIndex++;
      }
      if (source[nextIndex] === '}' || source[nextIndex] === ']') {
        continue;
      }
    }

    output += char;
  }

  return output;
};

const normalizeLooseJsonSyntax = (source: string): string => (
  quoteBareObjectKeys(convertSingleQuotedStrings(source))
);

const convertSingleQuotedStrings = (source: string): string => (
  source.replace(/'((?:\\.|[^'\\])*)'/g, (_, content: string) => (
    JSON.stringify(content.replace(/\\'/g, "'"))
  ))
);

const quoteBareObjectKeys = (source: string): string => {
  let output = '';
  const stringState = createJsonStringScanState();

  for (let index = 0; index < source.length; index++) {
    const char = source[index];

    if (stringState.inString) {
      output += char;
      advanceJsonStringScanState(stringState, char);
      continue;
    }

    if (enterJsonStringIfQuote(stringState, char, '"')) {
      output += char;
      continue;
    }

    if (char === '{' || char === ',') {
      output += char;
      index++;
      while (/\s/.test(source[index] || '')) {
        output += source[index];
        index++;
      }

      const match = source.slice(index).match(/^([A-Za-z_$][\w$]*)(\s*:)/);
      if (match) {
        output += `"${match[1]}"${match[2]}`;
        index += match[0].length - 1;
        continue;
      }

      index--;
      continue;
    }

    output += char;
  }

  return output;
};

const escapeRawControlsInDoubleQuotedStrings = (source: string): string => {
  let output = '';
  const stringState = createJsonStringScanState();

  for (let index = 0; index < source.length; index++) {
    const char = source[index];

    if (!stringState.inString) {
      output += char;
      enterJsonStringIfQuote(stringState, char, '"');
      continue;
    }

    if (stringState.escaped || char === '\\' || char === '"') {
      output += char;
      advanceJsonStringScanState(stringState, char);
      continue;
    }

    if (char === '\r' || char === '\n') {
      output += '\\n';
      if (char === '\r' && source[index + 1] === '\n') index++;
      continue;
    }

    if (char === '\t') {
      output += '\\t';
      continue;
    }

    output += char < ' '
      ? `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`
      : char;
  }

  return output;
};

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

export const fixJsonWithAI = async (
  brokenJson: string,
  config: AIConfig,
  options: FixJsonWithAIOptions = {}
): Promise<string> => {
  const result = await fixJsonWithRepairDetails(brokenJson, config, options);
  return result.fixedJson;
};

export const fixJsonWithRepairDetails = async (
  brokenJson: string,
  config: AIConfig,
  options: FixJsonWithAIOptions = {}
): Promise<FixJsonResult> => {
  if (options.allowLocalRepair !== false) {
    const localReport = repairJsonLocallyWithReport(brokenJson);
    if (localReport) {
      return {
        fixedJson: localReport.fixedJson,
        repairMethod: 'local',
        localRuleLabels: localReport.ruleLabels,
      };
    }
  }

  const sensitiveLabels = detectAiSensitiveInputLabels(brokenJson);
  if (sensitiveLabels.length > 0) {
    throw new Error(`${AI_SENSITIVE_INPUT_MESSAGE}（命中: ${sensitiveLabels.join('/')}）`);
  }

  // 检查 API Key
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('API Key 未配置，请先在设置中配置 API Key');
  }

  const timeoutMs = options.timeoutMs ?? AI_REPAIR_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;

  try {
    // Gemini 接口调用
    if (config.provider === AIProvider.GEMINI) {
      const ai = new GoogleGenAI({ apiKey: config.apiKey });

      const response = await withTimeout(ai.models.generateContent({
        model: config.model || 'gemini-2.0-flash',
        contents: `You are a JSON repair tool. 
        I have a malformed JSON string. Please repair it.
        
        Rules:
        1. Return ONLY the raw, valid, minified JSON string. 
        2. Do NOT include markdown formatting (no \`\`\`json ... \`\`\`).
        3. Do NOT include any explanations.
        4. If the input is not recoverable, return an empty object "{}".

        Input:
        ${brokenJson}`,
      }), timeoutMs);

      const text = response.text;
      return {
        fixedJson: normalizeAiJsonResponse(text || '{}'),
        repairMethod: 'ai',
        localRuleLabels: [],
      };
    }

    // OpenAI 兼容接口调用 (OpenAI, Qwen, GLM, DeepSeek, Custom)
    const baseUrl = getOpenAICompatibleBaseUrl(config);
    const abortController = new AbortController();

    const response = await withTimeout(fetchImpl(buildChatCompletionsUrl(baseUrl), {
      method: 'POST',
      signal: abortController.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || getDefaultModel(config.provider),
        messages: [
          {
            role: 'system',
            content: 'You are a JSON repair tool. Return ONLY valid, minified JSON. No markdown, no explanations.'
          },
          {
            role: 'user',
            content: `Repair this malformed JSON. If not recoverable, return "{}". Input:\n${brokenJson}`
          }
        ],
        temperature: 0.1,
      }),
    }), timeoutMs, () => abortController.abort());

    if (!response.ok) {
      const errorText = await response.text();

      // 根据 HTTP 状态码提供更友好的错误信息
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查配置');
      } else if (response.status === 429) {
        throw new Error('API 调用频率超限，请稍后重试');
      } else if (response.status >= 500) {
        throw new Error('AI 服务暂时不可用，请稍后重试');
      }

      throw new Error(`API 错误 (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '{}';

    return {
      fixedJson: normalizeAiJsonResponse(text),
      repairMethod: 'ai',
      localRuleLabels: [],
    };
  } catch (error: unknown) {
    console.error("Error calling AI API:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // 如果已经是我们自定义的错误信息，直接抛出
    if (
      errorMessage.includes('API Key') ||
      errorMessage.includes('API 错误') ||
      errorMessage.includes('服务') ||
      errorMessage.includes('AI 返回内容') ||
      errorMessage.includes(AI_SENSITIVE_INPUT_MESSAGE) ||
      errorMessage.includes('超时')
    ) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(AI_REPAIR_TIMEOUT_MESSAGE);
    }

    // 网络错误
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      throw new Error('网络连接失败，请检查网络后重试');
    }

    // 其他未知错误
    throw new Error('AI 修复失败: ' + errorMessage);
  }
};

export const testAIConnection = async (
  config: AIConfig,
  options: FixJsonWithAIOptions = {}
): Promise<void> => {
  try {
    await fixJsonWithAI('{connection:true}', config, {
      ...options,
      timeoutMs: options.timeoutMs ?? AI_CONNECTION_TEST_TIMEOUT_MS,
      allowLocalRepair: false,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === AI_REPAIR_TIMEOUT_MESSAGE) {
      throw new Error(AI_CONNECTION_TEST_TIMEOUT_MESSAGE);
    }
    throw error;
  }
};

const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout?: () => void
): Promise<T> => {
  if (timeoutMs <= 0) return promise;

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      settled = true;
      onTimeout?.();
      reject(new Error(AI_REPAIR_TIMEOUT_MESSAGE));
    }, timeoutMs);

    promise.then(
      value => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      error => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        reject(error);
      }
    );
  });
};

const getOpenAICompatibleBaseUrl = (config: AIConfig): string => {
  const configuredBaseUrl = config.baseUrl?.trim();
  return configuredBaseUrl || getDefaultBaseUrl(config.provider);
};

const buildChatCompletionsUrl = (baseUrl: string): string => {
  // 兼容用户从平台复制 Base URL 时带尾部斜杠的情况，避免拼出 //chat/completions。
  return `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
};

const tryNormalizeJson = (candidate: string): string | null => {
  try {
    return JSON.stringify(JSON.parse(candidate));
  } catch {
    return null;
  }
};

const extractMarkdownFence = (text: string): string | null => {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
};

const extractBalancedJsonSnippet = (text: string): string | null => {
  for (let i = 0; i < text.length; i++) {
    const start = text[i];
    if (start !== '{' && start !== '[') continue;

    const endStack = [start === '{' ? '}' : ']'];
    let inString = false;
    let escaped = false;

    for (let j = i + 1; j < text.length; j++) {
      const char = text[j];

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
          return text.slice(i, j + 1);
        }
      }
    }
  }

  return null;
};

function getDefaultBaseUrl(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.OPENAI:
      return 'https://api.openai.com/v1';
    case AIProvider.QWEN:
      return 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    case AIProvider.ERNIE:
      return 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1';
    case AIProvider.GLM:
      return 'https://open.bigmodel.cn/api/paas/v4';
    case AIProvider.DEEPSEEK:
      return 'https://api.deepseek.com/v1';
    default:
      return 'https://api.openai.com/v1';
  }
}

function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case AIProvider.GEMINI:
      return 'gemini-2.0-flash';
    case AIProvider.OPENAI:
      return 'gpt-4o-mini';
    case AIProvider.QWEN:
      return 'qwen-max';
    case AIProvider.ERNIE:
      return 'ernie-4.0-8k';
    case AIProvider.GLM:
      return 'glm-4';
    case AIProvider.DEEPSEEK:
      return 'deepseek-chat';
    default:
      return 'gpt-4o-mini';
  }
}
