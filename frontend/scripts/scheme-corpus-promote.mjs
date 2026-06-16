#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DEFAULT_CHUNK_SIZE = 160;
const RUNTIME_PLACEHOLDER_PATTERN = /^__[A-Z0-9_]+__$/;
const SENSITIVE_KEYS = [
  'access_token',
  'refresh_token',
  'authorization',
  'android_id',
  'device_id',
  'deviceid',
  'baiduid',
  'baidu_id',
  'password',
  'passwd',
  'session',
  'cookie',
  'secret',
  'token',
  'invoke_token',
  'sign',
  'imei',
  'imeisum',
  'oaid',
  'oaidsum',
  'idfa',
  'cuid',
  'searchid',
  'search_id',
  'clickid',
  'click_id',
  'bd_vid',
  'bdvid',
  'unionid',
  'union_id',
  'openid',
  'open_id',
  'userid',
  'user_id',
  'uid',
  'accountid',
  'account_id',
  'phone',
  'phonenumber',
  'phone_number',
  'mobile',
  'mobilephone',
  'mobile_phone',
  'realphone',
  'real_phone',
  'virtualphone',
  'virtual_phone',
];

const isRecord = value => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const normalizeKey = key => String(key).replace(/[^a-z0-9]/gi, '').toLowerCase();

const isSensitiveKey = key => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEYS.some(sensitiveKey => normalized === normalizeKey(sensitiveKey)) ||
    ['token', 'sign', 'cookie', 'password', 'passwd', 'secret'].some(suffix => normalized.endsWith(suffix));
};

const toRedactedPlaceholder = key => `__REDACTED_${normalizeKey(key).toUpperCase() || 'VALUE'}__`;

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isRuntimePlaceholder = value => (
  typeof value === 'string' && RUNTIME_PLACEHOLDER_PATTERN.test(value)
);

const isMostlyPrintable = text => {
  if (!text) return false;
  let printable = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13 || code >= 32) {
      printable += 1;
    }
  }
  return printable / text.length > 0.85;
};

const isNearPercentEncodedByte = (text, offset, length) => {
  const before = text.slice(Math.max(0, offset - 3), offset);
  const after = text.slice(offset + length, offset + length + 3);
  return /%[0-9a-f]{0,2}$/i.test(before) || /^%[0-9a-f]{0,2}/i.test(after);
};

const sanitizeLongIdentifiers = text => (
  text
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '00000000-0000-4000-8000-000000000000')
    .replace(/\d{13,}/g, (match, offset) => (
      isNearPercentEncodedByte(text, offset, match.length) ? match : '1000000000000'
    ))
);

const encodeTimes = (value, times) => {
  let output = value;
  for (let index = 0; index < times; index += 1) {
    output = encodeURIComponent(output);
  }
  return output;
};

const redactEncodedJsonProperties = text => {
  let result = text;
  const propertyKeys = [...new Set(SENSITIVE_KEYS)];

  propertyKeys.forEach(key => {
    for (let layer = 0; layer <= 4; layer += 1) {
      const prefix = encodeTimes(`"${key}":"`, layer);
      const suffix = encodeTimes('"', layer);
      const pattern = new RegExp(`(${escapeRegExp(prefix)})([\\s\\S]*?)(?=${escapeRegExp(suffix)})`, 'gi');
      result = result.replace(pattern, (match, matchPrefix, rawValue) => {
        const decodedValue = buildDecodedCandidates(rawValue).at(-1);
        if (isRuntimePlaceholder(decodedValue)) return match;
        return `${matchPrefix}${encodeTimes(toRedactedPlaceholder(key), layer)}`;
      });
    }
  });

  return result;
};

const redactParamLikeText = text => {
  let result = text;
  SENSITIVE_KEYS.forEach(key => {
    const pattern = new RegExp(
      `((?:^|[?&#]|%3F|%26|%23)${escapeRegExp(key)}(?:=|%3D))([\\s\\S]*?)(?=(?:[&#"\\\\\\s]|%26|%23|%22|$))`,
      'gi'
    );
    result = result.replace(pattern, (match, prefix, rawValue) => {
      if (isRuntimePlaceholder(rawValue)) return `${prefix}${rawValue}`;
      return `${prefix}${toRedactedPlaceholder(key)}`;
    });
  });
  return result;
};

