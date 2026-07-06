import { vi } from 'vitest';

const createEffectsBase = () => ({
  currentSourceText: '{"a":1}',
  getCurrentSourceText: vi.fn(function getCurrentSourceText(this: { currentSourceText: string }) {
    return this.currentSourceText;
  }),
  setCurrentSourceText: vi.fn(function setCurrentSourceText(this: { currentSourceText: string }, value: string) {
    this.currentSourceText = value;
  }),
  loadSummaryModule: vi.fn(async () => ({}) as never),
  onSetSourceText: vi.fn(),
  onUpdateActiveFileContent: vi.fn(),
  onSetTemplateApplyQualityDelta: vi.fn(),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
});

export type AppTemplateFillCommandEffectsFixture = ReturnType<typeof createEffectsBase>;

export const createAppTemplateFillCommandEffects = (
  overrides: Partial<AppTemplateFillCommandEffectsFixture> = {}
) => ({
  ...createEffectsBase(),
  ...overrides,
});
