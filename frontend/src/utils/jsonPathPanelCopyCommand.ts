import { getClipboardErrorMessage } from './clipboard';
import type { JsonPathQueryItem } from './jsonPathQuery';
import {
  formatJsonPathItemsForCopy,
  formatJsonPathValuesForCopy,
  getJsonPathCopyCountLabel,
} from './jsonPathPanelCopy';

interface JsonPathPanelCopyCommandEffects {
  copyText: (text: string) => Promise<void>;
  onShowSuccess: (message: string) => void;
  onShowError: (message: string) => void;
  onLogWarning?: (message: string, error: unknown) => void;
}

interface JsonPathPanelCopyValuesInput {
  values: unknown[];
  isResultLimited: boolean;
}

interface JsonPathPanelCopyPathValuesInput {
  items: JsonPathQueryItem[];
  isResultLimited: boolean;
}

const logJsonPathCopyWarning = (
  effects: JsonPathPanelCopyCommandEffects,
  message: string,
  error: unknown
) => {
  effects.onLogWarning?.(message, error);
};

export const runJsonPathValueCopyCommand = async (
  { values, isResultLimited }: JsonPathPanelCopyValuesInput,
  effects: JsonPathPanelCopyCommandEffects
) => {
  if (values.length === 0) return false;

  try {
    await effects.copyText(formatJsonPathValuesForCopy(values));
    effects.onShowSuccess(`查询结果已复制（${getJsonPathCopyCountLabel(values.length, isResultLimited)}）`);
    return true;
  } catch (error) {
    logJsonPathCopyWarning(effects, '复制 JSONPath 查询结果失败:', error);
    effects.onShowError(getClipboardErrorMessage(error, '复制查询结果失败'));
    return false;
  }
};

export const runJsonPathPathValueCopyCommand = async (
  { items, isResultLimited }: JsonPathPanelCopyPathValuesInput,
  effects: JsonPathPanelCopyCommandEffects
) => {
  if (items.length === 0) return false;

  try {
    await effects.copyText(formatJsonPathItemsForCopy(items));
    effects.onShowSuccess(`查询路径和值已复制（${getJsonPathCopyCountLabel(items.length, isResultLimited)}）`);
    return true;
  } catch (error) {
    logJsonPathCopyWarning(effects, '复制 JSONPath 查询路径和值失败:', error);
    effects.onShowError(getClipboardErrorMessage(error, '复制查询路径和值失败'));
    return false;
  }
};