const normalizeBase64Token = token => {
  const decodedPadding = token.replace(/%3D/gi, '=');
  const normalized = decodedPadding.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return `${normalized}${'='.repeat(paddingLength)}`;
};

const keepOriginalPaddingStyle = (token, encoded) => {
  const hasEncodedPadding = /%3D/i.test(token);
  const hasRawPadding = token.includes('=');
  const withoutPadding = encoded.replace(/=+$/g, '');
  if (hasEncodedPadding) return encoded.replace(/=/g, '%3D');
  if (hasRawPadding) return encoded;
  return withoutPadding;
};

const tryParseJson = text => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const decodeURIComponentSafe = value => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const encodeQueryValue = value => encodeURIComponent(value);

const buildDecodedCandidates = value => {
  const candidates = [value];
  let current = value;
  for (let index = 0; index < 4; index += 1) {
    const decoded = decodeURIComponentSafe(current);
    if (decoded === current) break;
    candidates.push(decoded);
    current = decoded;
  }
  return candidates;
};

const encodeQueryValueToDepth = (value, depth) => (
  depth <= 0 ? value : encodeTimes(value, depth)
);

const redactQueryValue = (rawKey, rawValue, depth) => {
  const key = decodeURIComponentSafe(rawKey);
  const decodedCandidates = buildDecodedCandidates(rawValue);
  if (decodedCandidates.some(isRuntimePlaceholder)) return rawValue;
  if (isSensitiveKey(key)) return encodeQueryValue(toRedactedPlaceholder(key));

  for (const [encodedDepth, decodedValue] of decodedCandidates.entries()) {
    const parsed = tryParseJson(decodedValue);
    if (parsed !== undefined) {
      return encodeQueryValueToDepth(
        JSON.stringify(redactJsonValue(parsed, [key], depth + 1)),
        encodedDepth
      );
    }
  }

  const encodedDepth = decodedCandidates.length - 1;
  const decodedValue = decodedCandidates[decodedCandidates.length - 1];
  const redactedDecoded = decodedValue === rawValue
    ? redactBase64LikeSegments(sanitizeLongIdentifiers(redactParamLikeText(rawValue)), depth + 1)
    : redactStringContent(decodedValue, depth + 1);

  return redactedDecoded === decodedValue && decodedValue !== rawValue
    ? rawValue
    : encodeQueryValueToDepth(redactedDecoded, encodedDepth);
};

const redactQueryPart = (part, depth) => {
  const separatorIndex = part.indexOf('=');
  if (separatorIndex < 0) return part;

  const rawKey = part.slice(0, separatorIndex);
  const rawValue = part.slice(separatorIndex + 1);
  return `${rawKey}=${redactQueryValue(rawKey, rawValue, depth)}`;
};

