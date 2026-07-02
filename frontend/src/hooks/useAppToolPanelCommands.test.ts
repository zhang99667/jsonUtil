import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { APP_CHANGELOG_OPEN_EVENT } from '../utils/appEvents';
import {
  cleanupEffect,
  stateSetters,
  useToolPanelCommandsFixture,
} from './useAppToolPanelCommandsTestFixture';

describe('useAppToolPanelCommands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('打开 JSONPath 面板时切到深度解析并记录事件', () => {
    const { commands, onSetMode, onTrackToolEvent } = useToolPanelCommandsFixture();

    commands.handleToggleJsonPath();

    expect(onSetMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(stateSetters.isJsonPathPanelOpen).toHaveBeenCalledWith(true);
    expect(onTrackToolEvent).toHaveBeenCalledWith('JSONPATH_OPEN', 'panel');
  });

  it('关闭 JSONPath 面板时不重复切换模式', () => {
    const { commands, onSetMode, onTrackToolEvent } = useToolPanelCommandsFixture({
      mode: TransformMode.DEEP_FORMAT,
    }, {
      isJsonPathPanelOpen: true,
    });

    commands.handleToggleJsonPath();

    expect(onSetMode).not.toHaveBeenCalled();
    expect(stateSetters.isJsonPathPanelOpen).toHaveBeenCalledWith(false);
    expect(onTrackToolEvent).toHaveBeenCalledWith('JSONPATH_CLOSE', 'panel');
  });

  it('JSONPath 定位会生成递增请求并收起报告面板', () => {
    const { commands, onSetHighlightRange, onSetMode, onTrackToolEvent } = useToolPanelCommandsFixture();

    commands.handleLocateJsonPath(' $.data[0] ');

    expect(onSetMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(onSetHighlightRange).toHaveBeenCalledWith(null);
    expect(stateSetters.jsonPathQueryRequest).toHaveBeenCalledWith({
      id: 1,
      query: '$.data[0]',
    });
    expect(stateSetters.isJsonPathPanelOpen).toHaveBeenCalledWith(true);
    expect(stateSetters.isTransformReportOpen).toHaveBeenCalledWith(false);
    expect(onTrackToolEvent).toHaveBeenCalledWith('JSONPATH_LOCATE', 'panel');
  });

  it('从 JSONPath 结果定位结构树时生成结构焦点请求', () => {
    const { commands, onTrackToolEvent } = useToolPanelCommandsFixture();

    commands.handleLocateJsonPathResultInStructure({
      path: '$.data[0].url',
      pointer: '/data/0/url',
      range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 8 },
      value: 'https://example.com',
    });

    expect(stateSetters.jsonTreeFocusRequest).toHaveBeenCalledWith({
      id: 1,
      path: '$.data[0].url',
      pointer: '/data/0/url',
    });
    expect(stateSetters.isJsonTreePanelOpen).toHaveBeenCalledWith(true);
    expect(stateSetters.isTransformReportOpen).toHaveBeenCalledWith(false);
    expect(onTrackToolEvent).toHaveBeenCalledWith('STRUCTURE_NAV_LOCATE', 'panel');
  });

  it('Scheme 请求统一在 hook 内递增 ID', () => {
    const { commands, onTrackToolEvent } = useToolPanelCommandsFixture();

    commands.handleOpenSchemeFromReport('baiduboxapp://v1/open');
    commands.requestSchemeInput('baiduboxapp://v2/open');

    expect(stateSetters.schemeInputRequest).toHaveBeenNthCalledWith(1, {
      id: 1,
      value: 'baiduboxapp://v1/open',
    });
    expect(stateSetters.schemeInputRequest).toHaveBeenNthCalledWith(2, {
      id: 2,
      value: 'baiduboxapp://v2/open',
    });
    expect(stateSetters.isSchemeDecodeOpen).toHaveBeenCalledWith(true);
    expect(stateSetters.isTransformReportOpen).toHaveBeenCalledWith(false);
    expect(onTrackToolEvent).toHaveBeenCalledWith('SCHEME_OPEN_FROM_REPORT', 'panel');
  });

  it('状态栏只在 SOURCE 是可独立解析输入时打开 Scheme 面板', () => {
    const valid = useToolPanelCommandsFixture({ sourceText: ' baiduboxapp://v1/open ' });
    valid.commands.handleOpenSourceSchemeInput();

    expect(valid.stateSetters.schemeInputRequest).toHaveBeenCalledWith({
      id: 1,
      value: 'baiduboxapp://v1/open',
    });

    const invalid = useToolPanelCommandsFixture({ sourceText: 'plain text' });
    invalid.commands.handleOpenSourceSchemeInput();

    expect(invalid.stateSetters.schemeInputRequest).not.toHaveBeenCalled();
  });

  it('从报告打开模板填充时重置质量提示并收起报告面板', () => {
    const { commands, onTrackToolEvent } = useToolPanelCommandsFixture();

    commands.handleOpenTemplateFillFromReport('{{url}}');

    expect(stateSetters.templateApplyQualityDelta).toHaveBeenCalledWith('');
    expect(stateSetters.templateFillRequest).toHaveBeenCalledWith({
      id: 1,
      template: '{{url}}',
    });
    expect(stateSetters.isTemplatePanelOpen).toHaveBeenCalledWith(true);
    expect(stateSetters.isTransformReportOpen).toHaveBeenCalledWith(false);
    expect(onTrackToolEvent).toHaveBeenCalledWith('TEMPLATE_OPEN_FROM_REPORT', 'panel');
  });

  it('监听 changelog 打开事件并在清理时移除监听', () => {
    const { listeners } = useToolPanelCommandsFixture();
    const detail = {
      version: '1.8.254',
      changelogMarkdown: '  ## 更新  ',
    };

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

  it('关闭 JSONPath 面板时同步清理高亮', () => {
    const { commands, onSetHighlightRange } = useToolPanelCommandsFixture();

    commands.handleCloseJsonPathPanel();

    expect(stateSetters.isJsonPathPanelOpen).toHaveBeenCalledWith(false);
    expect(onSetHighlightRange).toHaveBeenCalledWith(null);
  });
});
