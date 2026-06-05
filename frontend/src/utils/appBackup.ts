import type { AIConfig, GeneralSettings, ShortcutConfig } from '../types';
import {
  AI_CONFIG_STORAGE_KEY,
  GENERAL_SETTINGS_STORAGE_KEY,
  TEMPLATE_FILL_STORAGE_KEY,
  loadAIConfig,
  loadGeneralSettings,
  loadTemplateFillConfig,
  normalizeAIConfig,
  normalizeGeneralSettings,
  normalizeTemplateFillConfig,
  sanitizeAIConfigForBackup,
} from './appSettings';
import {
  JSONPATH_FAVORITES_STORAGE_KEY,
  JSONPATH_HISTORY_STORAGE_KEY,
  normalizeJsonPathList,
  parseStoredJsonPathList,
} from './jsonPathLists';
import { FLOATING_PANEL_STORAGE_KEYS } from './panelLayout';
import { DEFAULT_SHORTCUTS, SHORTCUTS_STORAGE_KEY, normalizeShortcutConfig } from './shortcuts';
import { isFiniteNumber, isRecord, parseJsonWithFallback } from './storage';

export const APP_BACKUP_APP_ID = 'jsonutils-pro';
export const APP_BACKUP_VERSION = 1;
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
  templateFill: {
    template: string;
    lastUpdated: number;
  };
  panelLayout: Record<string, PanelLayoutBackupItem>;
}

export interface BuildAppBackupOptions {
  storage?: Storage;
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
    panelLayouts: number;
    hasTemplate: boolean;
  };
}

const isPanelPosition = (value: unknown): value is { x: number; y: number } => {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
};

const isPanelSize = (value: unknown): value is { width: number; height: number } => {
  return isRecord(value) && isFiniteNumber(value.width) && isFiniteNumber(value.height);
};

const readPanelLayout = (storage: Storage): Record<string, PanelLayoutBackupItem> => {
  const layout: Record<string, PanelLayoutBackupItem> = {};

  for (const key of FLOATING_PANEL_STORAGE_KEYS) {
    const position = parseJsonWithFallback<unknown>(
      storage.getItem(`${key}-position`),
      null
    );
    const size = parseJsonWithFallback<unknown>(
      storage.getItem(`${key}-size`),
      null
    );
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
  storage = localStorage,
  now = () => new Date(),
  generalSettings,
  aiConfig,
  shortcuts,
}: BuildAppBackupOptions = {}): AppBackupPayload => {
  const templateFill = loadTemplateFillConfig(storage);

  return {
    app: APP_BACKUP_APP_ID,
    version: APP_BACKUP_VERSION,
    exportedAt: now().toISOString(),
    settings: {
      general: normalizeGeneralSettings(generalSettings ?? loadGeneralSettings(storage)),
      ai: sanitizeAIConfigForBackup(aiConfig ?? loadAIConfig(storage)),
      shortcuts: normalizeShortcutConfig(shortcuts ?? parseJsonWithFallback<unknown>(
        storage.getItem(SHORTCUTS_STORAGE_KEY),
        DEFAULT_SHORTCUTS
      )),
    },
    jsonPath: {
      history: parseStoredJsonPathList(storage.getItem(JSONPATH_HISTORY_STORAGE_KEY)),
      favorites: parseStoredJsonPathList(storage.getItem(JSONPATH_FAVORITES_STORAGE_KEY)),
    },
    templateFill,
    panelLayout: readPanelLayout(storage),
  };
};

export const serializeAppBackup = (payload: AppBackupPayload): string => {
  return `${JSON.stringify(payload, null, 2)}\n`;
};

const parseAppBackupPayload = (content: string): Record<string, unknown> => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('备份文件不是合法 JSON');
  }

  if (!isRecord(parsed) || parsed.app !== APP_BACKUP_APP_ID || parsed.version !== APP_BACKUP_VERSION) {
    throw new Error('备份文件不是 JSONUtils 配置备份');
  }

  return parsed;
};

const getRecord = (value: unknown): Record<string, unknown> => {
  return isRecord(value) ? value : {};
};

const writeJson = (storage: Storage, key: string, value: unknown) => {
  storage.setItem(key, JSON.stringify(value));
};

export const applyAppBackupContent = (
  content: string,
  storage: Storage = localStorage,
  currentAIConfig: AIConfig = loadAIConfig(storage)
): ApplyAppBackupResult => {
  const payload = parseAppBackupPayload(content);
  const settings = getRecord(payload.settings);
  const jsonPath = getRecord(payload.jsonPath);
  const importedAIConfig = normalizeAIConfig(settings.ai);
  const nextAIConfig: AIConfig = {
    ...importedAIConfig,
    // API Key 属于敏感信息，导入时保留当前环境的配置。
    apiKey: currentAIConfig.apiKey,
  };
  const nextGeneralSettings = normalizeGeneralSettings(settings.general);
  const nextShortcuts = normalizeShortcutConfig(settings.shortcuts);
  const history = normalizeJsonPathList(jsonPath.history);
  const favorites = normalizeJsonPathList(jsonPath.favorites);
  const templateFill = normalizeTemplateFillConfig(payload.templateFill);
  const panelLayout = getRecord(payload.panelLayout);
  let panelLayouts = 0;

  writeJson(storage, GENERAL_SETTINGS_STORAGE_KEY, nextGeneralSettings);
  writeJson(storage, AI_CONFIG_STORAGE_KEY, nextAIConfig);
  writeJson(storage, SHORTCUTS_STORAGE_KEY, nextShortcuts);
  writeJson(storage, JSONPATH_HISTORY_STORAGE_KEY, history);
  writeJson(storage, JSONPATH_FAVORITES_STORAGE_KEY, favorites);
  writeJson(storage, TEMPLATE_FILL_STORAGE_KEY, templateFill);

  for (const key of FLOATING_PANEL_STORAGE_KEYS) {
    const item = getRecord(panelLayout[key]);
    const position = item.position;
    const size = item.size;
    let hasLayout = false;

    if (isPanelPosition(position)) {
      writeJson(storage, `${key}-position`, position);
      hasLayout = true;
    } else {
      storage.removeItem(`${key}-position`);
    }

    if (isPanelSize(size)) {
      writeJson(storage, `${key}-size`, size);
      hasLayout = true;
    } else {
      storage.removeItem(`${key}-size`);
    }

    if (hasLayout) {
      panelLayouts += 1;
    }
  }

  return {
    generalSettings: nextGeneralSettings,
    aiConfig: nextAIConfig,
    shortcuts: nextShortcuts,
    importedCounts: {
      jsonPathHistory: history.length,
      jsonPathFavorites: favorites.length,
      panelLayouts,
      hasTemplate: Boolean(templateFill.template.trim()),
    },
  };
};

export const notifyAppBackupImported = (target: EventTarget = window) => {
  target.dispatchEvent(new Event(APP_BACKUP_IMPORTED_EVENT));
};
