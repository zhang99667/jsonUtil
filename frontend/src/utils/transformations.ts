

import {
  TransformMode,
  ValidationResult,
  TransformStep,
  PathTransformRecord,
  TransformContext,
  TransformResult,
  JsonInputWrapper,
  JsonValue,
  JsonObject
} from '../types.ts';

import {
  DEFAULT_SCHEME_DECODE_MAX_DEPTH,
  deepDecodeScheme,
  detectSchemeType,
  hasUrlEncoding,
} from './schemeUtils.ts';
import { parseJsonLines, parseJsonLinesDetailed, stringifyJsonLines } from './jsonLines.ts';

export const DEFAULT_DEEP_PARSE_STRING_DECODE_LIMIT = 256_000;
export const DEFAULT_DEEP_PARSE_TOTAL_STRING_DECODE_LIMIT = 1_500_000;
const MAX_UNRESOLVED_CANDIDATE_COUNT = 100;

interface ParsedJsonInput {
  value: JsonValue;
  source: string;
  wrapper?: JsonInputWrapper;
}

interface WrappedJsonCandidate {
  payload: string;
  wrapper: JsonInputWrapper;
}

const parseJsonCandidate = (candidate: string): ParsedJsonInput | null => {
  try {
    return { value: JSON.parse(candidate) as JsonValue, source: candidate };
  } catch {
    return null;
  }
};

const extractMarkdownJsonFenceCandidate = (input: string): WrappedJsonCandidate | null => {
  const match = input.trim().match(/^(```(?:json|jsonc)?[^\n]*\n?)([\s\S]*?)(\n?```)$/i);
  return match
    ? {
        payload: match[2].trim(),
        wrapper: { prefix: match[1], suffix: match[3] },
      }
    : null;
};

