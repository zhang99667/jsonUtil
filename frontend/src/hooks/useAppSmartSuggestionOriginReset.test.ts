import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppSmartSuggestionOriginReset } from './useAppSmartSuggestionOriginReset';

const reactMocks = vi.hoisted(() => ({
  useEffect: vi.fn(),
}));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useEffect: reactMocks.useEffect,
}));

const createInput = (
  overrides: Partial<Parameters<typeof useAppSmartSuggestionOriginReset>[0]> = {}
) => ({
  sourceText: 'sampleapp://v1/open',
  hasSmartSuggestion: true,
  smartSuggestionOrigin: 'clipboard' as const,
  smartSuggestionOriginTextRef: { current: 'sampleapp://v1/open' },
  onSetSmartSuggestionOrigin: vi.fn(),
  ...overrides,
});

describe('useAppSmartSuggestionOriginReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useEffect.mockImplementation((effect: () => void) => effect());
  });

  it.each([
    { name: '没有智能建议来源时', overrides: { smartSuggestionOrigin: null } },
    { name: '来源文本仍有智能建议时', overrides: {} },
    { name: '来源文本仅包含不可见字符差异时', overrides: { sourceText: '\uFEFFsampleapp://v1/open\u200B' } },
    { name: '来源文本仅包含首尾空白差异时', overrides: { sourceText: '  sampleapp://v1/open\n' } },
  ])('$name保留来源状态', ({ overrides }) => {
    const input = createInput(overrides);

    useAppSmartSuggestionOriginReset(input);

    expect(input.smartSuggestionOriginTextRef.current).toBe('sampleapp://v1/open');
    expect(input.onSetSmartSuggestionOrigin).not.toHaveBeenCalled();
  });

  it.each([
    { sourceText: 'edited text', hasSmartSuggestion: true },
    { sourceText: 'sampleapp://v1/open', hasSmartSuggestion: false },
  ])('来源失效时清理来源状态: %o', overrides => {
    const input = createInput(overrides);

    useAppSmartSuggestionOriginReset(input);

    expect(input.smartSuggestionOriginTextRef.current).toBe('');
    expect(input.onSetSmartSuggestionOrigin).toHaveBeenCalledWith(null);
  });
});
