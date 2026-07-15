import { describe, expect, it, vi } from 'vitest';
import { AIProvider, type AIConfig } from '../types';
import { runAppImportSettingsBackupCommand } from './appSettingsBackupImportCommand';
import { MemoryStorage } from './memoryStorageTestHelper';

const aiConfig: AIConfig = {
  provider: AIProvider.GEMINI,
  apiKey: 'current-key',
  model: 'gemini-2.0-flash',
};

describe('appSettingsBackupImportCommand error', () => {
  it('导入失败原因为空白时使用中文兜底文案', async () => {
    const onShowError = vi.fn();

    await runAppImportSettingsBackupCommand({ text: async () => '{}' }, aiConfig, {
      onLoadBackupModule: async () => {
        throw new Error('   ');
      },
      onReadFileText: backupFile => backupFile.text(),
      onSetGeneralSettings: vi.fn(),
      onSetAIConfig: vi.fn(),
      onReplaceShortcuts: vi.fn(),
      onShowSuccess: vi.fn(),
      onShowError,
      onGetStorage: () => new MemoryStorage(),
    });

    expect(onShowError).toHaveBeenCalledWith('导入配置备份失败');
  });
});
