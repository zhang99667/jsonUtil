import type { AppTemplateFillQualitySummaryModule } from './appTemplateFillQualityDelta';
import { dispatchChunkLoadRecoveryEvent } from './chunkLoadRecoveryDispatch';

interface AppTemplateFillQualitySummaryLoadInput {
  shouldLoadSummary: boolean;
  loadSummaryModule: () => Promise<AppTemplateFillQualitySummaryModule>;
}

interface AppTemplateFillQualitySummaryLoadResult {
  summaryModule: AppTemplateFillQualitySummaryModule | null;
  isChunkRecoveryHandled: boolean;
}

export const loadAppTemplateFillQualitySummaryModule = async ({
  shouldLoadSummary,
  loadSummaryModule,
}: AppTemplateFillQualitySummaryLoadInput): Promise<AppTemplateFillQualitySummaryLoadResult> => {
  if (!shouldLoadSummary) {
    return { summaryModule: null, isChunkRecoveryHandled: false };
  }

  try {
    return {
      summaryModule: await loadSummaryModule(),
      isChunkRecoveryHandled: false,
    };
  } catch (error) {
    return {
      summaryModule: null,
      isChunkRecoveryHandled: dispatchChunkLoadRecoveryEvent(error),
    };
  }
};