const redactQueryLikeText = (text, depth) => {
  if (depth > 5) return text;

  const questionIndex = text.indexOf('?');
  const hasBareQuery = questionIndex < 0 && /^[^=&?#]+=[\s\S]*(&[^=&?#]+=|$)/.test(text);
  if (questionIndex < 0 && !hasBareQuery) return text;

  const queryStart = questionIndex >= 0 ? questionIndex + 1 : 0;
  const prefix = text.slice(0, queryStart);
  const queryAndHash = text.slice(queryStart);
  const hashIndex = queryAndHash.indexOf('#');
  const query = hashIndex >= 0 ? queryAndHash.slice(0, hashIndex) : queryAndHash;
  const hash = hashIndex >= 0 ? queryAndHash.slice(hashIndex) : '';
  if (!query.includes('=')) return text;

  return `${prefix}${query.split('&').map(part => redactQueryPart(part, depth)).join('&')}${hash}`;
};

const redactBase64Token = (token, depth) => {
  if (depth > 2) return token;

  let decodedText = '';
  try {
    decodedText = Buffer.from(normalizeBase64Token(token), 'base64').toString('utf8');
  } catch {
    return token;
  }

  if (!isMostlyPrintable(decodedText)) return token;

  const parsed = tryParseJson(decodedText);
  const redactedText = parsed === undefined
    ? redactStringContent(decodedText, depth + 1)
    : JSON.stringify(redactJsonValue(parsed, [], depth + 1));
  if (redactedText === decodedText) return token;

  return keepOriginalPaddingStyle(token, Buffer.from(redactedText, 'utf8').toString('base64'));
};

const redactBase64LikeSegments = (text, depth) => (
  text.replace(/[A-Za-z0-9+/_-]{24,}(?:=|%3D){0,2}/gi, token => redactBase64Token(token, depth))
);

export const redactStringContent = (text, depth = 0) => {
  if (isRuntimePlaceholder(text)) return text;
  const parsed = tryParseJson(text);
  if (Array.isArray(parsed) || isRecord(parsed)) {
    return JSON.stringify(redactJsonValue(parsed, [], depth + 1));
  }
  const queryRedacted = redactQueryLikeText(text, depth);
  const propertyRedacted = redactEncodedJsonProperties(queryRedacted);

  return redactBase64LikeSegments(
    sanitizeLongIdentifiers(redactParamLikeText(propertyRedacted)),
    depth
  );
};

const buildSafeExtraParam = () => {
  const body = Buffer.from(JSON.stringify({
    meg_name: 'AI',
    ad_extend: JSON.stringify({
      ad_info: {
        h_ecpm: 207000,
      },
      bid: 138,
    }),
  })).toString('base64');
  const suffix = Buffer.from('&os=2&ip=127.0.0.1&ua=okhttp%2F3.12.12').toString('base64');
  return `AFD8f${body}UxM${suffix}`;
};

const redactSensitiveValue = (key, value, pathParts, depth) => {
  if (isRuntimePlaceholder(value)) return value;
  if (typeof value === 'string') return toRedactedPlaceholder(key);
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.map(item => redactJsonValue(item, pathParts, depth + 1));
  if (isRecord(value)) return redactJsonValue(value, pathParts, depth + 1);
  return value;
};

export const redactJsonValue = (value, pathParts = [], depth = 0) => {
  const currentKey = pathParts[pathParts.length - 1] || '';

  if (typeof value === 'string') {
    if (isSensitiveKey(currentKey)) {
      return redactSensitiveValue(currentKey, value, pathParts, depth);
    }
    return redactStringContent(value, depth);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactJsonValue(item, [...pathParts, String(index)], depth + 1));
  }

  if (!isRecord(value)) {
    if (isSensitiveKey(currentKey)) {
      return redactSensitiveValue(currentKey, value, pathParts, depth);
    }
    return value;
  }

  if (value.k === 'extraParam' && typeof value.v === 'string') {
    return {
      ...value,
      v: buildSafeExtraParam(),
    };
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      isSensitiveKey(key)
        ? redactSensitiveValue(key, child, [...pathParts, key], depth + 1)
        : redactJsonValue(child, [...pathParts, key], depth + 1),
    ])
  );
};

const chunkString = (value, size) => {
  const chunks = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks;
};

export const extractLongStrings = (value, options = {}) => {
  const chunkSize = options.chunkSize || DEFAULT_CHUNK_SIZE;
  const replacements = {};
  let index = 0;

  const visit = item => {
    if (typeof item === 'string') {
      if (item.length <= chunkSize) return item;
      index += 1;
      const placeholder = `__CORPUS_STRING_${index}__`;
      replacements[placeholder] = chunkString(item, chunkSize);
      return placeholder;
    }

    if (Array.isArray(item)) return item.map(visit);

    if (isRecord(item)) {
      return Object.fromEntries(
        Object.entries(item).map(([key, child]) => [key, visit(child)])
      );
    }

    return item;
  };

  return {
    value: visit(value),
    replacements,
  };
};

export const applyFixtureReplacements = (value, replacements) => {
  if (typeof value === 'string') {
    return Array.isArray(replacements[value]) ? replacements[value].join('') : value;
  }
  if (Array.isArray(value)) return value.map(item => applyFixtureReplacements(item, replacements));
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, applyFixtureReplacements(child, replacements)])
    );
  }
  return value;
};

const uniqueStrings = values => {
  const result = [];
  const seen = new Set();
  values.forEach(value => {
    if (typeof value !== 'string' || !value || seen.has(value)) return;
    seen.add(value);
    result.push(value);
  });
  return result;
};

const getDecodedAuditValue = value => buildDecodedCandidates(value).at(-1) || value;

const isSafeAuditValue = value => {
  const decodedValue = getDecodedAuditValue(value);
  return !decodedValue || isRuntimePlaceholder(decodedValue);
};