const extractAssignmentJsonCandidate = (input: string): WrappedJsonCandidate | null => {
  const trimmed = input.trim();
  const exportDefaultMatch = trimmed.match(/^(export\s+default\s+)([\s\S]*?)(;?)$/);
  if (exportDefaultMatch) {
    return {
      payload: exportDefaultMatch[2].trim(),
      wrapper: { prefix: exportDefaultMatch[1], suffix: exportDefaultMatch[3] },
    };
  }

  const assignmentMatch = trimmed.match(/^((?:(?:const|let|var)\s+[A-Za-z_$][\w$]*(?:\s*:\s*[^=]+)?|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*=\s*)([\s\S]*?)(;?)$/);
  return assignmentMatch
    ? {
        payload: assignmentMatch[2].trim(),
        wrapper: { prefix: assignmentMatch[1], suffix: assignmentMatch[3] },
      }
    : null;
};

const extractJsonpCandidate = (input: string): WrappedJsonCandidate | null => {
  const match = input.trim().match(/^([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\(\s*)([\s\S]*?)(\s*\);?)$/);
  return match
    ? {
        payload: match[2].trim(),
        wrapper: { prefix: match[1], suffix: match[3] },
      }
    : null;
};

// 只接受明确的复制外壳，避免把普通说明文字里的 JSON 片段误判为完整输入。
const parseWrappedJsonInput = (input: string): ParsedJsonInput | null => {
  const candidates = [
    extractMarkdownJsonFenceCandidate(input),
    extractAssignmentJsonCandidate(input),
    extractJsonpCandidate(input),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const parsed = parseJsonCandidate(candidate.payload);
    if (parsed) return { ...parsed, wrapper: candidate.wrapper };
  }

  return null;
};

const parseJsonInput = (input: string): ParsedJsonInput | null => (
  parseJsonCandidate(input) || parseWrappedJsonInput(input)
);

const wrapJsonContent = (content: string, wrapper: JsonInputWrapper): string => (
  `${wrapper.prefix}${content}${wrapper.suffix}`
);

export const validateJson = (input: string): ValidationResult => {
  if (typeof input !== 'string' || !input.trim()) return { isValid: true };
  try {
    JSON.parse(input);
    return { isValid: true };
  } catch (e: unknown) {
    if (parseWrappedJsonInput(input)) return { isValid: true };

    const jsonLines = parseJsonLinesDetailed(input);
    if (jsonLines.records) return { isValid: true };
    if (jsonLines.error) return { isValid: false, error: jsonLines.error };

    const message = e instanceof Error ? e.message : String(e);
    return { isValid: false, error: message };
  }
};

export const detectLanguage = (input: string): string => {
  if (typeof input !== 'string' || !input) return 'plaintext';

  // 高频编辑路径先只裁剪开头，大 JSON 可直接通过前缀识别，避免完整 trim 扫描。
  const trimmedStart = input.trimStart();
  if (!trimmedStart) return 'plaintext';

  if (trimmedStart.startsWith('{') || trimmedStart.startsWith('[')) return 'json';

  if (trimmedStart.startsWith('<') && trimmedStart.includes('>')) {
    return trimmedStart.startsWith('<!DOCTYPE') || trimmedStart.startsWith('<html') ? 'html' : 'xml';
  }

  if (trimmedStart.includes('{') && trimmedStart.includes(':') && trimmedStart.includes(';') && !trimmedStart.startsWith('{')) {
    return 'css';
  }

  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s/i.test(trimmedStart)) {
    return 'sql';
  }

  if (
    trimmedStart.startsWith('export') ||
    trimmedStart.startsWith('import') ||
    trimmedStart.startsWith('const') ||
    trimmedStart.startsWith('let') ||
    trimmedStart.startsWith('var') ||
    trimmedStart.startsWith('function') ||
    trimmedStart.includes('=>') ||
    (trimmedStart.startsWith('{') && !trimmedStart.includes('"'))
  ) {
    return 'javascript';
  }

  const trimmed = trimmedStart.trimEnd();
  if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null') return 'json';
  if (!isNaN(Number(trimmed))) return 'json';
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return 'json';

  return 'plaintext';
};

// 核心转换逻辑
const formatJson = (input: string): string => {
  try {
    const parsed = parseJsonInput(input);
    if (parsed) return JSON.stringify(parsed.value, null, 2);

    throw new Error('未找到可格式化的 JSON 内容');
  } catch (e) {
    const jsonLines = parseJsonLines(input);
    if (jsonLines) return JSON.stringify(jsonLines, null, 2);

    return input;
  }
};

const inverseFormattedJson = (output: string, originalInput?: string): string => {
  const originalWrappedJson = originalInput ? parseWrappedJsonInput(originalInput) : null;
  if (originalWrappedJson?.wrapper) {
    const parsedOutput = parseJsonCandidate(output);
    return parsedOutput
      ? wrapJsonContent(JSON.stringify(parsedOutput.value), originalWrappedJson.wrapper)
      : output;
  }

  const originalJsonLines = originalInput ? parseJsonLines(originalInput) : null;
  if (originalJsonLines) {
    try {
      const parsed = JSON.parse(output) as JsonValue;
      if (Array.isArray(parsed)) {
        return stringifyJsonLines(parsed);
      }
    } catch {
      return output;
    }
  }

  return minifyJson(output);
};

const deepFormatJson = (input: string): string => {
  try {
    return deepParseJson(input);
  } catch (e) {
    return input;
  }
};

const minifyJson = (input: string): string => {
  try {
    const parsed = parseJsonInput(input);
    if (parsed) return JSON.stringify(parsed.value);

    throw new Error('未找到可压缩的 JSON 内容');
  } catch (e) {
    const jsonLines = parseJsonLines(input);
    if (jsonLines) return stringifyJsonLines(jsonLines);

    return input;
  }
};

const escapeString = (input: string): string => {
  return JSON.stringify(input).slice(1, -1);
};

const unescapeString = (input: string): string => {
  try {
    // 处理双引号包裹的字符串
    if (input.startsWith('"') && input.endsWith('"')) {
      return JSON.parse(input) as string;
    }
    // 处理转义字符
    return JSON.parse(`"${input}"`) as string;
  } catch (e) {
    try {
      const parsed: JsonValue = JSON.parse(input);
      if (typeof parsed !== 'string') {
        return JSON.stringify(parsed);
      }
      return parsed;
    } catch { return input; }
  }
};

const cnToUnicode = (input: string): string => {
  return input.split('').map(char => {
    const code = char.charCodeAt(0);
    return code > 255
      ? '\\u' + code.toString(16).toUpperCase().padStart(4, '0')
      : char;
  }).join('');
};

const unicodeToCn = (input: string): string => {
  return input.replace(/\\u([\dA-Fa-f]{4})/gi, (_, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
};

// ============ Unicode 编解码工具函数 ============

const containsUnicodeEscape = (str: string): boolean => {
  return /\\u[\dA-Fa-f]{4}/.test(str);
};

const tryUnicodeDecode = (str: string): string => {
  if (!containsUnicodeEscape(str)) return str;
  return str.replace(/\\u([\dA-Fa-f]{4})/gi, (_, grp) => {
    return String.fromCharCode(parseInt(grp, 16));
  });
};

const unicodeEncode = (str: string): string => {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    return code > 255
      ? '\\u' + code.toString(16).toUpperCase().padStart(4, '0')
      : char;
  }).join('');
};

// ============ Base64 编解码工具函数 ============

const bytesToBinaryString = (bytes: Uint8Array): string => {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return binary;
};

const binaryStringToBytes = (binary: string): Uint8Array => {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const normalizeBase64Input = (input: string): string | null => {
  const compact = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
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

const base64Encode = (input: string): string => {
  const bytes = new TextEncoder().encode(input);
  return btoa(bytesToBinaryString(bytes));
};

const base64Decode = (input: string): string => {
  const normalized = normalizeBase64Input(input);
  if (!normalized) return input;

  try {
    const bytes = binaryStringToBytes(atob(normalized));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return input;
  }
};

const appendJsonPathKey = (path: string, key: string): string => (
  /^[A-Za-z_$][\w$]*$/.test(key)
    ? `${path}.${key}`
    : `${path}[${JSON.stringify(key)}]`
);

const appendJsonPathIndex = (path: string, index: number): string => (
  `${path}[${index}]`
);

const formatStringPreview = (value: string, maxLength = 120): string => (
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
);

// ============ 带路径记录的深度解析 ============

/**
 * 深度解析 JSON，同时记录每个路径上发生的转换步骤
 * 用于后续精确还原
 */
export function deepParseWithContext(
  input: string,
  options?: {
    maxDepth?: number;
    autoExpandScheme?: boolean;
    maxStringDecodeLength?: number;
    maxTotalStringDecodeLength?: number;
  }
): TransformResult {
  const originalIndentation = detectIndentation(input);
  const context: TransformContext = {
    mode: TransformMode.DEEP_FORMAT,
    records: new Map(),
    timestamp: Date.now(),
    originalIndentation,
  };

  let parsed: JsonValue;
  try {
    const parsedInput = parseJsonInput(input);
    if (!parsedInput) throw new Error('未找到可深度格式化的 JSON 内容');

    parsed = parsedInput.value;
    context.originalIndentation = detectIndentation(parsedInput.source);
    context.sourceFormat = 'json';
    context.sourceWrapper = parsedInput.wrapper;
  } catch {
    const jsonLines = parseJsonLines(input);
    if (!jsonLines) {
      // JSON 解析失败，返回原始输入
      return {
        output: input,
        context,
      };
    }

    parsed = jsonLines;
    context.sourceFormat = 'jsonl';
  }

  const maxDepth = options?.maxDepth ?? DEFAULT_SCHEME_DECODE_MAX_DEPTH;
  const maxStringDecodeLength = options?.maxStringDecodeLength ?? DEFAULT_DEEP_PARSE_STRING_DECODE_LIMIT;
  const maxTotalStringDecodeLength = options?.maxTotalStringDecodeLength ?? DEFAULT_DEEP_PARSE_TOTAL_STRING_DECODE_LIMIT;
  let totalStringDecodeLength = 0;
  let hasTotalStringDecodeBudgetWarning = false;

  const addUnresolvedCandidate = (
    path: string,
    value: string,
    detectedType: string,
    message: string
  ) => {
    const candidates = context.unresolvedCandidates || [];
    if (candidates.length >= MAX_UNRESOLVED_CANDIDATE_COUNT) return;

    context.unresolvedCandidates = candidates;
    context.unresolvedCandidates.push({
      path,
      message,
      length: value.length,
      preview: formatStringPreview(value),
      detectedType,
    });
  };

    const processValue = (value: JsonValue, currentPath: string, depth: number = 0): JsonValue => {
      if (depth > maxDepth) return value;

      if (typeof value === 'string') {
        if (value.length > maxStringDecodeLength) {
          context.warnings = context.warnings || [];
          context.warnings.push({
            type: 'string_decode_skipped',
            path: currentPath,
            message: '字符串过长，已跳过递归展开以保护性能',
            length: value.length,
            limit: maxStringDecodeLength,
          });
          return value;
        }

        totalStringDecodeLength += value.length;
        if (totalStringDecodeLength > maxTotalStringDecodeLength) {
          if (!hasTotalStringDecodeBudgetWarning) {
            context.warnings = context.warnings || [];
            context.warnings.push({
              type: 'string_decode_budget_exceeded',
              path: currentPath,
              message: '累计字符串解析预算已用尽，已跳过递归展开以保护性能',
              length: value.length,
              limit: maxTotalStringDecodeLength,
            });
            hasTotalStringDecodeBudgetWarning = true;
          }
          return value;
        }

        const steps: TransformStep[] = [];
        let current = value;
        let iterDepth = 0;
        let unresolvedCandidate: { detectedType: string; message: string } | null = null;

        const processParsedValue = (jsonParsed: JsonValue): JsonValue => {
          if (Array.isArray(jsonParsed)) {
            return jsonParsed.map((item, index) =>
              processValue(item, appendJsonPathIndex(currentPath, index), depth + 1)
            );
          }

          if (typeof jsonParsed === 'object' && jsonParsed !== null) {
            const jsonObj = jsonParsed as JsonObject;
            const result: JsonObject = {};
            for (const key in jsonObj) {
              result[key] = processValue(jsonObj[key], appendJsonPathKey(currentPath, key), depth + 1);
            }
            return result;
          }

          return jsonParsed;
        };

        while (iterDepth < maxDepth) {
          let changed = false;

          // 尝试 Unicode 解码
          if (containsUnicodeEscape(current)) {
            const decoded = tryUnicodeDecode(current);
            if (decoded !== current) {
              steps.push({ type: 'unicode_decode' });
              current = decoded;
              changed = true;
            }
          }

          // 当 autoExpandScheme 启用时，优先展开独立 CMD、URL Scheme 或 Base64 JSON 片段
          const schemeType = detectSchemeType(current);
          if (
            options?.autoExpandScheme &&
            (schemeType === 'query-string' || schemeType === 'url' || schemeType === 'base64')
          ) {
            const decodedScheme = deepDecodeScheme(current, maxDepth - depth);
            if (decodedScheme.isJson) {
              try {
                const schemeParsed = JSON.parse(decodedScheme.decoded) as JsonValue;
                if (typeof schemeParsed === 'object' && schemeParsed !== null) {
                  const processedSchemeValue = processParsedValue(schemeParsed);
                  const isSchemeReversible = decodedScheme.layers.every(layer => layer.reversible !== false);
                  steps.push({
                    type: 'scheme_decode',
                    originalScheme: current,
                    originalSchemeType: schemeType,
                    originalSchemeReversible: isSchemeReversible,
                    originalSchemeStringLiteral: decodedScheme.layers.some(layer => layer.type === 'json'),
                    decodedSchemeValue: processedSchemeValue,
                  });

                  context.records.set(currentPath, {
                    path: currentPath,
                    steps: [...steps],
                    originalValue: value,
                  });

                  return processedSchemeValue;
                }
              } catch {
                unresolvedCandidate = unresolvedCandidate || {
                  detectedType: schemeType,
                  message: '疑似 CMD/Scheme 字符串解析结果不是有效 JSON',
                };
                // CMD 参数串解析失败，继续走后续普通解析逻辑
              }
            } else if (decodedScheme.layers.length > 0) {
              unresolvedCandidate = unresolvedCandidate || {
                detectedType: schemeType,
                message: '疑似 CMD/Scheme 字符串未展开为结构化对象',
              };
            }
          }

          // 当 autoExpandScheme 启用时，尝试 URL 解码
          if (options?.autoExpandScheme && hasUrlEncoding(current)) {
            const decoded = decodeURIComponent(current);
            if (decoded !== current) {
              unresolvedCandidate = unresolvedCandidate || {
                detectedType: 'url-encoded',
                message: 'URL 编码内容已解码，但未展开为结构化对象',
              };
              steps.push({ type: 'url_decode' });
              current = decoded;
              changed = true;
            }
          }

          // 尝试 JSON 解析
          try {
            const trimmed = current.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
              const jsonParsed: JsonValue = JSON.parse(current);
              if (typeof jsonParsed === 'object' && jsonParsed !== null) {
                steps.push({ type: 'json_parse' });

                // 记录该路径的转换
                if (steps.length > 0) {
                  context.records.set(currentPath, {
                    path: currentPath,
                    steps: [...steps],
                    originalValue: value,
                  });
                }

                // 递归处理解析后的对象
                return processParsedValue(jsonParsed);
              }
            }
          } catch {
            // JSON 解析失败，继续
          }

          if (!changed) break;
          iterDepth++;
        }

        // 即使只有 Unicode 解码，也需要记录
        if (steps.length > 0 && !context.records.has(currentPath)) {
          context.records.set(currentPath, {
            path: currentPath,
            steps,
            originalValue: value,
          });
        }

        if (options?.autoExpandScheme && unresolvedCandidate) {
          addUnresolvedCandidate(
            currentPath,
            value,
            unresolvedCandidate.detectedType,
            unresolvedCandidate.message
          );
        }

        return steps.length > 0 ? current : value;
      }

      if (Array.isArray(value)) {
        return value.map((item, index) =>
          processValue(item, appendJsonPathIndex(currentPath, index), depth)
        );
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const objValue = value as JsonObject;
        const result: JsonObject = {};
        for (const key in objValue) {
          result[key] = processValue(objValue[key], appendJsonPathKey(currentPath, key), depth);
        }
        return result;
      }

      return value;
    };

    const output = processValue(parsed, '$');

    return {
      output: JSON.stringify(output, null, 2),
      context,
    };
}

// ============ 基于上下文的精确还原 ============

/**
 * 根据转换上下文，将编辑后的输出精确还原为原始格式
 */
export function inverseWithContext(
  editedOutput: string,
  context: TransformContext
): string {
  try {
    const editedParsed: JsonValue = JSON.parse(editedOutput);

    const restoreValue = (value: JsonValue, currentPath: string): JsonValue => {
      const record = context.records.get(currentPath);

      if (record && record.steps.length > 0) {
        const schemeDecodeStep = record.steps.find(step => step.type === 'scheme_decode');
        if (
          schemeDecodeStep?.decodedSchemeValue !== undefined &&
          isSameJsonValue(value, schemeDecodeStep.decodedSchemeValue)
        ) {
          return record.originalValue;
        }

        // 有转换记录，需要逆向还原
        let current = value;

        // 如果当前是对象/数组，先递归处理子节点
        if (typeof current === 'object' && current !== null) {
          if (Array.isArray(current)) {
            current = current.map((item, index) =>
              restoreValue(item, appendJsonPathIndex(currentPath, index))
            );
          } else {
            const currentObj = current as JsonObject;
            const restored: JsonObject = {};
            for (const key in currentObj) {
              restored[key] = restoreValue(currentObj[key], appendJsonPathKey(currentPath, key));
            }
            current = restored;
          }
        }

        // 逆序执行转换步骤
        const reversedSteps = [...record.steps].reverse();
        for (const step of reversedSteps) {
          current = applyInverseStep(current, step);
        }

        return current;
      }

      // 无转换记录，递归处理子节点
      if (Array.isArray(value)) {
        return value.map((item, index) =>
          restoreValue(item, appendJsonPathIndex(currentPath, index))
        );
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const objValue = value as JsonObject;
        const result: JsonObject = {};
        for (const key in objValue) {
          result[key] = restoreValue(objValue[key], appendJsonPathKey(currentPath, key));
        }
        return result;
      }

      return value;
    };

    const result = restoreValue(editedParsed, '$');

    if (context.sourceFormat === 'jsonl' && Array.isArray(result)) {
      return stringifyJsonLines(result);
    }

    // 使用原始缩进格式
    const indentation = context.originalIndentation;
    const restoredJson = indentation === 0
      ? JSON.stringify(result)
      : JSON.stringify(result, null, indentation);

    return context.sourceWrapper
      ? wrapJsonContent(restoredJson, context.sourceWrapper)
      : restoredJson;
  } catch (e) {
    // 还原失败，返回原始编辑内容
    return editedOutput;
  }
}

/**
 * 应用单步逆向转换
 */
const stringifyQueryParamValue = (value: JsonValue): string => {
  if (typeof value === 'string') return value;
  if (value === null) return 'null';
  return JSON.stringify(value);
};

const encodeQueryStringValue = (value: JsonValue): string => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const params = new URLSearchParams();
    for (const [key, item] of Object.entries(value)) {
      params.append(key, stringifyQueryParamValue(item));
    }
    return params.toString();
  }

  return stringifyQueryParamValue(value);
};

