import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AIProvider } from '../types';
import { DEFAULT_SHORTCUTS } from '../utils/shortcuts';
import { UnifiedSettingsModal } from './UnifiedSettingsModal';

vi.mock('./NativeDialog', () => ({
  NativeDialog: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: ReactNode;
  }) => isOpen ? <div role="dialog">{children}</div> : null,
}));

afterEach(cleanup);

interface RenderSettingsOptions {
  onClose?: () => void;
  onSaveGeneralSettings?: (settings: { autoExpandSchemeInDeepFormat: boolean }) => void;
}

const renderSettings = ({
  onClose = vi.fn(),
  onSaveGeneralSettings = vi.fn(),
}: RenderSettingsOptions = {}) => render(
  <UnifiedSettingsModal
    isOpen
    onClose={onClose}
    shortcuts={DEFAULT_SHORTCUTS}
    onUpdateShortcut={vi.fn()}
    onResetShortcuts={vi.fn()}
    aiConfig={{
      provider: AIProvider.OPENAI,
      apiKey: '',
      model: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1',
    }}
    onSaveAIConfig={vi.fn()}
    generalSettings={{ autoExpandSchemeInDeepFormat: true }}
    onSaveGeneralSettings={onSaveGeneralSettings}
    onResetPanelLayout={vi.fn()}
    onExportSettingsBackup={vi.fn()}
    onImportSettingsBackup={vi.fn()}
  />
);

describe('UnifiedSettingsModal', () => {
  it('优先展示通用设置并按重要性排列页签', () => {
    renderSettings();

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(tab => tab.textContent?.trim())).toEqual([
      '通用设置',
      'AI 配置',
      '快捷键',
    ]);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel', { name: '通用设置' }).hasAttribute('hidden')).toBe(false);
  });

  it('通用开关即时生效且页脚无需保存', () => {
    const onClose = vi.fn();
    const onSaveGeneralSettings = vi.fn();
    renderSettings({ onClose, onSaveGeneralSettings });

    const autoExpandSwitch = screen.getByRole('switch', {
      name: '嵌套解析时自动展开 CMD/Scheme 字符串',
    });
    fireEvent.click(autoExpandSwitch);

    expect(autoExpandSwitch.getAttribute('aria-checked')).toBe('false');
    expect(onSaveGeneralSettings).toHaveBeenCalledOnce();
    expect(onSaveGeneralSettings).toHaveBeenCalledWith({
      autoExpandSchemeInDeepFormat: false,
    });
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: '取消' })).toBeNull();
    expect(screen.queryByRole('button', { name: '保存设置' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '完成' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
