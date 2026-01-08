

import { 
  TransformMode, 
  ValidationResult, 
  TransformStep, 
  PathTransformRecord, 
  TransformContext, 
  TransformResult 
} from '../types.ts';

export const validateJson = (input: string): ValidationResult => {
  if (typeof input !== 'string' || !input.trim()) return { isValid: true };
  try {
    JSON.parse(input);
    return { isValid: true };
  } catch (e: any) {
    return { isValid: false, error: e.message };
  }
};

export const detectLanguage = (input: string): string => {
  if (typeof input !== 'string' || !input || !input.trim()) return 'plaintext';
  const trimmed = input.trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';

  if (trimmed.startsWith('<') && trimmed.includes('>')) {
    return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') ? 'html' : 'xml';
  }

  if (trimmed.includes('{') && trimmed.includes(':') && trimmed.includes(';') && !trimmed.startsWith('{')) {
    return 'css';
  }

  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s/i.test(trimmed)) {
    return 'sql';
  }

  if (
    trimmed.startsWith('export') ||
    trimmed.startsWith('import') ||
    trimmed.startsWith('const') ||
    trimmed.startsWith('let') ||
    trimmed.startsWith('var') ||
    trimmed.startsWith('function') ||
    trimmed.includes('=>') ||
    (trimmed.startsWith('{') && !trimmed.includes('"'))
  ) {
    return 'javascript';
  }

  if (trimmed === 'true' || trimmed === 'false' || trimmed === 'null') return 'json';
  if (!isNaN(Number(trimmed))) return 'json';
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return 'json';

  return 'plaintext';
};

