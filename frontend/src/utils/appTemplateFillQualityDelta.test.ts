import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deepParseWithContext } from './transformations';
import {
  buildAppTemplateFillQualityDelta,
  tryBuildAppTemplateFillQualityDelta,
  type AppTemplateFillQualitySummaryModule,
} from './appTemplateFillQualityDelta';

vi.mock('./transformations', async importOriginal => ({
  ...await importOriginal<typeof import('./transformations')>(),
  deepParseWithContext: vi.fn((source: string) => ({
    context: { source },
  })),
}));

const createSummaryModule = (): AppTemplateFillQualitySummaryModule => ({
  buildTransformContextReport: vi.fn((context: unknown) => ({ context })),
  buildTransformReportView: vi.fn((report: unknown, query: string) => ({ report, query })),
  buildTransformQualitySnapshot: vi.fn((report: unknown, view: unknown, query: string) => ({
    report,
    view,
    query,
  })),
  formatTransformQualitySnapshotDeltaText: vi.fn(() => '质量变化: +1'),
}) as unknown as AppTemplateFillQualitySummaryModule;

describe('appTemplateFillQualityDelta', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('为占位符回填前后 SOURCE 构建质量 delta', () => {
    const summaryModule = createSummaryModule();

    const deltaText = buildAppTemplateFillQualityDelta({
      sourceBeforeApply: '{"before":true}',
      sourceAfterApply: '{"after":true}',
      autoExpandScheme: true,
      summaryModule,
    });

    expect(deltaText).toBe('质量变化: +1');
    expect(deepParseWithContext).toHaveBeenNthCalledWith(1, '{"before":true}', { autoExpandScheme: true });
    expect(deepParseWithContext).toHaveBeenNthCalledWith(2, '{"after":true}', { autoExpandScheme: true });
    expect(summaryModule.buildTransformContextReport).toHaveBeenCalledTimes(2);
    expect(summaryModule.buildTransformReportView).toHaveBeenCalledTimes(2);
    expect(summaryModule.buildTransformQualitySnapshot).toHaveBeenCalledTimes(2);
    expect(summaryModule.formatTransformQualitySnapshotDeltaText).toHaveBeenCalledTimes(1);
  });

  it('质量 delta 构建异常时返回空文本', () => {
    const summaryModule = createSummaryModule();
    vi.mocked(deepParseWithContext).mockImplementationOnce(() => {
      throw new Error('parse failed');
    });

    expect(tryBuildAppTemplateFillQualityDelta({
      sourceBeforeApply: '{"before":true}',
      sourceAfterApply: '{"after":true}',
      autoExpandScheme: true,
      summaryModule,
    })).toBe('');
  });
});
