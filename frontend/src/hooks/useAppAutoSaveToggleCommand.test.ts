import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showError, showSuccess } from '../utils/toast';
import { useAppAutoSaveToggleCommand } from './useAppAutoSaveToggleCommand';

const reactMocks = vi.hoisted(() => ({ useCallback: vi.fn() }));

vi.mock('react', async importOriginal => ({
  ...await importOriginal<typeof import('react')>(),
  useCallback: reactMocks.useCallback,
}));

vi.mock('../utils/toast', () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

describe('useAppAutoSaveToggleCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reactMocks.useCallback.mockImplementation((callback: unknown) => callback);
  });

  it('没有活动文件时提示错误且不更新状态', () => {
    const onSetAutoSaveEnabled = vi.fn();
    const { handleToggleAutoSave } = useAppAutoSaveToggleCommand({
      hasActiveFile: false,
      activeFileHasHandle: false,
      isAutoSaveEnabled: false,
      onSetAutoSaveEnabled,
    });

    handleToggleAutoSave();

    expect(showError).toHaveBeenCalledWith('请先打开或保存文件后再启用自动保存');
    expect(onSetAutoSaveEnabled).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it('活动文件没有句柄时提示错误且不更新状态', () => {
    const onSetAutoSaveEnabled = vi.fn();
    const { handleToggleAutoSave } = useAppAutoSaveToggleCommand({
      hasActiveFile: true,
      activeFileHasHandle: false,
      isAutoSaveEnabled: false,
      onSetAutoSaveEnabled,
    });

    handleToggleAutoSave();

    expect(showError).toHaveBeenCalledWith('请先保存当前标签后再启用自动保存');
    expect(onSetAutoSaveEnabled).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it('可用时切换自动保存状态并提示成功', () => {
    const onSetAutoSaveEnabled = vi.fn();
    const { handleToggleAutoSave } = useAppAutoSaveToggleCommand({
      hasActiveFile: true,
      activeFileHasHandle: true,
      isAutoSaveEnabled: false,
      onSetAutoSaveEnabled,
    });

    handleToggleAutoSave();

    expect(onSetAutoSaveEnabled).toHaveBeenCalledWith(true);
    expect(showSuccess).toHaveBeenCalledWith('自动保存已开启');
    expect(showError).not.toHaveBeenCalled();
  });
});
