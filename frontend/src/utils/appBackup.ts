import type { AIConfig, GeneralSettings, ShortcutConfig } from '../types';
import {
  AI_CONFIG_STORAGE_KEY,
  GENERAL_SETTINGS_STORAGE_KEY,
  TEMPLATE_FILL_STORAGE_KEY,
  normalizeAIConfig,
  normalizeGeneralSettings,
  normalizeTemplateFillConfig,
  sanitizeAIConfigForBackup,
} from './appSettings';
import { normalizeJsonPathSavedQueryLists } from './jsonPathSavedQueryStorage';
import {
  JSONPATH_FAVORITES_STORAGE_KEY,
  JSONPATH_HISTORY_STORAGE_KEY,
  parseStoredJsonPathList,
} from './jsonPathLists';
import {
  JSON_SCHEMA_LIBRARY_STORAGE_KEY,
  parseJsonSchemaLibrary,
  serializeJsonSchemaLibrary,
  type JsonSchemaLibraryItem,
} from './jsonSchemaLibrary';
import {
  JSON_TREE_SEARCH_HISTORY_STORAGE_KEY,
  normalizeJsonTreeSearchHistory,
  parseStoredJsonTreeSearchHistory,
} from './jsonTreeSearchHistory';
import { FLOATING_PANEL_STORAGE_KEYS } from './panelLayout';
import { DEFAULT_SHORTCUTS, SHORTCUTS_STORAGE_KEY, normalizeShortcutConfig } from './shortcuts';
import { isRecord, parseJsonWithFallback } from './storage';
import {
  applyAppBackupStorageMutations,
  type AppBackupStorageMutation,
} from './appBackupStorageMutations';
import {
  APP_BACKUP_APP_ID,
  APP_BACKUP_VERSION,
  isPanelPosition,
  isPanelSize,
  parseAppBackupPayload,
  shouldApplyPanelLayout,
} from './appBackupFormat';

export { APP_BACKUP_APP_ID, APP_BACKUP_VERSION } from './appBackupFormat';
export const APP_BACKUP_IMPORTED_EVENT = 'json-helper-settings-backup-imported';

export interface PanelLayoutBackupItem {
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface AppBackupPayload {
  app: typeof APP_BACKUP_APP_ID;
  version: typeof APP_BACKUP_VERSION;
  exportedAt: string;
  settings: {
    general: GeneralSettings;
    ai: AIConfig;
    shortcuts: ShortcutConfig;
  };
  jsonPath: {
    history: string[];
    favorites: string[];
  };
  jsonSchema: {
    library: JsonSchemaLibraryItem[];
  };
  structureNav: {
    searchHistory: string[];
  };
  templateFill: {
    template: string;
    lastUpdated: number;
  };
  panelLayout: Record<string, PanelLayoutBackupItem>;
}

export interface BuildAppBackupOptions {
  storage: Storage;
  now?: () => Date;
  generalSettings?: GeneralSettings;
  aiConfig?: AIConfig;
  shortcuts?: ShortcutConfig;
}

export interface ApplyAppBackupResult {
  generalSettings: GeneralSettings;
  aiConfig: AIConfig;
  shortcuts: ShortcutConfig;
  importedCounts: {
    jsonPathHistory: number;
    jsonPathFavorites: number;
    structureSearchHistory: number;
    jsonSchemaLibrary: number;
    panelLayouts: number;
    hasTemplate: boolean;
  };
}

const readJsonStorageValue = <T>(storage: Storage, key: string, fallback: T): T => (
  parseJsonWithFallback(storage.getItem(key), fallback)
);

const readPanelLayout = (storage: Storage): Record<string, PanelLayoutBackupItem> => {
  const layout: Record<string, PanelLayoutBackupItem> = {};

  for (const key of FLOATING_PANEL_STORAGE_KEYS) {
    const position = readJsonStorageValue<unknown>(storage, `${key}-position`, null);
    const size = readJsonStorageValue<unknown>(storage, `${key}-size`, null);
    const item: PanelLayoutBackupItem = {};

    if (isPanelPosition(position)) {
      item.position = position;
    }
    if (isPanelSize(size)) {
      item.size = size;
    }
    if (item.position || item.size) {
      layout[key] = item;
    }
  }

  return layout;
};

export const buildAppBackup = ({
  storage,
  now = () => new Date(),
  generalSettings,
  aiConfig,
  shortcuts,
}: BuildAppBackupOptions): AppBackupPayload => {
  const templateFill = normalizeTemplateFillConfig(
    readJsonStorageValue<unknown>(storage, TEMPLATE_FILL_STORAGE_KEY, {})
  );

  return {
    app: APP_BACKUP_APP_ID,
    version: APP_BACKUP_VERSION,
    exportedAt: now().toISOString(),
    settings: {
      general: normalizeGeneralSettings(generalSettings
        ?? readJsonStorageValue<unknown>(storage, GENERAL_SETTINGS_STORAGE_KEY, {})),
      ai: sanitizeAIConfigForBackup(normalizeAIConfig(aiConfig
        ?? readJsonStorageValue<unknown>(storage, AI_CONFIG_STORAGE_KEY, {}))),
      shortcuts: normalizeShortcutConfig(shortcuts
        ?? readJsonStorageValue<unknown>(storage, SHORTCUTS_STORAGE_KEY, DEFAULT_SHORTCUTS)),
    },
    jsonPath: {
      history: parseStoredJsonPathList(storage.getItem(JSONPATH_HISTORY_STORAGE_KEY)),
      favorites: parseStoredJsonPathList(storage.getItem(JSONPATH_FAVORITES_STORAGE_KEY)),
    },
    jsonSchema: {
      library: parseJsonSchemaLibrary(storage.getItem(JSON_SCHEMA_LIBRARY_STORAGE_KEY)),
    },
    structureNav: {
      searchHistory: parseStoredJsonTreeSearchHistory(storage.getItem(JSON_TREE_SEARCH_HISTORY_STORAGE_KEY)),
    },
    templateFill,
    panelLayout: readPanelLayout(storage),
  };
};

export const serializeAppBackup = (payload: AppBackupPayload): string => {
  return `${JSON.stringify(payload, null, 2)}\n`;
};

const getRecord = (value: unknown): Record<string, unknown> => {
  return isRecord(value) ? value : {};
};

const serializeJsonStorageValue = (value: unknown): string => {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error('配置备份包含无法保存的值');
  }
  return serialized;
};

