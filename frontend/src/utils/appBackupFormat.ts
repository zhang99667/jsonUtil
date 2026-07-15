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

const hasValidPanelLayout = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;

  return KNOWN_PANEL_KEYS.every(key => {
    if (!Object.hasOwn(value, key)) return true;
    const item = value[key];
    return isRecord(item)
      && (!Object.hasOwn(item, 'position') || isPanelPosition(item.position))
      && (!Object.hasOwn(item, 'size') || isPanelSize(item.size));
  });
};

const hasCoreV1Fields = (payload: Record<string, unknown>): boolean => {
  const settings = payload.settings;
  const jsonPath = payload.jsonPath;
  const templateFill = payload.templateFill;

  return typeof payload.exportedAt === 'string'
    && isRecord(settings)
    && isRecord(settings.general)
    && isRecord(settings.ai)
    && isRecord(settings.shortcuts)
    && isRecord(jsonPath)
    && Array.isArray(jsonPath.history)
    && Array.isArray(jsonPath.favorites)
    && isRecord(templateFill)
    && typeof templateFill.template === 'string'
    && isFiniteNumber(templateFill.lastUpdated)
    && hasValidPanelLayout(payload.panelLayout);
};

const resolveCapabilities = (
  payload: Record<string, unknown>
): AppBackupFormatCapabilities => {
  const jsonSchema = Object.hasOwn(payload, 'jsonSchema');
  const structureNav = Object.hasOwn(payload, 'structureNav');

  if (structureNav && !jsonSchema) {
    throw new Error('备份文件缺少必要配置');
  }

  if (jsonSchema) {
    const section = payload.jsonSchema;
    if (!isRecord(section) || !Array.isArray(section.library)) {
      throw new Error('备份文件缺少必要配置');
    }
  }

  if (structureNav) {
    const section = payload.structureNav;
    if (!isRecord(section) || !Array.isArray(section.searchHistory)) {
      throw new Error('备份文件缺少必要配置');
    }
  }

  return { jsonSchema, structureNav };
};

export const parseAppBackupPayload = (content: string): ParsedAppBackupPayload => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('备份文件不是合法 JSON');
  }

  if (!isRecord(parsed) || parsed.app !== APP_BACKUP_APP_ID || parsed.version !== APP_BACKUP_VERSION) {
    throw new Error('备份文件不是 JSONUtils 配置备份');
  }

  if (!hasCoreV1Fields(parsed)) {
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
