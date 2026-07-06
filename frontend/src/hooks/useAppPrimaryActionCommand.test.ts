import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '../types';
import { runAppPrimaryActionCommand } from '../utils/appPrimaryActionCommandRunner';
import { useAppPrimaryActionCommand } from './useAppPrimaryActionCommand';

const reactMocks = vi.hoisted(() => ({
  useCallback: vi.fn((callback: unknown) => callback),
  useMemo: vi.fn((factory: () => unknown) => factory()),
}));
const runnerMocks = vi.hoisted(() => ({ runAppPrimaryActionCommand: vi.fn(() => Promise.resolve()) }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
  useMemo: reactMocks.useMemo,
}));

vi.mock('../utils/appPrimaryActionCommandRunner', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPrimaryActionCommandRunner')>(),
  runAppPrimaryActionCommand: runnerMocks.runAppPrimaryActionCommand,
}));

const createCallbacks = () => ({
  onAiRepair: vi.fn(() => Promise.resolve()),
  onToolbarSave: vi.fn(() => Promise.resolve()),
  onOpenFile: vi.fn(() => Promise.resolve()),
  onCreateNewTab: vi.fn(),
  onTrackToolEvent: vi.fn(),
});

describe('useAppPrimaryActionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('把动作和当前 effects 交给 runner', async () => {
    const callbacks = createCallbacks();
    const now = vi.fn(() => 100);
    const { handleAction } = useAppPrimaryActionCommand({ ...callbacks, now });

    await handleAction(ActionType.SAVE);

    expect(runAppPrimaryActionCommand).toHaveBeenCalledWith(ActionType.SAVE, {
      now,
      onAiRepair: callbacks.onAiRepair,
      onCreateNewTab: callbacks.onCreateNewTab,
      onOpenFile: callbacks.onOpenFile,
      onToolbarSave: callbacks.onToolbarSave,
      onTrackToolEvent: callbacks.onTrackToolEvent,
    });
  });
});