const isSameJsonValue = (left: JsonValue, right: JsonValue): boolean => {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

function applyInverseStep(value: JsonValue, step: TransformStep): JsonValue {
  switch (step.type) {
    case 'json_parse':
      // 逆操作：stringify（不带缩进，保持紧凑）
      return JSON.stringify(value);
    case 'scheme_decode':
      if (
        step.originalScheme &&
        step.decodedSchemeValue !== undefined &&
        isSameJsonValue(value, step.decodedSchemeValue)
      ) {
        return step.originalScheme;
      }
      {
        let encodedValue: JsonValue = value;
        if (step.originalSchemeType === 'query-string') {
          encodedValue = encodeQueryStringValue(value);
        } else if (step.originalSchemeType === 'url') {
          encodedValue = stringifyQueryParamValue(value);
        } else if (step.originalSchemeType === 'base64') {
          if (step.originalSchemeReversible === false) return value;
          encodedValue = base64Encode(stringifyQueryParamValue(value));
        }

        return step.originalSchemeStringLiteral && typeof encodedValue === 'string'
          ? JSON.stringify(encodedValue)
          : encodedValue;
      }
    case 'unicode_decode':
      // 逆操作：encode
      if (typeof value === 'string') {
        return unicodeEncode(value);
      }
      return value;
    case 'url_decode':
      if (typeof value === 'string') {
        return encodeURIComponent(value);
      }
      return value;
    case 'base64_decode':
      if (typeof value === 'string') {
        try {
          return btoa(value);
        } catch {
          return value;
        }
      }
      return value;
    case 'unescape':
      if (typeof value === 'string') {
        return JSON.stringify(value).slice(1, -1);
      }
      return value;
    default:
      return value;
  }
}

// ============ 旧版深度解析（向后兼容） ============

const deepParseJson = (input: string): string => {
  const result = deepParseWithContext(input);
  return result.output;
};

const detectIndentation = (jsonString: string): number | string => {
  const lines = jsonString.split('\n');
  if (lines.length <= 1) return 0; // 空内容或单行压缩内容

  for (const line of lines) {
    if (line.trim() !== '') {
      const match = line.match(/^(\s+)/);
      if (match) {
        return match[1]; // 提取缩进字符
      }
    }
  }
  return 2; // 默认缩进（2空格）
};

// ============ JSON Key 排序 ============

/**
 * 递归按字母序排列 JSON 对象的键
 * 数组中的每个元素也会递归排序键
 */
const sortJsonKeys = (value: JsonValue): JsonValue => {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys);
  }
  const sorted: JsonObject = {};
  const keys = Object.keys(value as JsonObject).sort();
  for (const key of keys) {
    sorted[key] = sortJsonKeys((value as JsonObject)[key]);
  }
  return sorted;
};