const collectSensitivePropertyLeaks = text => {
  const leaks = [];
  const propertyKeys = [...new Set(SENSITIVE_KEYS)];

  propertyKeys.forEach(key => {
    for (let layer = 0; layer <= 4; layer += 1) {
      const prefix = encodeTimes(`"${key}":"`, layer);
      const suffix = encodeTimes('"', layer);
      const pattern = new RegExp(`${escapeRegExp(prefix)}([\\s\\S]*?)(?=${escapeRegExp(suffix)})`, 'gi');
      for (const match of text.matchAll(pattern)) {
        const rawValue = match[1] || '';
        if (isSafeAuditValue(rawValue)) continue;
        leaks.push(`${key}=${getDecodedAuditValue(rawValue).slice(0, 80)}`);
      }
    }
  });

  return uniqueStrings(leaks);
};

const collectSensitiveParamLeaks = text => {
  const leaks = [];
  const propertyKeys = [...new Set(SENSITIVE_KEYS)];

  propertyKeys.forEach(key => {
    for (let layer = 0; layer <= 4; layer += 1) {
      const encodedKey = encodeTimes(key, layer);
      const pattern = new RegExp(
        `(?:^|[?&#]|%3F|%26|%23)${escapeRegExp(encodedKey)}(?:=|%3D)([\\s\\S]*?)(?=(?:[&#"\\\\\\s]|%26|%23|%22|$))`,
        'gi'
      );
      for (const match of text.matchAll(pattern)) {
        const rawValue = match[1] || '';
        if (isSafeAuditValue(rawValue)) continue;
        leaks.push(`${key}=${getDecodedAuditValue(rawValue).slice(0, 80)}`);
      }
    }
  });

  return uniqueStrings(leaks);
};

const collectUuidLeaks = text => (
  uniqueStrings(text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [])
    .filter(value => value !== '00000000-0000-4000-8000-000000000000')
);

const collectLongNumericWarnings = text => (
  uniqueStrings(text.match(/\d{13,}/g) || [])
    .filter(value => value !== '1000000000000')
);

const collectHexTokenWarnings = text => (
  uniqueStrings(text.match(/\b[0-9a-f]{32,}\b/gi) || [])
    .filter(value => !/^0+$/.test(value))
);

export const buildPromotionAudit = fixture => {
  const responseText = JSON.stringify(applyFixtureReplacements(fixture.responseTemplate, fixture.replacements || {}));
  const scanText = responseText;
  const sensitiveValueLeaks = uniqueStrings([
    ...collectSensitivePropertyLeaks(scanText),
    ...collectSensitiveParamLeaks(scanText),
  ]);
  const uuidLeaks = collectUuidLeaks(scanText);
  const longNumericWarnings = collectLongNumericWarnings(scanText);
  const hexTokenWarnings = collectHexTokenWarnings(scanText);
  const highRiskCount = sensitiveValueLeaks.length + uuidLeaks.length;
  const warningCount = longNumericWarnings.length + hexTokenWarnings.length;

  return {
    status: highRiskCount > 0 ? 'FAIL' : (warningCount > 0 ? 'WARN' : 'PASS'),
    pass: highRiskCount === 0,
    responseBytes: Buffer.byteLength(responseText, 'utf8'),
    sensitiveValueLeaks: sensitiveValueLeaks.slice(0, 20),
    uuidLeaks: uuidLeaks.slice(0, 20),
    longNumericWarnings: longNumericWarnings.slice(0, 20),
    hexTokenWarnings: hexTokenWarnings.slice(0, 20),
    totals: {
      sensitiveValueLeaks: sensitiveValueLeaks.length,
      uuidLeaks: uuidLeaks.length,
      longNumericWarnings: longNumericWarnings.length,
      hexTokenWarnings: hexTokenWarnings.length,
    },
  };
};

const formatSampleList = values => (
  values.length === 0 ? '无' : values.slice(0, 5).join('；')
);

