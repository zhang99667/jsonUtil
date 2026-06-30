import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { useAppSmartSuggestionCommands } from './useAppSmartSuggestionCommands';

const mocks = vi.hoisted(() => ({
  runAppSmartSuggestionCommand: vi.fn(),
  showError: vi.fn(),
  showSuccess: vi.fn(),
  useCallback: vi.fn(),
  useMemo: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: mocks.useCallback,
  useMemo: mocks.useMemo,
}));

vi.mock('../utils/appSmartSuggestionCommandRunner', () => ({
  runAppSmartSuggestionCommand: mocks.runAppSmartSuggestionCommand,
}));

vi.mock('../utils/toast', () => ({
  showError: mocks.showError,
  showSuccess: mocks.showSuccess,
}));

const createCallbacks = () => ({
  onRunAiFix: vi.fn(),
  onSetMode: vi.fn(),
  onSetHighlightRange: vi.fn(),
  onOpenSchemeInput: vi.fn(),
  onSetSchemePanelOpen: vi.fn(),
  onSetTransformReportOpen: vi.fn(),
  onSetJsonTreePanelOpen: vi.fn(),
  onSetJsonSchemaPanelOpen: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

describe('useAppSmartSuggestionCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useMemo.mockImplementation((factory: () => unknown) => factory());
    mocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('把智能建议动作输入和调用方 effects 交给 runner', () => {
    const callbacks = createCallbacks();
    const { handleSmartSuggestionAction } = useAppSmartSuggestionCommands({
      currentMode: TransformMode.NONE,
      sourceText: '  baiduboxapp://v1/open  ',
      ...callbacks,
    });

    handleSmartSuggestionAction('scheme-panel');

    expect(mocks.runAppSmartSuggestionCommand).toHaveBeenCalledTimes(1);
    expect(mocks.runAppSmartSuggestionCommand.mock.calls[0][0]).toEqual({
      actionId: 'scheme-panel',
      currentMode: TransformMode.NONE,
      sourceText: '  baiduboxapp://v1/open  ',
    });

    const effects = mocks.runAppSmartSuggestionCommand.mock.calls[0][1];
    effects.onClearHighlight();
    effects.onOpenSchemeInput('baiduboxapp://v1/open');
    effects.onSetSchemePanelOpen(true);
    effects.onSetTransformReportOpen(false);
    effects.onSetJsonTreePanelOpen(true);
    effects.onSetJsonSchemaPanelOpen(true);
    effects.onShowError('不可用');
    effects.onShowSuccess('已打开');
    effects.onTrackToolEvent('SMART_SUGGESTION_SCHEME_PANEL', 'smart_suggestion', 'success', 123);

    expect(callbacks.onSetHighlightRange).toHaveBeenCalledWith(null);
    expect(callbacks.onOpenSchemeInput).toHaveBeenCalledWith('baiduboxapp://v1/open');
    expect(callbacks.onSetSchemePanelOpen).toHaveBeenCalledWith(true);
    expect(callbacks.onSetTransformReportOpen).toHaveBeenCalledWith(false);
    expect(callbacks.onSetJsonTreePanelOpen).toHaveBeenCalledWith(true);
    expect(callbacks.onSetJsonSchemaPanelOpen).toHaveBeenCalledWith(true);
    expect(mocks.showError).toHaveBeenCalledWith('不可用');
    expect(mocks.showSuccess).toHaveBeenCalledWith('已打开');
    expect(callbacks.onTrackToolEvent).toHaveBeenCalledWith(
      'SMART_SUGGESTION_SCHEME_PANEL',
      'smart_suggestion',
      'success',
      123,
    );
  });
});
