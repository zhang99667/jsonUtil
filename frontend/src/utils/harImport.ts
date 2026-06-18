import { TransformMode, type JsonValue } from '../types';

export interface ImportedTextFile {
  content: string;
  name?: string;
  mode?: TransformMode;
  preserveHandle?: boolean;
  toastMessage?: string;
  toastType?: 'success' | 'info';
}

interface HarPayloadBody {
  kind: 'json' | 'form' | 'text' | 'base64';
  value?: JsonValue;
  text?: string;
  params?: Record<string, string>;
  encoding?: string;
  truncated?: boolean;
  parseError?: string;
}

interface HarPayloadEntry {
  index: number;
  label: string;
  startedDateTime?: string;
  request: {
    method: string;
    url: string;
    host?: string;
    path?: string;
    body?: HarPayloadBody;
  };
  response: {
    status: number;
    mimeType?: string;
    body?: HarPayloadBody;
  };
}

interface HarPayloadSummary {
  requestBodyCount: number;
  responseBodyCount: number;
  methods: Record<string, number>;
  statusCodes: Record<string, number>;
  statusGroups: Record<string, number>;
  hosts: Record<string, number>;
  mimeTypes: Record<string, number>;
  bodyKinds: Record<string, number>;
}

interface HarPayloadExport {
  schemaVersion: 1;
  source: 'HAR_PAYLOAD_EXPORT';
  entryCount: number;
  extractedEntryCount: number;
  skippedEntryCount: number;
  isLimited: boolean;
  summary: HarPayloadSummary;
  entries: HarPayloadEntry[];
}

const MAX_HAR_PAYLOAD_ENTRIES = 200;
const MAX_HAR_BODY_TEXT_CHARS = 200_000;
const EMPTY_HAR_URL_LABEL = '(empty url)';

const isRecord = (value: unknown): value is Record<string, unknown> => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isHarFileName = (fileName: string): boolean => (
  fileName.trim().toLowerCase().endsWith('.har')
);

const getString = (value: unknown): string | undefined => (
  typeof value === 'string' ? value : undefined
);

const getNumber = (value: unknown): number | undefined => (
  typeof value === 'number' && Number.isFinite(value) ? value : undefined
);

const incrementCounter = (counter: Record<string, number>, key: string | undefined) => {
  const normalizedKey = key?.trim() || 'unknown';
  counter[normalizedKey] = (counter[normalizedKey] || 0) + 1;
};

const sortCounter = (counter: Record<string, number>): Record<string, number> => (
  Object.fromEntries(
    Object.entries(counter).sort(([leftKey, leftValue], [rightKey, rightValue]) => {
      if (leftValue !== rightValue) return rightValue - leftValue;
      return leftKey.localeCompare(rightKey);
    })
  )
);

const truncateBodyText = (text: string): { text: string; truncated: boolean } => {
  if (text.length <= MAX_HAR_BODY_TEXT_CHARS) {
    return { text, truncated: false };
  }

  return {
    text: text.slice(0, MAX_HAR_BODY_TEXT_CHARS),
    truncated: true,
  };
};

const isJsonMimeType = (mimeType: string): boolean => {
  const normalized = mimeType.toLowerCase();
  return normalized.includes('json') || normalized.includes('javascript');
};

const looksLikeJson = (value: string): boolean => {
  const trimmed = value.trim();
  return trimmed.startsWith('{') || trimmed.startsWith('[');
};

const decodeBase64Text = (value: string): string | null => {
  try {
    const binary = globalThis.atob(value);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return null;
  }
};

const parseFormBody = (value: string): Record<string, string> | null => {
  try {
    return Object.fromEntries(new URLSearchParams(value));
  } catch {
    return null;
  }
};

const parseHarPostDataParams = (value: unknown): Record<string, string> | null => {
  if (!Array.isArray(value)) return null;

  const params: Record<string, string> = {};
  value.forEach(param => {
    if (!isRecord(param)) return;

    const name = getString(param.name);
    if (!name) return;

    params[name] = getString(param.value) || '';
  });

  return Object.keys(params).length > 0 ? params : null;
};