export const formatPromotionAuditSummary = audit => [
  `脱敏审计: ${audit.status}`,
  `- 回填 response: ${audit.responseBytes} bytes`,
  `- 敏感属性/参数残留: ${audit.totals.sensitiveValueLeaks}`,
  `- UUID 残留: ${audit.totals.uuidLeaks}`,
  `- 长数字候选: ${audit.totals.longNumericWarnings}`,
  `- 高熵十六进制候选: ${audit.totals.hexTokenWarnings}`,
  ...(audit.sensitiveValueLeaks.length > 0
    ? [`- 敏感残留样例: ${formatSampleList(audit.sensitiveValueLeaks)}`]
    : []),
  ...(audit.uuidLeaks.length > 0
    ? [`- UUID 样例: ${formatSampleList(audit.uuidLeaks)}`]
    : []),
  ...(audit.longNumericWarnings.length > 0
    ? [`- 长数字样例: ${formatSampleList(audit.longNumericWarnings)}`]
    : []),
  ...(audit.hexTokenWarnings.length > 0
    ? [`- 高熵片段样例: ${formatSampleList(audit.hexTokenWarnings)}`]
    : []),
].join('\n');

export const buildCorpusFixtureCandidate = (input, options = {}) => {
  const source = typeof input === 'string' ? JSON.parse(input) : input;
  const redacted = redactJsonValue(source);
  const { value: responseTemplate, replacements } = extractLongStrings(redacted, {
    chunkSize: options.chunkSize,
  });

  return {
    schemaVersion: 1,
    name: options.name || 'promoted-response-redacted',
    description: options.description || '由真实 response 生成的脱敏 Scheme/CMD corpus 候选样本。',
    responseTemplate,
    replacements,
  };
};

const parseCliArgs = argv => {
  const options = {
    inputPath: undefined,
    outputPath: undefined,
    responseOutputPath: undefined,
    name: undefined,
    description: undefined,
    chunkSize: DEFAULT_CHUNK_SIZE,
    quiet: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      const value = argv[index + 1];
      if (!value) throw new Error(`${arg} 需要参数值`);
      index += 1;
      return value;
    };

    if (arg === '--input') {
      options.inputPath = nextValue();
      continue;
    }
    if (arg === '--output') {
      options.outputPath = nextValue();
      continue;
    }
    if (arg === '--response-output') {
      options.responseOutputPath = nextValue();
      continue;
    }
    if (arg === '--name') {
      options.name = nextValue();
      continue;
    }
    if (arg === '--description') {
      options.description = nextValue();
      continue;
    }
    if (arg === '--chunk-size') {
      const value = Number(nextValue());
      if (!Number.isInteger(value) || value < 40) {
        throw new Error('--chunk-size 需要不小于 40 的整数');
      }
      options.chunkSize = value;
      continue;
    }
    if (arg === '--quiet') {
      options.quiet = true;
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`未知参数: ${arg}`);
    }
    if (options.inputPath) throw new Error('一次只能输入一个 response 文件');
    options.inputPath = arg;
  }

  if (!options.inputPath) throw new Error('需要输入 response 文件路径');
  return options;
};

const writeTextFile = async (filePath, text) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, text);
  return absolutePath;
};

const printUsage = () => {
  console.error('用法: npm run corpus:promote -- --input response.json --name reward-response-live-redacted [--output fixture.json] [--response-output redacted-response.json] [--quiet]');
};

const runCli = async () => {
  const scriptPath = process.argv[1];
  const isMain = scriptPath && import.meta.url === new URL(scriptPath, 'file:').href;
  if (!isMain) return;

  try {
    const options = parseCliArgs(process.argv.slice(2));
    const inputText = await readFile(path.resolve(process.cwd(), options.inputPath), 'utf8');
    const fixture = buildCorpusFixtureCandidate(inputText, options);
    const audit = buildPromotionAudit(fixture);
    const fixtureText = `${JSON.stringify(fixture, null, 2)}\n`;
    if (!options.quiet) process.stdout.write(fixtureText);

    if (options.outputPath) {
      const outputPath = await writeTextFile(options.outputPath, fixtureText);
      console.error(`已写入 corpus 候选: ${outputPath}`);
    }
    if (options.responseOutputPath) {
      const responseText = `${JSON.stringify(applyFixtureReplacements(fixture.responseTemplate, fixture.replacements))}\n`;
      const responseOutputPath = await writeTextFile(options.responseOutputPath, responseText);
      console.error(`已写入脱敏 response: ${responseOutputPath}`);
    }
    console.error(formatPromotionAuditSummary(audit));
    if (options.responseOutputPath) {
      console.error(`下一步可运行: npm run corpus:snapshot -- --input ${options.responseOutputPath} --name ${fixture.name}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    process.exitCode = 1;
  }
};

await runCli();
