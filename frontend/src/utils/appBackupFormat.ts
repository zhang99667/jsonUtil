import Ajv, { type AnySchema } from 'ajv';
import { parseJsonValue } from './jsonValueGuards';
import { isFiniteNumber, isRecord } from './storage';

export const APP_BACKUP_APP_ID = 'jsonutils-pro';
export const APP_BACKUP_VERSION = 1;

export interface AppBackupFormatCapabilities {
  jsonSchema: boolean;
  structureNav: boolean;
}

export interface ParsedAppBackupPayload {
  payload: Record<string, unknown>;
  capabilities: AppBackupFormatCapabilities;
}

export const isPanelPosition = (value: unknown): value is { x: number; y: number } => (
  isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y)
);

export const isPanelSize = (value: unknown): value is { width: number; height: number } => (
  isRecord(value) && isFiniteNumber(value.width) && isFiniteNumber(value.height)
);

const KNOWN_PANEL_KEYS = [
  'jsonpath-panel',
  'json-compare-panel',
  'structure-nav-panel',
  'json-schema-panel',
  'scheme-panel',
  'template-fill-panel',
] as const;

const RECORD_SCHEMA: AnySchema = { type: 'object' };
const ARRAY_SCHEMA: AnySchema = { type: 'array' };
const createObjectSchema = (
  required: string[],
  properties: Record<string, AnySchema>
): AnySchema => ({ type: 'object', required, properties });
const createNumberRecordSchema = (keys: string[]): AnySchema => createObjectSchema(
  keys,
  Object.fromEntries(keys.map(key => [key, { type: 'number' }]))
);

const PANEL_LAYOUT_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    position: createNumberRecordSchema(['x', 'y']),
    size: createNumberRecordSchema(['width', 'height']),
  },
};

const APP_BACKUP_V1_SCHEMA: AnySchema = {
  type: 'object',
  required: ['exportedAt', 'settings', 'jsonPath', 'templateFill', 'panelLayout'],
  properties: {
    exportedAt: { type: 'string' },
    settings: createObjectSchema(
      ['general', 'ai', 'shortcuts'],
      { general: RECORD_SCHEMA, ai: RECORD_SCHEMA, shortcuts: RECORD_SCHEMA }
    ),
    jsonPath: createObjectSchema(
      ['history', 'favorites'],
      { history: ARRAY_SCHEMA, favorites: ARRAY_SCHEMA }
    ),
    jsonSchema: createObjectSchema(['library'], { library: ARRAY_SCHEMA }),
    structureNav: createObjectSchema(['searchHistory'], { searchHistory: ARRAY_SCHEMA }),
    templateFill: createObjectSchema(
      ['template', 'lastUpdated'],
      { template: { type: 'string' }, lastUpdated: { type: 'number' } }
    ),
    panelLayout: {
      type: 'object',
      properties: Object.fromEntries(KNOWN_PANEL_KEYS.map(key => [key, PANEL_LAYOUT_ITEM_SCHEMA])),
    },
  },
  if: { required: ['structureNav'] },
  then: { required: ['jsonSchema'] },
};

const validateAppBackupV1 = new Ajv({ strict: false })
  .compile<Record<string, unknown>>(APP_BACKUP_V1_SCHEMA);

const resolveCapabilities = (payload: Record<string, unknown>): AppBackupFormatCapabilities => ({
  jsonSchema: Object.hasOwn(payload, 'jsonSchema'),
  structureNav: Object.hasOwn(payload, 'structureNav'),
});

export const parseAppBackupPayload = (content: string): ParsedAppBackupPayload => {
  let parsed: unknown;

  try {
    parsed = parseJsonValue(content);
  } catch {
    throw new Error('备份文件不是合法 JSON');
  }

  if (!isRecord(parsed) || parsed.app !== APP_BACKUP_APP_ID || parsed.version !== APP_BACKUP_VERSION) {
    throw new Error('备份文件不是 JSONUtils 配置备份');
  }

  if (!validateAppBackupV1(parsed)) {
    throw new Error('备份文件缺少必要配置');
  }

  return {
    payload: parsed,
    capabilities: resolveCapabilities(parsed),
  };
};

export const shouldApplyPanelLayout = (
  key: string,
  capabilities: AppBackupFormatCapabilities,
  panelLayout: Record<string, unknown>
): boolean => {
  if (Object.hasOwn(panelLayout, key)) return true;
  if (key === 'jsonpath-panel' || key === 'scheme-panel' || key === 'template-fill-panel') {
    return true;
  }
  if (key === 'json-schema-panel') return capabilities.jsonSchema;
  if (key === 'structure-nav-panel' || key === 'json-compare-panel') {
    return capabilities.structureNav;
  }
  return false;
};
