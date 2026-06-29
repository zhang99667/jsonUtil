import type { SmartSuggestionActionId } from './smartInputSuggestion';

export type AppSmartSuggestionEffect =
  | 'clear-highlight'
  | 'close-transform-report'
  | 'open-scheme-panel'
  | 'open-json-tree-panel'
  | 'open-json-schema-panel';

export interface AppSmartSuggestionStaticResult {
  effects: AppSmartSuggestionEffect[];
  successMessage: string;
}

const STATIC_ACTION_RESULTS: Partial<Record<SmartSuggestionActionId, AppSmartSuggestionStaticResult>> = {
  'response-inspection': {
    effects: ['clear-highlight', 'close-transform-report'],
    successMessage: '已切换到嵌套解析，可手动查看报告',
  },
  'deep-format-report': {
    effects: ['close-transform-report'],
    successMessage: '已切换到嵌套解析，可手动查看报告',
  },
  'structure-nav': {
    effects: ['open-json-tree-panel'],
    successMessage: '已打开结构导航',
  },
  'schema-panel': {
    effects: ['open-json-schema-panel'],
    successMessage: '已打开 Schema 校验',
  },
  'json-to-typescript': {
    effects: [],
    successMessage: '已切换到 JSON 转 TS',
  },
  'url-decode': {
    effects: [],
    successMessage: '已切换到 URL 解码',
  },
};

export const getAppSmartSuggestionStaticResult = (
  actionId: SmartSuggestionActionId
): AppSmartSuggestionStaticResult | null => (
  STATIC_ACTION_RESULTS[actionId] ?? null
);
