
import { TransformMode, ValidationResult } from '../types.ts';

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

const deepParseJson = (input: string): string => {
  try {
    const parsed = JSON.parse(input);

    const deepParse = (obj: any): any => {
      if (typeof obj === 'string') {
        try {
          // 尝试解析嵌套 JSON 字符串
          const innerParsed = JSON.parse(obj);
          // 若解析结果为对象或数组，则递归处理
          if (typeof innerParsed === 'object' && innerParsed !== null) {
            return deepParse(innerParsed);
          }
          return obj;
        } catch (e) {
          return obj;
        }
      }

      if (Array.isArray(obj)) {
        return obj.map(item => deepParse(item));
      }

      if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const key in obj) {
          newObj[key] = deepParse(obj[key]);
        }
        return newObj;
      }

      return obj;
    };

    const result = deepParse(parsed);
    return JSON.stringify(result, null, 2);
  } catch (e) {
    return input;
  }
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
