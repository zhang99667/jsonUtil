import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppTemplateFillQualitySummaryModule } from './appTemplateFillQualityDelta';
import { loadAppTemplateFillQualitySummaryModule } from './appTemplateFillQualitySummary';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';

vi.mock('./chunkLoadRecoveryDispatch', () => ({
  dispatchChunkLoadRecoveryEvent: vi.fn(() => false),
}));

const createSummaryModule = () => ({}) as AppTemplateFillQualitySummaryModule;

describe('appTemplateFillQualitySummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(false);
  });

  it('普通模板不加载质量摘要模块', async () => {
    const loadSummaryModule = vi.fn(async () => createSummaryModule());

    const result = await loadAppTemplateFillQualitySummaryModule({
      shouldLoadSummary: false,
      loadSummaryModule,
    });

    expect(result).toEqual({ summaryModule: null, isChunkRecoveryHandled: false });
    expect(loadSummaryModule).not.toHaveBeenCalled();
    expect(dispatchChunkLoadRecoveryEvent).not.toHaveBeenCalled();
  });

  it('占位符模板加载质量摘要模块', async () => {
    const summaryModule = createSummaryModule();
    const loadSummaryModule = vi.fn(async () => summaryModule);

    const result = await loadAppTemplateFillQualitySummaryModule({
      shouldLoadSummary: true,
      loadSummaryModule,
    });

    expect(result).toEqual({ summaryModule, isChunkRecoveryHandled: false });
  });

  it('加载失败时返回统一恢复处理结果', async () => {
    const error = new TypeError('Failed to fetch dynamically imported module');
    const loadSummaryModule = vi.fn(async () => {
      throw error;
    });
    vi.mocked(dispatchChunkLoadRecoveryEvent).mockReturnValue(true);

    const result = await loadAppTemplateFillQualitySummaryModule({
      shouldLoadSummary: true,
      loadSummaryModule,
    });

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(result).toEqual({ summaryModule: null, isChunkRecoveryHandled: true });
  });

  it('非 chunk 加载失败时允许模板回填降级继续', async () => {
    const error = new Error('summary failed');
    const loadSummaryModule = vi.fn(async () => {
      throw error;
    });

    const result = await loadAppTemplateFillQualitySummaryModule({
      shouldLoadSummary: true,
      loadSummaryModule,
    });

    expect(dispatchChunkLoadRecoveryEvent).toHaveBeenCalledWith(error);
    expect(result).toEqual({ summaryModule: null, isChunkRecoveryHandled: false });
  });
});
