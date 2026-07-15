import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppSourceApplyEffects } from './useAppSourceApplyEffects';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/smartInputSuggestion', () => ({
  getSmartInputSuggestion: vi.fn(() => ({ id: 'scheme' })),
}));

vi.mock('../utils/toast', () => ({
  showSuccess: vi.fn(),
}));

const createInput = () => ({
  smartSuggestionOriginTextRef: { current: '' },
  onInputChange: vi.fn(),
  onSetMode: vi.fn(),
  onSetHighlightRange: vi.fn(),
  onSetJsonPathPanelOpen: vi.fn(),
  onSetTransformReportOpen: vi.fn(),
  onSetSchemeDecodeOpen: vi.fn(),
  onSetSmartSuggestionOrigin: vi.fn(),
});

describe('useAppSourceApplyEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('从剪贴板应用智能建议文本时记录归一化来源', () => {
    const input = createInput();
    const effects = useAppSourceApplyEffects(input);

    effects.applySourceTextFromClipboard(' \uFEFFsampleapp://v1/open\u200B\n', '已粘贴');

    expect(input.onInputChange).toHaveBeenCalledWith(' \uFEFFsampleapp://v1/open\u200B\n');
    expect(input.smartSuggestionOriginTextRef.current).toBe('sampleapp://v1/open');
    expect(input.onSetSmartSuggestionOrigin).toHaveBeenCalledWith('clipboard');
  });
});
