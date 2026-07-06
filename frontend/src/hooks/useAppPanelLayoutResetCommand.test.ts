import { describe, expect, it, vi } from 'vitest';
import { runAppPanelLayoutResetCommand } from '../utils/appPanelLayoutResetCommandRunner';
import { useAppPanelLayoutResetCommand } from './useAppPanelLayoutResetCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));
const runnerMocks = vi.hoisted(() => ({ runAppPanelLayoutResetCommand: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/appPanelLayoutResetCommandRunner', async importOriginal => ({
  ...await importOriginal<typeof import('../utils/appPanelLayoutResetCommandRunner')>(),
  runAppPanelLayoutResetCommand: runnerMocks.runAppPanelLayoutResetCommand,
}));

reactMocks.useCallback.mockImplementation((callback: unknown) => callback);

describe('useAppPanelLayoutResetCommand', () => {
  it('把重置动作交给 runner', () => {
    const { handleResetPanelLayout } = useAppPanelLayoutResetCommand();

    handleResetPanelLayout();

    expect(runAppPanelLayoutResetCommand).toHaveBeenCalledTimes(1);
  });
});