// --- 双向转换逻辑 ---

// 正向转换 (Input -> Output)
export const performTransform = (input: string, mode: TransformMode): string => {
  if (!input) return '';
  try {
    switch (mode) {
      case TransformMode.NONE: return input;
      case TransformMode.FORMAT: return formatJson(input);
      case TransformMode.DEEP_FORMAT: return deepFormatJson(input);
      case TransformMode.MINIFY: return minifyJson(input);
      case TransformMode.ESCAPE: return escapeString(input);
      case TransformMode.UNESCAPE: return unescapeString(input);

      case TransformMode.UNICODE_TO_CN: return unicodeToCn(input);
      case TransformMode.CN_TO_UNICODE: return cnToUnicode(input);
      case TransformMode.URL_ENCODE: return encodeURIComponent(input);
      case TransformMode.URL_DECODE: {
        try { return decodeURIComponent(input); } catch { return input; }
      }
      case TransformMode.BASE64_ENCODE: return base64Encode(input);
      case TransformMode.BASE64_DECODE: return base64Decode(input);
      case TransformMode.SORT_KEYS: {
        try {
          const parsed = parseJsonInput(input);
          if (!parsed) throw new Error('未找到可排序的 JSON 内容');

          return JSON.stringify(sortJsonKeys(parsed.value), null, 2);
        } catch {
          const jsonLines = parseJsonLines(input);
          return jsonLines ? stringifyJsonLines(jsonLines.map(sortJsonKeys)) : input;
        }
      }
      default: return input;
    }
  } catch (e) {
    return input;
  }
};

