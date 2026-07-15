const mappingPattern = indent => new RegExp(`^ {${indent}}([A-Za-z][\\w.-]*):(?:[ \\t]+(.*))?$`);
const DOCUMENT_MARKER_PATTERN = /^(?:---|\.\.\.)(?:[ \t]+#.*)?$/;
const NON_STRING_PLAIN_SCALAR_PATTERN = /^(?:null|~|true|false|[-+]?(?:0b[01_]+|0o[0-7_]+|0x[\da-f_]+|(?:\d[\d_]*(?:\.[\d_]*)?|\.[\d_]+)(?:e[-+]?\d[\d_]*)?|\.inf|\.nan))$/i;
const INVALID_BLOCK_PLAIN_SCALAR_PATTERN = /^(?:[%@`]|[-?:](?:$|[ \t]))|:(?:$|[ \t])/;
const YAML_DOUBLE_ESCAPES = new Map([
  ['0', '\0'], ['a', '\x07'], ['b', '\b'], ['t', '\t'], ['n', '\n'], ['v', '\v'],
  ['f', '\f'], ['r', '\r'], ['e', '\x1b'], [' ', ' '], ['"', '"'], ['/', '/'],
  ['\\', '\\'], ['N', '\u0085'], ['_', '\u00a0'], ['L', '\u2028'], ['P', '\u2029'],
]);

export const listYamlMappingEntries = (content, indent = 0) => content.split(/\r?\n/)
  .map((line, index) => {
    const match = mappingPattern(indent).exec(line);
    return match ? { key: match[1], rawValue: match[2] ?? '', index } : null;
  })
  .filter(Boolean);

export const findDuplicateYamlMappingKeys = (content, indent = 0) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const { key } of listYamlMappingEntries(content, indent)) {
    if (seen.has(key)) duplicates.add(key);
    else seen.add(key);
  }
  return [...duplicates];
};

export const findYamlChildIndent = content => content.split(/\r?\n/)
  .filter(line => line.trim() && !/^\s*#/.test(line))
  .reduce((minimum, line) => Math.min(minimum, line.match(/^ */)[0].length), Infinity);

export const hasYamlMappingIndentDrift = (content, indent) => content.split(/\r?\n/)
  .some(line => line.trim() && !/^\s*#/.test(line)
    && line.match(/^ */)[0].length !== indent);

export const hasUnsupportedYamlMappingLine = (content, indent = 0) => content.split(/\r?\n/)
  .some((line) => {
    if (!line.trim() || /^\s*#/.test(line) || DOCUMENT_MARKER_PATTERN.test(line)) return false;
    const leadingSpaces = line.match(/^ */)[0].length;
    return leadingSpaces === indent && !mappingPattern(indent).test(line);
  });

export const readFirstYamlMappingRawValue = (content, field, indent = 0) => (
  listYamlMappingEntries(content, indent).find(({ key }) => key === field)?.rawValue
);

const isCommentOnly = value => /^#(?:.*)$/.test(value.trim());

export const extractYamlMappingBlock = (content, field, indent = 0) => {
  const lines = content.split(/\r?\n/);
  const entry = listYamlMappingEntries(content, indent).find(({ key }) => key === field);
  if (!entry || (entry.rawValue.trim() && !isCommentOnly(entry.rawValue))) return '';

  const block = [];
  for (let index = entry.index + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || /^\s*#/.test(line)) {
      block.push(line);
      continue;
    }
    const leadingSpaces = line.match(/^ */)[0].length;
    if (leadingSpaces <= indent) break;
    block.push(line);
  }
  return block.join('\n');
};

export const hasYamlScalarContinuation = (content, field, indent = 0) => {
  const lines = content.split(/\r?\n/);
  const entry = listYamlMappingEntries(content, indent).find(({ key }) => key === field);
  if (!entry || !entry.rawValue.trim() || isCommentOnly(entry.rawValue)) return false;
  for (let index = entry.index + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim() || /^\s*#/.test(line)) continue;
    return line.match(/^ */)[0].length > indent;
  }
  return false;
};

const invalidScalar = Object.freeze({ valid: false, quoted: false, value: '' });
const DECODED_LINE_BREAK_PATTERN = /[\r\n\u0085\u2028\u2029]/u;
const validScalar = (value, quoted) => (
  value === undefined || DECODED_LINE_BREAK_PATTERN.test(value)
    ? invalidScalar : { valid: true, quoted, value }
);

const decodeYamlDoubleQuoted = (source) => {
  let value = '';
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== '\\') {
      value += source[index];
      continue;
    }
    const escape = source[index += 1];
    if (YAML_DOUBLE_ESCAPES.has(escape)) {
      value += YAML_DOUBLE_ESCAPES.get(escape);
      continue;
    }
    const width = escape === 'x' ? 2 : escape === 'u' ? 4 : escape === 'U' ? 8 : 0;
    const digits = source.slice(index + 1, index + width + 1);
    if (!width || digits.length !== width || !/^[\da-f]+$/i.test(digits)) return undefined;
    const codePoint = Number.parseInt(digits, 16);
    if (codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return undefined;
    value += String.fromCodePoint(codePoint);
    index += width;
  }
  return value;
};

export const decodeYamlStringScalar = (rawValue, { quotedOnly = false } = {}) => {
  const source = rawValue?.trim() ?? '';
  const doubleQuoted = /^"((?:[^"\\]|\\.)*)"(?:[ \t]+#.*)?$/.exec(source);
  if (doubleQuoted) {
    const value = decodeYamlDoubleQuoted(doubleQuoted[1]);
    return validScalar(value, true);
  }

  const singleQuoted = /^'((?:[^']|'')*)'(?:[ \t]+#.*)?$/.exec(source);
  if (singleQuoted) {
    return validScalar(singleQuoted[1].replace(/''/g, "'"), true);
  }
  if (quotedOnly) return invalidScalar;

  const value = source.replace(/[ \t]+#.*$/, '').trim();
  if (!value || value.startsWith('#') || /^["'*&!|>{}\[\],]/.test(value)
    || INVALID_BLOCK_PLAIN_SCALAR_PATTERN.test(value)
    || NON_STRING_PLAIN_SCALAR_PATTERN.test(value)) return invalidScalar;
  return validScalar(value, false);
};

export const countUnicodeCodePoints = value => [...value].length;

export const hasYamlDocumentMarker = content => content.split(/\r?\n/)
  .some(line => DOCUMENT_MARKER_PATTERN.test(line));
