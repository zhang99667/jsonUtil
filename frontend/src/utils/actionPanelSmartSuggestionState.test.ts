import { describe, expect, it } from 'vitest';
import {
  getActionPanelSmartSuggestionOriginLabel,
  getActionPanelSmartSuggestionToneClassName,
  getVisibleActionPanelSmartSuggestionActions,
} from './actionPanelSmartSuggestionState';
import type { SmartInputSuggestion } from './smartInputSuggestion';

const suggestion: SmartInputSuggestion = {
  id: 'sample',
  title: '建议标题',
  description: '建议描述',
  tone: 'cyan',
  actions: [
    { id: 'deep-format-report', label: '嵌套解析' },
    { id: 'structure-nav', label: '结构导航' },
    { id: 'schema-panel', label: 'Schema' },
    { id: 'ai-fix', label: 'AI 修复' },
  ],
};

describe('actionPanelSmartSuggestionState', () => {
  it('按 tone 生成智能建议样式', () => {
    expect(getActionPanelSmartSuggestionToneClassName('emerald')).toContain('border-emerald-500/30');
    expect(getActionPanelSmartSuggestionToneClassName('amber')).toContain('bg-amber-500/10');
    expect(getActionPanelSmartSuggestionToneClassName('violet')).toContain('text-violet-100');
    expect(getActionPanelSmartSuggestionToneClassName('rose')).toContain('border-rose-500/30');
    expect(getActionPanelSmartSuggestionToneClassName('cyan')).toContain('border-cyan-500/30');
    expect(getActionPanelSmartSuggestionToneClassName(null)).toContain('border-cyan-500/30');
  });

  it('只在剪贴板来源时展示来源标签', () => {
    expect(getActionPanelSmartSuggestionOriginLabel('clipboard')).toBe('剪贴板识别');
    expect(getActionPanelSmartSuggestionOriginLabel(null)).toBe('');
    expect(getActionPanelSmartSuggestionOriginLabel(undefined)).toBe('');
  });

  it('展开态最多展示前三个建议动作', () => {
    expect(getVisibleActionPanelSmartSuggestionActions(suggestion).map(action => action.id)).toEqual([
      'deep-format-report',
      'structure-nav',
      'schema-panel',
    ]);
  });
});