// ============ 模板填充（深度合并） ============

/**
 * 深度合并模板到目标 JSON 对象
 * - 两边都是对象 → 递归合并
 * - 模板中的标量值覆盖目标同名字段
 * - 目标独有字段保留，模板独有字段添加
 * - 数组不逐项合并，模板数组直接覆盖
 */
export const deepMergeTemplate = (target: JsonValue, template: JsonValue): JsonValue => {
  // 模板为 null 或非对象类型 → 直接用模板值覆盖
  if (template === null || typeof template !== 'object') {
    return template;
  }

  // 模板是数组 → 直接覆盖（不逐项合并）
  if (Array.isArray(template)) {
    return template;
  }

  // 目标不是普通对象 → 直接用模板覆盖
  if (target === null || typeof target !== 'object' || Array.isArray(target)) {
    return template;
  }

  // 两边都是普通对象 → 递归合并
  const result: JsonObject = { ...target as JsonObject };
  const tmpl = template as JsonObject;
  for (const key of Object.keys(tmpl)) {
    if (key in result) {
      result[key] = deepMergeTemplate(result[key], tmpl[key]);
    } else {
      result[key] = tmpl[key];
    }
  }
  return result;
};

/**
 * 字符串级封装：解析输入 JSON + 模板 JSON，深度合并后格式化输出
 * @param inputJson - 当前编辑器中的 JSON 字符串
 * @param templateJson - 模板 JSON 字符串
 * @returns 合并后的格式化 JSON 字符串
 * @throws 输入或模板不是合法 JSON 时抛出错误
 */