// 核心转换逻辑
const formatJson = (input: string): string => {
  try {
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return input;
  }
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
    const parsed = JSON.parse(input);
    return JSON.stringify(parsed);
  } catch (e) {
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
      return JSON.parse(input);
    }
    // 处理转义字符
    return JSON.parse(`"${input}"`);
  } catch (e) {
    try {
      const parsed = JSON.parse(input);
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

// ============ 带路径记录的深度解析 ============

/**
 * 深度解析 JSON，同时记录每个路径上发生的转换步骤
 * 用于后续精确还原
 */
export function deepParseWithContext(
  input: string,
  options?: { maxDepth?: number }
): TransformResult {
  const originalIndentation = detectIndentation(input);
  const context: TransformContext = {
    mode: TransformMode.DEEP_FORMAT,
    records: new Map(),
    timestamp: Date.now(),
    originalIndentation,
  };

  try {
    const parsed = JSON.parse(input);

    const processValue = (value: any, currentPath: string, depth: number = 0): any => {
      const maxDepth = options?.maxDepth ?? 10;
      if (depth > maxDepth) return value;

      if (typeof value === 'string') {
        const steps: TransformStep[] = [];
        let current = value;
        let iterDepth = 0;

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

          // 尝试 JSON 解析
          try {
            const trimmed = current.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
              const jsonParsed = JSON.parse(current);
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
                if (Array.isArray(jsonParsed)) {
                  return jsonParsed.map((item, index) =>
                    processValue(item, `${currentPath}[${index}]`, depth + 1)
                  );
                } else {
                  const result: any = {};
                  for (const key in jsonParsed) {
                    result[key] = processValue(jsonParsed[key], `${currentPath}.${key}`, depth + 1);
                  }
                  return result;
                }
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

        return steps.length > 0 ? current : value;
      }

      if (Array.isArray(value)) {
        return value.map((item, index) =>
          processValue(item, `${currentPath}[${index}]`, depth)
        );
      }

      if (typeof value === 'object' && value !== null) {
        const result: any = {};
        for (const key in value) {
          result[key] = processValue(value[key], `${currentPath}.${key}`, depth);
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
  } catch (e) {
    // JSON 解析失败，返回原始输入
    return {
      output: input,
      context,
    };
  }
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
    const editedParsed = JSON.parse(editedOutput);

    const restoreValue = (value: any, currentPath: string): any => {
      const record = context.records.get(currentPath);

      if (record && record.steps.length > 0) {
        // 有转换记录，需要逆向还原
        let current = value;

        // 如果当前是对象/数组，先递归处理子节点
        if (typeof current === 'object' && current !== null) {
          if (Array.isArray(current)) {
            current = current.map((item, index) =>
              restoreValue(item, `${currentPath}[${index}]`)
            );
          } else {
            const restored: any = {};
            for (const key in current) {
              restored[key] = restoreValue(current[key], `${currentPath}.${key}`);
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
          restoreValue(item, `${currentPath}[${index}]`)
        );
      }

      if (typeof value === 'object' && value !== null) {
        const result: any = {};
        for (const key in value) {
          result[key] = restoreValue(value[key], `${currentPath}.${key}`);
        }
        return result;
      }

      return value;
    };

    const result = restoreValue(editedParsed, '$');

    // 使用原始缩进格式
    const indentation = context.originalIndentation;
    if (indentation === 0) {
      return JSON.stringify(result);
    }
    return JSON.stringify(result, null, indentation);
  } catch (e) {
    // 还原失败，返回原始编辑内容
    return editedOutput;
  }
}

/**
 * 应用单步逆向转换
 */
function applyInverseStep(value: any, step: TransformStep): any {
  switch (step.type) {
    case 'json_parse':
      // 逆操作：stringify（不带缩进，保持紧凑）
      return JSON.stringify(value);
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

// ============ 旧版智能还原（向后兼容，已废弃） ============
// 注意：此函数已被 inverseWithContext 取代
// 保留仅为向后兼容，不推荐使用

const smartInverse = (output: string, originalInput: string): string => {
  try {
    const outputObj = JSON.parse(output);
    const originalObj = JSON.parse(originalInput);

    const deepMerge = (out: any, orig: any): any => {
      // 检测到字符串被展开为对象，需重新序列化
      if (typeof orig === 'string' && typeof out === 'object' && out !== null) {
        return JSON.stringify(out);
      }

      if (Array.isArray(out) && Array.isArray(orig)) {
        return out.map((item, index) => {
          // 尝试与原始数组项匹配合并
          if (index < orig.length) {
            return deepMerge(item, orig[index]);
          }
          return item;
        });
      }

      if (typeof out === 'object' && out !== null && typeof orig === 'object' && orig !== null) {
        const newObj: any = {};
        for (const key in out) {
          if (key in orig) {
            newObj[key] = deepMerge(out[key], orig[key]);
          } else {
            newObj[key] = out[key];
          }
        }
        return newObj;
      }

      return out;
    };

    const result = deepMerge(outputObj, originalObj);
    const indentation = detectIndentation(originalInput);

    // 若原内容为压缩格式，则保持压缩输出
    if (indentation === 0) {
      return JSON.stringify(result);
    }
    return JSON.stringify(result, null, indentation);
  } catch (e) {
    // 合并失败回退策略：优先返回标准格式化 JSON
    try {
      const parsed = JSON.parse(output);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return output;
    }
  }
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
      default: return input;
    }
  } catch (e) {
    return input;
  }
};

// 反向转换 (Output -> Input)
export const performInverseTransform = (output: string, mode: TransformMode, originalInput?: string): string => {
  if (!output) return '';
  try {
    switch (mode) {
      case TransformMode.NONE: return output;
      case TransformMode.FORMAT: return minifyJson(output);
      case TransformMode.DEEP_FORMAT:
        if (originalInput) {
          return smartInverse(output, originalInput);
        }
        return minifyJson(output);
      case TransformMode.MINIFY: return output;

      case TransformMode.ESCAPE: return unescapeString(output);
      case TransformMode.UNESCAPE: return escapeString(output);

      case TransformMode.UNICODE_TO_CN: return cnToUnicode(output);
      case TransformMode.CN_TO_UNICODE: return unicodeToCn(output);
      default: return output;
    }
  } catch (e) {
    return output;
  }
};
