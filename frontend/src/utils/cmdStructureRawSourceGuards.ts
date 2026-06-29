import { isLikelyStructuredFieldName } from './structuredParamNames';

const RAW_CMD_FIELD_PRIORITIES = new Map<string, number>([
  ['$', 100],
  ['scheme', 100],
  ['cmd', 100],
  ['schema', 98],
  ['action_cmd', 96],
  ['actioncmd', 96],
  ['command', 94],
  ['convert_cmd', 92],
  ['panel_cmd', 90],
  ['webpanel_cmd', 90],
  ['panel_scheme', 88],
  ['stay_cmd', 86],
  ['reward_cmd', 86],
  ['strong_guide_cmd', 86],
  ['button_scheme', 82],
  ['bottom_button_scheme', 82],
  ['button_cmd', 78],
  ['url', 30],
  ['page_url', 28],
  ['lp_real_url', 28],
  ['click_url', 24],
  ['video_url', 10],
]);

export const URL_LIKE_RE = /^[A-Za-z][A-Za-z0-9+.-]*:\/\//;
export const QUERY_PAIR_RE = /^\??[A-Za-z0-9_.\-[\]%]+=/;

export const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

export const normalizeRawSourceString = (value: string): string => value.trim().replace(/\\\//g, '/');

export const getRawCmdFieldPriority = (key: string): number => {
  const lowerKey = key.trim().toLowerCase();
  return RAW_CMD_FIELD_PRIORITIES.get(key) ??
    RAW_CMD_FIELD_PRIORITIES.get(lowerKey) ??
    (/(_cmd|cmd|_scheme|scheme)$/i.test(key) ? 70 : 0);
};

export const looksLikeRawCmdSource = (value: string): boolean => {
  const normalized = normalizeRawSourceString(value);
  if (!normalized || /^__[^_]+__$/.test(normalized)) return false;

  if (URL_LIKE_RE.test(normalized) || QUERY_PAIR_RE.test(normalized)) return true;

  const decoded = safeDecodeURIComponent(normalized);
  return decoded !== normalized && (URL_LIKE_RE.test(decoded) || QUERY_PAIR_RE.test(decoded));
};

export const isStructuredCmdField = (key: string): boolean => {
  const lowerKey = key.trim().toLowerCase();
  return RAW_CMD_FIELD_PRIORITIES.has(key) ||
    RAW_CMD_FIELD_PRIORITIES.has(lowerKey) ||
    isLikelyStructuredFieldName(key);
};
