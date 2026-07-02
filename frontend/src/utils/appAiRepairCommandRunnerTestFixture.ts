import { vi } from 'vitest';
import { AIProvider, type AIConfig } from '../types';
import type { AppAiRepairRuntime, RunAppAiRepairCommandInput } from './appAiRepairCommandRunnerTypes';

export const aiConfig: AIConfig = {
  provider: AIProvider.GEMINI,
  apiKey: 'key',
  model: 'gemini-2.0-flash',
};

export const createAiRepairSummary = () => ({
  changed: true,
  repairMethod: 'local' as const,
  localRuleLabels: ['本地规则'],
  beforeLength: 6, afterLength: 7,
  beforeLines: 1, afterLines: 1,
  addedChars: 1, removedChars: 0, changedChunks: 1,
  rootDescription: '对象 1 个键',
  previewItems: [], isPreviewTruncated: false, isDiffSkipped: false,
});

export const createAiRepairInput = (
  overrides: Partial<RunAppAiRepairCommandInput> = {},
): RunAppAiRepairCommandInput => ({
  sourceText: '{ok:1}',
  aiConfig,
  aiRepairSnapshotRef: { current: null },
  startedAt: 12,
  ...overrides,
});

export const createFailingAiRepairRuntime = (error: unknown): AppAiRepairRuntime => ({
  fixJsonWithRepairDetails: vi.fn(() => Promise.reject(error)),
  buildAiRepairSummary: vi.fn(() => createAiRepairSummary()),
});

export const createAiRepairEffects = (runtime?: AppAiRepairRuntime) => ({
  onLoadRuntime: vi.fn(async () => runtime ?? {
    fixJsonWithRepairDetails: vi.fn(async () => ({
      fixedJson: '{"ok":1}',
      repairMethod: 'local' as const,
      localRuleLabels: ['本地规则'],
    })),
    buildAiRepairSummary: vi.fn(() => createAiRepairSummary()),
  }),
  onSetRepairing: vi.fn(),
  onApplyFixedJson: vi.fn(),
  onSetMode: vi.fn(),
  onOpenAiSettings: vi.fn(),
  onTrackToolEvent: vi.fn(),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
});
