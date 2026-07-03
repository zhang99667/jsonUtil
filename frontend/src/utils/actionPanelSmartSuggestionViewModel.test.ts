import { describe, expect, it } from 'vitest';
import { buildActionPanelSmartSuggestionViewModel } from './actionPanelSmartSuggestionViewModel';
import type { SmartInputSuggestion } from './smartInputSuggestion';

const suggestion: SmartInputSuggestion = {
  id: 'json-with-cmd',
  title: '检测到 JSON 内含 CMD / Scheme',
  description: '建议先做嵌套解析和结构浏览。',
  tone: 'cyan',
  actions: [
    { id: 'deep-format-report', label: '嵌套解析' },
    { id: 'structure-nav', label: '结构导航' },
    { id: 'response-inspection', label: '高级排查' },
    { id: 'schema-panel', label: 'Schema' },
  ],
};

describe('actionPanelSmartSuggestionViewModel', () => {
  it('没有建议或没有动作时返回空模型', () => {
    expect(buildActionPanelSmartSuggestionViewModel(null, null)).toBeNull();
    expect(buildActionPanelSmartSuggestionViewModel({ ...suggestion, actions: [] }, null)).toBeNull();
  });

  it('构建折叠态文案、样式和展开态动作', () => {
    const viewModel = buildActionPanelSmartSuggestionViewModel(suggestion, 'clipboard');

    expect(viewModel).toMatchObject({
      primaryAction: suggestion.actions[0],
      originLabel: '剪贴板识别',
      collapsedAriaLabel: '智能建议：剪贴板识别，检测到 JSON 内含 CMD / Scheme，嵌套解析',
      collapsedTitle: '剪贴板识别：检测到 JSON 内含 CMD / Scheme：嵌套解析',
    });
    expect(viewModel?.toneClassName).toContain('border-cyan-500/30');
    expect(viewModel?.visibleActions.map(action => action.id)).toEqual([
      'deep-format-report',
      'structure-nav',
      'response-inspection',
    ]);
  });

  it('非剪贴板来源不拼接来源文案', () => {
    const viewModel = buildActionPanelSmartSuggestionViewModel(suggestion, null);

    expect(viewModel?.originLabel).toBe('');
    expect(viewModel?.collapsedAriaLabel).toBe('智能建议：检测到 JSON 内含 CMD / Scheme，嵌套解析');
    expect(viewModel?.collapsedTitle).toBe('检测到 JSON 内含 CMD / Scheme：嵌套解析');
  });
});
