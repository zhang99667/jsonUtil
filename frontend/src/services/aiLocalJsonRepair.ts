import { tryNormalizeJson } from './aiRepairResponseNormalizer';

export interface LocalJsonRepairReport {
  fixedJson: string;
  ruleLabels: string[];
}

interface LocalRepairCandidate {
  value: string;
  ruleLabels: string[];
}

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

const convertSingleQuotedStrings = (source: string): string => {
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

    if (char === '\'') {
      const singleQuoted = readSingleQuotedString(source, index);
      if (singleQuoted) {
        output += JSON.stringify(singleQuoted.content);
        index = singleQuoted.endIndex;
        continue;
      }
    }

    output += char;
  }

  return output;
};

interface SingleQuotedString {
  content: string;
  endIndex: number;
}

const readSingleQuotedString = (
  source: string,
  startIndex: number
): SingleQuotedString | null => {
  let content = '';
  let escaped = false;

  for (let index = startIndex + 1; index < source.length; index++) {
    const char = source[index];

    if (escaped) {
      content += char === '\'' ? '\'' : `\\${char}`;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '\'') {
      return {
        content,
        endIndex: index,
      };
    }

    content += char;
  }

  return null;
};

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
