import { describe, expect, it, vi } from 'vitest';
import { buildAppSmartSuggestionCommandEffects } from './appSmartSuggestionCommandEffects';
import { TransformMode } from '../types';

const createInput = () => ({
  schemeInputRequestIdRef: { current: 41 },
  onRunAiFix: vi.fn(),
  onSetMode: vi.fn(),
  onSetHighlightRange: vi.fn(),
  onSetSchemeInputRequest: vi.fn(),
  onSetSchemePanelOpen: vi.fn(),
  onSetTransformReportOpen: vi.fn(),
  onSetJsonTreePanelOpen: vi.fn(),
  onSetJsonSchemaPanelOpen: vi.fn(),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

describe('appSmartSuggestionCommandEffects', () => {
  it('构建 effects 时不立即触发任何副作用', () => {
    const input = createInput();

    buildAppSmartSuggestionCommandEffects(input);

    expect(input.onRunAiFix).not.toHaveBeenCalled();
    expect(input.onSetHighlightRange).not.toHaveBeenCalled();
    expect(input.onSetSchemeInputRequest).not.toHaveBeenCalled();
    expect(input.onSetSchemePanelOpen).not.toHaveBeenCalled();
    expect(input.onShowError).not.toHaveBeenCalled();
    expect(input.onShowSuccess).not.toHaveBeenCalled();
    expect(input.onTrackToolEvent).not.toHaveBeenCalled();
  });

  it('装配智能建议 runner 副作用并保留 Scheme request 递增语义', () => {
    const input = createInput();
    const effects = buildAppSmartSuggestionCommandEffects(input);

    effects.onRunAiFix();
    effects.onSetMode(TransformMode.DEEP_FORMAT);
    effects.onClearHighlight();
    effects.onOpenSchemeInput('baiduboxapp://v1/open');
    effects.onSetSchemePanelOpen(true);
    effects.onSetTransformReportOpen(false);
    effects.onSetJsonTreePanelOpen(true);
    effects.onSetJsonSchemaPanelOpen(true);
    effects.onShowError('不可用');
    effects.onShowSuccess('已打开');
    effects.onTrackToolEvent('SMART_SUGGESTION_STRUCTURE_NAV', 'smart_suggestion', 'success', 123);

    expect(input.onRunAiFix).toHaveBeenCalledTimes(1);
    expect(input.onSetMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(input.onSetHighlightRange).toHaveBeenCalledWith(null);
    expect(input.onSetSchemeInputRequest).toHaveBeenCalledWith({
      id: 42,
      value: 'baiduboxapp://v1/open',
    });
    expect(input.schemeInputRequestIdRef.current).toBe(42);
    effects.onOpenSchemeInput('baiduboxapp://v2/open');
    expect(input.onSetSchemeInputRequest).toHaveBeenLastCalledWith({
      id: 43,
      value: 'baiduboxapp://v2/open',
    });
    expect(input.schemeInputRequestIdRef.current).toBe(43);
    expect(input.onSetSchemePanelOpen).toHaveBeenCalledWith(true);
    expect(input.onSetTransformReportOpen).toHaveBeenCalledWith(false);
    expect(input.onSetJsonTreePanelOpen).toHaveBeenCalledWith(true);
    expect(input.onSetJsonSchemaPanelOpen).toHaveBeenCalledWith(true);
    expect(input.onShowError).toHaveBeenCalledWith('不可用');
    expect(input.onShowSuccess).toHaveBeenCalledWith('已打开');
    expect(input.onTrackToolEvent).toHaveBeenCalledWith(
      'SMART_SUGGESTION_STRUCTURE_NAV',
      'smart_suggestion',
      'success',
      123,
    );
  });
});
