import { describe, expect, it, vi } from 'vitest';
import type { AppSmartSuggestionActionPlan } from './appSmartSuggestionActions';
import { runAppSmartSuggestionPlanEffects } from './appSmartSuggestionPlanEffects';

const createEffects = (calls: string[] = []) => ({
  onClearHighlight: vi.fn(() => calls.push('clear-highlight')),
  onOpenSchemeInput: vi.fn((value: string) => calls.push(`scheme-input:${value}`)),
  onSetSchemePanelOpen: vi.fn(() => calls.push('open-scheme-panel')),
  onSetTransformReportOpen: vi.fn(() => calls.push('close-transform-report')),
  onSetJsonTreePanelOpen: vi.fn(() => calls.push('open-json-tree-panel')),
  onSetJsonSchemaPanelOpen: vi.fn(() => calls.push('open-json-schema-panel')),
});

const createPlan = (
  overrides: Partial<AppSmartSuggestionActionPlan> = {}
): AppSmartSuggestionActionPlan => ({
  eventName: 'SMART_SUGGESTION_TEST',
  status: 'success',
  nextMode: null,
  effects: [],
  ...overrides,
});

describe('appSmartSuggestionPlanEffects', () => {
  it('按固定顺序执行智能建议计划副作用', () => {
    const calls: string[] = [];
    const effects = createEffects(calls);

    runAppSmartSuggestionPlanEffects(createPlan({
      effects: ['close-transform-report', 'open-scheme-panel', 'clear-highlight'],
      schemeInputValue: 'baiduboxapp://v1/open',
    }), effects);

    expect(calls).toEqual([
      'clear-highlight',
      'scheme-input:baiduboxapp://v1/open',
      'open-scheme-panel',
      'close-transform-report',
    ]);
  });

  it('Scheme 输入为空时仍打开面板但不写入输入框', () => {
    const effects = createEffects();

    runAppSmartSuggestionPlanEffects(createPlan({
      effects: ['open-scheme-panel'],
    }), effects);

    expect(effects.onOpenSchemeInput).not.toHaveBeenCalled();
    expect(effects.onSetSchemePanelOpen).toHaveBeenCalledWith(true);
  });

  it('打开结构和 Schema 面板时透传 true 状态', () => {
    const effects = createEffects();

    runAppSmartSuggestionPlanEffects(createPlan({
      effects: ['open-json-tree-panel', 'open-json-schema-panel'],
    }), effects);

    expect(effects.onSetJsonTreePanelOpen).toHaveBeenCalledWith(true);
    expect(effects.onSetJsonSchemaPanelOpen).toHaveBeenCalledWith(true);
  });
});