export const applyTemplate = (inputJson: string, templateJson: string): string => {
  if (!inputJson.trim()) {
    throw new Error('当前编辑器内容为空');
  }
  if (!templateJson.trim()) {
    throw new Error('模板内容为空');
  }

  let target: JsonValue;
  try {
    target = JSON.parse(inputJson);
  } catch {
    throw new Error('当前编辑器内容不是合法的 JSON');
  }

  let template: JsonValue;
  try {
    template = JSON.parse(templateJson);
  } catch {
    throw new Error('模板内容不是合法的 JSON');
  }

  const merged = deepMergeTemplate(target, template);
  return JSON.stringify(merged, null, 2);
};

// 反向转换 (Output -> Input)
export const performInverseTransform = (output: string, mode: TransformMode, originalInput?: string): string => {
  if (!output) return '';
  try {
    switch (mode) {
      case TransformMode.NONE: return output;
      case TransformMode.FORMAT: return inverseFormattedJson(output, originalInput);
      case TransformMode.DEEP_FORMAT:
        // 无上下文时统一回退到压缩格式（精确还原已由 inverseWithContext 在上层处理）
        return minifyJson(output);
      case TransformMode.MINIFY: return output;

      case TransformMode.ESCAPE: return unescapeString(output);
      case TransformMode.UNESCAPE: return escapeString(output);

      case TransformMode.UNICODE_TO_CN: return cnToUnicode(output);
      case TransformMode.CN_TO_UNICODE: return unicodeToCn(output);
      case TransformMode.URL_ENCODE: {
        try { return decodeURIComponent(output); } catch { return output; }
      }
      case TransformMode.URL_DECODE: return encodeURIComponent(output);
      case TransformMode.BASE64_ENCODE: return base64Decode(output);
      case TransformMode.BASE64_DECODE: return base64Encode(output);
      case TransformMode.SORT_KEYS: return output;
      default: return output;
    }
  } catch (e) {
    return output;
  }
};
