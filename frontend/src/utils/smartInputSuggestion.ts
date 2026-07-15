import { TransformMode } from '../types';
import { parseJsonLinesDetailed } from './jsonLines';
import { detectSchemeType, isActionableSchemeUrl, isUrl, shouldExposeSchemeValue } from './schemeUtils';
import { normalizeSmartSuggestionText } from './smartSuggestionText';
import { parseJsonWithFallback } from './storage';

export type SmartSuggestionActionId =
  | 'response-inspection'
  | 'deep-format-report'
  | 'scheme-panel'
  | 'structure-nav'
  | 'schema-panel'
  | 'json-to-typescript'
  | 'ai-fix'
  | 'url-decode';

export interface SmartSuggestionAction {
  id: SmartSuggestionActionId;
  label: string;
}

export interface SmartInputSuggestion {
  id: string;
  title: string;
  description: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'violet' | 'rose';
  actions: SmartSuggestionAction[];
}

interface JsonContentSignal {
  nodeCount: number;
  stringCount: number;
  containerCount: number;
  arrayCount: number;
  actionableStringCount: number;
  urlStringCount: number;
  maxDepth: number;
}

const MAX_JSON_PARSE_LENGTH = 220_000;
const MAX_TEXT_SCAN_LENGTH = 120_000;
const MAX_JSON_SIGNAL_NODES = 1_800;
const MAX_JSON_SIGNAL_STRINGS = 600;
const ACTIONABLE_FIELD_RE = /"(?:action_?cmd|button_?cmd|panel_?cmd|cmd|schema|scheme|url|params?|payload|ext|extra)[^"]*"\s*:/i;
const URL_ENCODED_RE = /%[0-9A-Fa-f]{2}/;
const JSON_LINES_ERROR_LINE_RE = /JSON Lines 第\s*(\d+)\s*行解析错误/;
const JSON_LINE_PREFIX_RE = /^[{\["tfn\-\d]/;

const createAction = (id: SmartSuggestionActionId, label: string): SmartSuggestionAction => ({
  id,
  label,
});

const isJsonContainer = (value: unknown): value is Record<string, unknown> | unknown[] => (
  Boolean(value) && typeof value === 'object'
);

const tryParseJsonContainer = (source: string): unknown | null => {
  if (source.length > MAX_JSON_PARSE_LENGTH) return null;

  return parseJsonWithFallback<Record<string, unknown> | unknown[] | null>(
    source,
    null,
    isJsonContainer
  );
};

const createEmptyJsonSignal = (): JsonContentSignal => ({
  nodeCount: 0,
  stringCount: 0,
  containerCount: 0,
  arrayCount: 0,
  actionableStringCount: 0,
  urlStringCount: 0,
  maxDepth: 0,
});

const collectJsonContentSignal = (value: unknown): JsonContentSignal => {
  const signal = createEmptyJsonSignal();
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];

  while (stack.length > 0 && signal.nodeCount < MAX_JSON_SIGNAL_NODES) {
    const current = stack.pop();
    if (!current) break;

    signal.nodeCount += 1;
    signal.maxDepth = Math.max(signal.maxDepth, current.depth);

    if (typeof current.value === 'string') {
      if (signal.stringCount >= MAX_JSON_SIGNAL_STRINGS) continue;
      signal.stringCount += 1;
      if (shouldExposeSchemeValue(current.value)) {
        signal.actionableStringCount += 1;
      } else if (isUrl(current.value)) {
        signal.urlStringCount += 1;
      }
      continue;
    }

    if (Array.isArray(current.value)) {
      signal.containerCount += 1;
      signal.arrayCount += 1;
      for (let index = Math.min(current.value.length - 1, 80); index >= 0; index--) {
        stack.push({ value: current.value[index], depth: current.depth + 1 });
      }
      continue;
    }

    if (current.value && typeof current.value === 'object') {
      signal.containerCount += 1;
      Object.values(current.value as Record<string, unknown>)
        .slice(0, 80)
        .reverse()
        .forEach(child => {
          stack.push({ value: child, depth: current.depth + 1 });
        });
    }
  }

  return signal;
};

const isLikelyJsonContainerText = (source: string): boolean => (
  source.startsWith('{') || source.startsWith('[')
);

const isLikelyJsonLinesText = (source: string): boolean => {
  if (!source.includes('\n')) return false;

  const lines = source
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  return lines.length >= 2 && lines.every(line => (
    JSON_LINE_PREFIX_RE.test(line) && line !== '{' && line !== '['
  ));
};

const hasEncodedJsonHint = (source: string): boolean => (
  /%7B|%7D|%5B|%5D|%22|%3A/i.test(source)
);

const hasActionableTextHint = (source: string): boolean => (
  ACTIONABLE_FIELD_RE.test(source) ||
  /(?:sampleapp|samplevendor|wise|vendor|cmdHandler):\/\//i.test(source) ||
  /(?:action_?cmd|panel_?cmd|button_?cmd|cmd|schema|scheme)=/i.test(source)
);

const buildJsonSuggestion = (
  parsed: unknown,
  sample: string
): SmartInputSuggestion => {
  const signal = collectJsonContentSignal(parsed);

  if (signal.actionableStringCount > 0) {
    return {
      id: 'json-with-cmd',
      title: '检测到 JSON 内含 CMD / Scheme',
      description: `建议先做嵌套解析和结构浏览，已命中 ${Math.max(signal.actionableStringCount, 1)} 个可展开字符串；需要复盘时再进入高级排查。`,
      tone: 'cyan',
      actions: [
        createAction('deep-format-report', '嵌套解析'),
        createAction('structure-nav', '结构导航'),
        createAction('response-inspection', '高级排查'),
      ],
    };
  }

  if (signal.nodeCount >= 30 || signal.maxDepth >= 4 || signal.arrayCount >= 2) {
    return {
      id: 'json-structure',
      title: '适合用结构导航浏览',
      description: `已识别 ${signal.nodeCount} 个节点、最大深度 ${signal.maxDepth}，可搜索路径并定位字段。`,
      tone: 'emerald',
      actions: [
        createAction('structure-nav', '结构导航'),
        createAction('schema-panel', 'Schema'),
        createAction('json-to-typescript', '转 TS'),
      ],
    };
  }

  return {
    id: 'json-modeling',
    title: '可以生成类型或 Schema',
    description: '当前是合法 JSON，可直接生成 TypeScript 类型，也可以沉淀 JSON Schema。',
    tone: 'violet',
    actions: [
      createAction('json-to-typescript', '转 TS'),
      createAction('schema-panel', 'Schema'),
      createAction('structure-nav', '结构导航'),
    ],
  };
};

const getJsonLinesErrorLineNumber = (error?: string): number | null => {
  if (!error) return null;
  const match = error.match(JSON_LINES_ERROR_LINE_RE);
  return match ? Number(match[1]) : null;
};

const hasParsableJsonLineBefore = (source: string, lineNumber: number): boolean => (
  source
    .split(/\r?\n/)
    .slice(0, Math.max(lineNumber - 1, 0))
    .some(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      try {
        JSON.parse(trimmed);
        return true;
      } catch {
        return false;
      }
    })
);

const buildJsonLinesSuggestion = (source: string): SmartInputSuggestion | null => {
  if (source.length > MAX_JSON_PARSE_LENGTH) return null;

  const diagnostic = parseJsonLinesDetailed(source);
  if (diagnostic.records) {
    const lineValues = diagnostic.records.map(record => record.value);
    const signal = collectJsonContentSignal(lineValues);

    if (signal.actionableStringCount > 0) {
      return {
        id: 'json-lines-with-cmd',
        title: '检测到 JSON Lines 内含 CMD / Scheme',
        description: `已识别 ${diagnostic.records.length} 行，其中包含 ${Math.max(signal.actionableStringCount, 1)} 个可展开字符串，建议先嵌套解析并查看虚拟数组结构。`,
        tone: 'cyan',
        actions: [
          createAction('deep-format-report', '嵌套解析'),
          createAction('structure-nav', '结构导航'),
          createAction('response-inspection', '高级排查'),
        ],
      };
    }

    return {
      id: 'json-lines-structure',
      title: '检测到 JSON Lines / NDJSON',
      description: `已识别 ${diagnostic.records.length} 行 JSON，可按虚拟数组浏览结构，也可以直接生成 TypeScript 类型。`,
      tone: 'emerald',
      actions: [
        createAction('structure-nav', '结构导航'),
        createAction('json-to-typescript', '转 TS'),
        createAction('deep-format-report', '嵌套解析'),
      ],
    };
  }

  const errorLineNumber = getJsonLinesErrorLineNumber(diagnostic.error);
  if (
    diagnostic.error &&
    errorLineNumber &&
    errorLineNumber > 1 &&
    hasParsableJsonLineBefore(source, errorLineNumber)
  ) {
    return {
      id: 'malformed-json-lines',
      title: `JSON Lines 第 ${errorLineNumber} 行可能有语法错误`,
      description: diagnostic.error,
      tone: 'rose',
      actions: [
        createAction('ai-fix', '智能修复'),
      ],
    };
  }

  return null;
};

const buildStandaloneSuggestion = (source: string): SmartInputSuggestion | null => {
  const schemeType = detectSchemeType(source);

  if (shouldExposeSchemeValue(source)) {
    const actionLabel = schemeType === 'base64'
      ? '解析 Base64'
      : schemeType === 'url-encoded'
        ? '解析编码内容'
        : 'Scheme 解析';

    return {
      id: 'standalone-scheme',
      title: '检测到可展开的 CMD / Scheme',
      description: '建议打开 Scheme 面板查看 URL Decode、参数分层和可回写性。',
      tone: 'cyan',
      actions: [
        createAction('scheme-panel', actionLabel),
        createAction('deep-format-report', '嵌套解析'),
      ],
    };
  }

  if (schemeType === 'url-encoded' || (URL_ENCODED_RE.test(source) && hasEncodedJsonHint(source))) {
    return {
      id: 'url-encoded',
      title: '检测到 URL 编码内容',
      description: '这更像普通编码文本，先 URL 解码后再判断是否需要结构化解析。',
      tone: 'amber',
      actions: [
        createAction('url-decode', 'URL 解码'),
        createAction('deep-format-report', '嵌套解析'),
      ],
    };
  }

  if (isUrl(source) && !isActionableSchemeUrl(source)) {
    return {
      id: 'plain-url',
      title: '检测到普通 URL',
      description: '普通 HTTP(S) 链接不会直接当成业务 Scheme，可先做 URL 解码或复制参数排查。',
      tone: 'emerald',
      actions: [
        createAction('url-decode', 'URL 解码'),
      ],
    };
  }

  return null;
};

export const getSmartInputSuggestion = (sourceText: string): SmartInputSuggestion | null => {
  const source = normalizeSmartSuggestionText(sourceText);
  if (!source) return null;

  const sample = source.slice(0, MAX_TEXT_SCAN_LENGTH);
  const parsed = tryParseJsonContainer(source);
  if (parsed) {
    return buildJsonSuggestion(parsed, sample);
  }

  const jsonLinesSuggestion = buildJsonLinesSuggestion(source);
  if (jsonLinesSuggestion) return jsonLinesSuggestion;

  const standaloneSuggestion = buildStandaloneSuggestion(source);
  if (standaloneSuggestion) return standaloneSuggestion;

  if (source.length > MAX_JSON_PARSE_LENGTH && isLikelyJsonLinesText(source)) {
    return {
      id: 'large-json-lines',
      title: '检测到较大的 JSON Lines 候选',
      description: '输入较大，建议先在本地按虚拟数组打开结构导航，或用嵌套解析报告查看行内 CMD / JSON 字符串。',
      tone: 'emerald',
      actions: [
        createAction('structure-nav', '结构导航'),
        createAction('deep-format-report', '嵌套解析'),
      ],
    };
  }

  if (isLikelyJsonContainerText(source) && source.length > MAX_JSON_PARSE_LENGTH) {
    return {
      id: 'large-json',
      title: '检测到较大的 JSON 候选',
      description: '输入较大，建议先用本地结构导航异步浏览，再按需生成 Schema 或类型。',
      tone: 'emerald',
      actions: [
        createAction('structure-nav', '结构导航'),
        createAction('schema-panel', 'Schema'),
        createAction('deep-format-report', '嵌套解析'),
      ],
    };
  }

  if (isLikelyJsonContainerText(source)) {
    return {
      id: 'malformed-json',
      title: 'JSON 可能有语法错误',
      description: '当前内容像 JSON 但未能解析，可先用智能修复补齐引号、逗号或缺失值。',
      tone: 'rose',
      actions: [
        createAction('ai-fix', '智能修复'),
      ],
    };
  }

  if (detectSchemeType(source) === 'json') {
    return {
      id: 'json-string',
      title: '检测到 JSON 字符串',
      description: '可以先嵌套解析，把字符串里的 JSON 展开成可浏览结构。',
      tone: 'cyan',
      actions: [
        createAction('deep-format-report', '嵌套解析'),
        createAction('structure-nav', '结构导航'),
      ],
    };
  }

  if (hasActionableTextHint(sample)) {
    return {
      id: 'text-with-cmd-hint',
      title: '文本里疑似包含 CMD 字段',
      description: '建议复制关键字段或整段内容到 Scheme 面板，查看参数分层解析结果。',
      tone: 'amber',
      actions: [
        createAction('scheme-panel', 'Scheme 解析'),
      ],
    };
  }

  return null;
};

export const getSmartSuggestionMode = (actionId: SmartSuggestionActionId): TransformMode | null => {
  if (actionId === 'response-inspection') return TransformMode.DEEP_FORMAT;
  if (actionId === 'deep-format-report') return TransformMode.DEEP_FORMAT;
  if (actionId === 'json-to-typescript') return TransformMode.JSON_TO_TYPESCRIPT;
  if (actionId === 'url-decode') return TransformMode.URL_DECODE;
  return null;
};
