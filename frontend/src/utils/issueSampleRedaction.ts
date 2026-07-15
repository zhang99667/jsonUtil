import { tryDecodeURIComponent } from './schemeQueryDecoding';

export interface SensitiveIssueSample {
  path: string;
  sourcePath?: string;
  sourceLabel?: string;
  value?: string;
  originalValue: string;
  redactionHint?: string;
}

export interface IssueSampleSensitiveHint {
  path: string;
  keywords: string[];
}

const SENSITIVE_SAMPLE_KEYWORDS = [
  'access_token',
  'refresh_token',
  'authorization',
  'android_id',
  'device_id',
  'baiduid',
  'baidu_id',
  'password',
  'passwd',
  'session',
  'cookie',
  'secret',
  'token',
  'sign',
  'imei',
  'oaid',
  'idfa',
  'cuid',
];

const decodeForSensitiveSearch = (value: string): string => {
  let current = value;
  for (let index = 0; index < 2; index++) {
    const decoded = tryDecodeURIComponent(current.replace(/\+/g, ' '));
    if (decoded === null || decoded === current) break;
    current = decoded;
  }
  return current;
};

const includesSensitiveKeyword = (text: string, keyword: string): boolean => {
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapedKeyword}([^a-z0-9]|$)`, 'i').test(text);
};

export const collectIssueSampleSensitiveKeywords = (sample: SensitiveIssueSample): string[] => {
  const searchText = [
    sample.path,
    sample.sourcePath,
    sample.sourceLabel,
    sample.value,
    sample.originalValue,
    decodeForSensitiveSearch(sample.originalValue),
  ].filter(Boolean).join('\n');

  return SENSITIVE_SAMPLE_KEYWORDS.filter(keyword => includesSensitiveKeyword(searchText, keyword));
};

export const collectIssueSampleSensitiveHints = (
  samples: SensitiveIssueSample[]
): IssueSampleSensitiveHint[] => (
  samples.flatMap(sample => {
    const keywords = collectIssueSampleSensitiveKeywords(sample);
    return keywords.length > 0 ? [{ path: sample.path, keywords }] : [];
  })
);

export const formatIssueSampleSensitiveHint = (
  hint: IssueSampleSensitiveHint
): string => `${hint.path}(${hint.keywords.join('/')})`;

export const redactSensitiveIssueSamples = <T extends SensitiveIssueSample>(
  samples: T[]
): T[] => (
  samples.map(sample => {
    const keywords = collectIssueSampleSensitiveKeywords(sample);
    if (keywords.length === 0) return sample;

    return {
      ...sample,
      originalValue: `[REDACTED: ${keywords.join('/')}]`,
      redactionHint: `原始值已脱敏，命中: ${keywords.join('/')}`,
    };
  })
);