export const applyAppBackupContent = (
  content: string,
  storage: Storage,
  currentAIConfig: AIConfig
): ApplyAppBackupResult => {
  const { payload, capabilities } = parseAppBackupPayload(content);
  const settings = getRecord(payload.settings);
  const jsonPath = getRecord(payload.jsonPath);
  const jsonSchema = getRecord(payload.jsonSchema);
  const structureNav = getRecord(payload.structureNav);
  const importedAIConfig = normalizeAIConfig(settings.ai);
  const nextAIConfig: AIConfig = {
    ...importedAIConfig,
    // 接口密钥属于敏感信息，导入时保留当前环境的配置。
    apiKey: currentAIConfig.apiKey,
  };
  const nextGeneralSettings = normalizeGeneralSettings(settings.general);
  const nextShortcuts = normalizeShortcutConfig(settings.shortcuts);
  const jsonPathLists = normalizeJsonPathSavedQueryLists(jsonPath);
  const schemaLibrary = capabilities.jsonSchema
    ? parseJsonSchemaLibrary(JSON.stringify(jsonSchema.library))
    : null;
  const structureSearchHistory = capabilities.structureNav
    ? normalizeJsonTreeSearchHistory(structureNav.searchHistory)
    : null;
  const templateFill = normalizeTemplateFillConfig(payload.templateFill);
  const panelLayout = getRecord(payload.panelLayout);
  const storageMutations: AppBackupStorageMutation[] = [
    { key: GENERAL_SETTINGS_STORAGE_KEY, value: serializeJsonStorageValue(nextGeneralSettings) },
    { key: AI_CONFIG_STORAGE_KEY, value: serializeJsonStorageValue(nextAIConfig) },
    { key: SHORTCUTS_STORAGE_KEY, value: serializeJsonStorageValue(nextShortcuts) },
    { key: JSONPATH_HISTORY_STORAGE_KEY, value: serializeJsonStorageValue(jsonPathLists.history) },
    { key: JSONPATH_FAVORITES_STORAGE_KEY, value: serializeJsonStorageValue(jsonPathLists.favorites) },
  ];
  if (schemaLibrary) {
    storageMutations.push({
      key: JSON_SCHEMA_LIBRARY_STORAGE_KEY,
      value: serializeJsonSchemaLibrary(schemaLibrary),
    });
  }
  if (structureSearchHistory) {
    storageMutations.push({
      key: JSON_TREE_SEARCH_HISTORY_STORAGE_KEY,
      value: serializeJsonStorageValue(structureSearchHistory),
    });
  }
  storageMutations.push({
    key: TEMPLATE_FILL_STORAGE_KEY,
    value: serializeJsonStorageValue(templateFill),
  });
  let panelLayouts = 0;

  for (const key of FLOATING_PANEL_STORAGE_KEYS) {
    if (!shouldApplyPanelLayout(key, capabilities, panelLayout)) continue;

    const item = getRecord(panelLayout[key]);
    const position = item.position;
    const size = item.size;
    let hasLayout = false;

    if (isPanelPosition(position)) {
      storageMutations.push({
        key: `${key}-position`,
        value: serializeJsonStorageValue(position),
      });
      hasLayout = true;
    } else {
      storageMutations.push({ key: `${key}-position`, value: null });
    }

    if (isPanelSize(size)) {
      storageMutations.push({
        key: `${key}-size`,
        value: serializeJsonStorageValue(size),
      });
      hasLayout = true;
    } else {
      storageMutations.push({ key: `${key}-size`, value: null });
    }

    if (hasLayout) {
      panelLayouts += 1;
    }
  }

  applyAppBackupStorageMutations(storage, storageMutations);

  return {
    generalSettings: nextGeneralSettings,
    aiConfig: nextAIConfig,
    shortcuts: nextShortcuts,
    importedCounts: {
      jsonPathHistory: jsonPathLists.history.length,
      jsonPathFavorites: jsonPathLists.favorites.length,
      structureSearchHistory: structureSearchHistory?.length ?? 0,
      jsonSchemaLibrary: schemaLibrary?.length ?? 0,
      panelLayouts,
      hasTemplate: Boolean(templateFill.template.trim()),
    },
  };
};

export const notifyAppBackupImported = (target: EventTarget = window) => {
  target.dispatchEvent(new Event(APP_BACKUP_IMPORTED_EVENT));
};
