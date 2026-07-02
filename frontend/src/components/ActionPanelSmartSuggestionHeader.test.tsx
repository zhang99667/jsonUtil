import { describe, expect, it } from 'vitest';
import type { SmartInputSuggestion } from '../utils/smartInputSuggestion';
import { ActionPanelSmartSuggestionHeader } from './ActionPanelSmartSuggestionHeader';
import {
  collectText,
  findByTour,
  findByTypeOrNull,
} from './schemeViewerElementTestHelpers';
import { ActionPanelSmartSuggestionIcon } from './ActionPanelSmartSuggestionIcon';

const suggestion: SmartInputSuggestion = {
  id: 'json-with-cmd',
  title: '检测到 JSON 内含 CMD / Scheme',
  description: '建议先做嵌套解析和结构浏览。',
  tone: 'cyan',
  actions: [{ id: 'deep-format-report', label: '嵌套解析' }],
};

describe('ActionPanelSmartSuggestionHeader', () => {
  it('渲染标题、描述和来源徽标', () => {
    const tree = ActionPanelSmartSuggestionHeader({
      smartSuggestion: suggestion,
      originLabel: '剪贴板识别',
    });

    expect(collectText(tree)).toContain('检测到 JSON 内含 CMD / Scheme');
    expect(collectText(tree)).toContain('建议先做嵌套解析和结构浏览。');
    expect(findByTour(tree, 'smart-action-origin')[0]?.props.title).toBe('来自本次手动粘贴后的剪贴板内容识别');
    expect(findByTypeOrNull(tree, ActionPanelSmartSuggestionIcon)?.props.className).toContain('h-4');
  });

  it('没有来源时不渲染来源徽标', () => {
    const tree = ActionPanelSmartSuggestionHeader({
      smartSuggestion: suggestion,
      originLabel: '',
    });

    expect(findByTour(tree, 'smart-action-origin')).toHaveLength(0);
  });
});
