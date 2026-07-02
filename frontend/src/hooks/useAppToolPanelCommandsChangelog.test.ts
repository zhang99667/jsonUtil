import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_CHANGELOG_OPEN_EVENT } from '../utils/appEvents';
import {
  cleanupEffect,
  stateSetters,
  useToolPanelCommandsFixture,
} from './useAppToolPanelCommandsTestFixture';

describe('useAppToolPanelCommands changelog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('监听 changelog 打开事件并在清理时移除监听', () => {
    const { listeners } = useToolPanelCommandsFixture();
    const detail = { version: '1.8.254', changelogMarkdown: '  ## 更新  ' };

    listeners.get(APP_CHANGELOG_OPEN_EVENT)?.(
      new CustomEvent(APP_CHANGELOG_OPEN_EVENT, { detail }) as Event
    );
    cleanupEffect?.();

    expect(stateSetters.changelogSourceMarkdown).toHaveBeenCalledWith('  ## 更新  ');
    expect(stateSetters.changelogHighlightedVersion).toHaveBeenCalledWith('1.8.254');
    expect(stateSetters.isChangelogModalOpen).toHaveBeenCalledWith(true);
    expect(window.removeEventListener).toHaveBeenCalledWith(
      APP_CHANGELOG_OPEN_EVENT,
      listeners.get(APP_CHANGELOG_OPEN_EVENT),
    );
  });

  it('关闭 changelog 时只收起更新日志弹窗', () => {
    const { commands } = useToolPanelCommandsFixture();

    commands.handleCloseChangelog();

    expect(stateSetters.isChangelogModalOpen).toHaveBeenCalledWith(false);
  });
});