const toHarPostDataParamsBody = (value: unknown): HarPayloadBody | undefined => {
  const params = parseHarPostDataParams(value);
  if (!params) return undefined;

  return {
    kind: 'form',
    params,
  };
};

const getUrlSummaryParts = (url: string): { host?: string; path?: string; label: string } => {
  if (!url.trim()) {
    return { label: EMPTY_HAR_URL_LABEL };
  }

  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname || '/';
    return {
      host: parsedUrl.host,
      path,
      label: `${parsedUrl.host}${path}`,
    };
  } catch {
    const label = url.split(/[?#]/)[0].trim() || EMPTY_HAR_URL_LABEL;
    return { path: label, label };
  }
};

const getStatusGroup = (status: number): string => {
  if (status >= 100 && status <= 599) {
    return `${Math.floor(status / 100)}xx`;
  }

  return 'unknown';
};

const buildHarPayloadSummary = (entries: HarPayloadEntry[]): HarPayloadSummary => {
  const summary: HarPayloadSummary = {
    requestBodyCount: 0,
    responseBodyCount: 0,
    methods: {},
    statusCodes: {},
    statusGroups: {},
    hosts: {},
    mimeTypes: {},
    bodyKinds: {},
  };

  entries.forEach(entry => {
    incrementCounter(summary.methods, entry.request.method);
    incrementCounter(summary.statusCodes, String(entry.response.status || 'unknown'));
    incrementCounter(summary.statusGroups, getStatusGroup(entry.response.status));
    incrementCounter(summary.hosts, entry.request.host);

    if (entry.response.mimeType) {
      incrementCounter(summary.mimeTypes, entry.response.mimeType);
    }

    if (entry.request.body) {
      summary.requestBodyCount++;
      incrementCounter(summary.bodyKinds, `request:${entry.request.body.kind}`);
    }

    if (entry.response.body) {
      summary.responseBodyCount++;
      incrementCounter(summary.bodyKinds, `response:${entry.response.body.kind}`);
    }
  });

  return {
    requestBodyCount: summary.requestBodyCount,
    responseBodyCount: summary.responseBodyCount,
    methods: sortCounter(summary.methods),
    statusCodes: sortCounter(summary.statusCodes),
    statusGroups: sortCounter(summary.statusGroups),
    hosts: sortCounter(summary.hosts),
    mimeTypes: sortCounter(summary.mimeTypes),
    bodyKinds: sortCounter(summary.bodyKinds),
  };
};

const toPayloadBody = (
  rawText: string | undefined,
  mimeType: string = '',
  encoding?: string
): HarPayloadBody | undefined => {
  if (typeof rawText !== 'string' || rawText.length === 0) return undefined;

  const decodedText = encoding === 'base64'
    ? decodeBase64Text(rawText)
    : rawText;

  if (encoding === 'base64' && decodedText === null) {
    const truncated = truncateBodyText(rawText);
    return {
      kind: 'base64',
      text: truncated.text,
      encoding,
      ...(truncated.truncated ? { truncated: true } : {}),
    };
  }

  const bodyText = decodedText ?? rawText;
  const truncated = truncateBodyText(bodyText);
  const text = truncated.text;

  if (isJsonMimeType(mimeType) || looksLikeJson(text)) {
    try {
      return {
        kind: 'json',
        value: JSON.parse(text) as JsonValue,
        ...(encoding ? { encoding } : {}),
        ...(truncated.truncated ? { truncated: true } : {}),
      };
    } catch (error) {
      const parseError = error instanceof Error ? error.message : String(error);
      return {
        kind: 'text',
        text,
        parseError,
        ...(encoding ? { encoding } : {}),
        ...(truncated.truncated ? { truncated: true } : {}),
      };
    }
  }

  if (mimeType.toLowerCase().includes('x-www-form-urlencoded')) {
    const params = parseFormBody(text);
    if (params) {
      return {
        kind: 'form',
        params,
        ...(encoding ? { encoding } : {}),
        ...(truncated.truncated ? { truncated: true } : {}),
      };
    }
  }

  return {
    kind: encoding === 'base64' ? 'base64' : 'text',
    text,
    ...(encoding ? { encoding } : {}),
    ...(truncated.truncated ? { truncated: true } : {}),
  };
};

const getHarEntries = (value: unknown): unknown[] | null => {
  if (!isRecord(value)) return null;
  const log = value.log;
  if (!isRecord(log) || !Array.isArray(log.entries)) return null;
  return log.entries;
};

const toPayloadEntry = (entry: unknown, index: number): HarPayloadEntry | null => {
  if (!isRecord(entry)) return null;

  const request = isRecord(entry.request) ? entry.request : null;
  const response = isRecord(entry.response) ? entry.response : null;
  if (!request || !response) return null;

  const method = getString(request.method) || 'GET';
  const url = getString(request.url) || '';
  const status = getNumber(response.status) ?? 0;
  const responseContent = isRecord(response.content) ? response.content : {};
  const requestPostData = isRecord(request.postData) ? request.postData : {};
  const requestMimeType = getString(requestPostData.mimeType) || '';
  const responseMimeType = getString(responseContent.mimeType) || '';
  const urlSummaryParts = getUrlSummaryParts(url);
  const requestBody = toPayloadBody(getString(requestPostData.text), requestMimeType) ||
    toHarPostDataParamsBody(requestPostData.params);
  const responseBody = toPayloadBody(
    getString(responseContent.text),
    responseMimeType,
    getString(responseContent.encoding)
  );
  const startedDateTime = getString(entry.startedDateTime);

  if (!requestBody && !responseBody) return null;

  return {
    index,
    label: `${method} ${status} ${urlSummaryParts.label}`,
    ...(startedDateTime ? { startedDateTime } : {}),
    request: {
      method,
      url,
      ...(urlSummaryParts.host ? { host: urlSummaryParts.host } : {}),
      ...(urlSummaryParts.path ? { path: urlSummaryParts.path } : {}),
      ...(requestBody ? { body: requestBody } : {}),
    },
    response: {
      status,
      ...(responseMimeType ? { mimeType: responseMimeType } : {}),
      ...(responseBody ? { body: responseBody } : {}),
    },
  };
};

export const extractHarPayloads = (harText: string): HarPayloadExport | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(harText);
  } catch {
    return null;
  }

  const entries = getHarEntries(parsed);
  if (!entries) return null;

  const payloadEntries: HarPayloadEntry[] = [];
  let processedEntryCount = 0;
  for (let index = 0; index < entries.length && payloadEntries.length < MAX_HAR_PAYLOAD_ENTRIES; index++) {
    processedEntryCount = index + 1;
    const payloadEntry = toPayloadEntry(entries[index], index);
    if (payloadEntry) {
      payloadEntries.push(payloadEntry);
    }
  }

  return {
    schemaVersion: 1,
    source: 'HAR_PAYLOAD_EXPORT',
    entryCount: entries.length,
    extractedEntryCount: payloadEntries.length,
    skippedEntryCount: entries.length - payloadEntries.length,
    isLimited: payloadEntries.length >= MAX_HAR_PAYLOAD_ENTRIES && processedEntryCount < entries.length,
    summary: buildHarPayloadSummary(payloadEntries),
    entries: payloadEntries,
  };
};

export const importTextFileContent = (
  fileName: string,
  content: string
): ImportedTextFile => {
  if (!isHarFileName(fileName)) {
    return { content, preserveHandle: true };
  }

  const harPayloads = extractHarPayloads(content);
  if (!harPayloads) {
    return {
      content,
      preserveHandle: true,
      toastMessage: '未识别到标准 HAR 结构，已按普通文本打开',
      toastType: 'info',
    };
  }

  return {
    content: JSON.stringify(harPayloads, null, 2),
    name: `${fileName}.payloads.json`,
    mode: TransformMode.DEEP_FORMAT,
    preserveHandle: false,
    toastMessage: `已从 HAR 提取 ${harPayloads.extractedEntryCount}/${harPayloads.entryCount} 条请求/响应 body`,
    toastType: 'success',
  };
};
