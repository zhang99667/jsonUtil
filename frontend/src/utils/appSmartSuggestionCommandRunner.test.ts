import { describe, expect, it, vi } from 'vitest';
import { TransformMode } from '../types';
import { runAppSmartSuggestionCommand } from './appSmartSuggestionCommandRunner';

const createEffects = () => ({
  onRunAiFix: vi.fn(),
  onSetMode: vi.fn(),
  onClearHighlight: vi.fn(),
  onOpenSchemeInput: vi.fn(),
  onSetSchemePanelOpen: vi.fn(),
  onSetTransformReportOpen: vi.fn(),
  onSetJsonTreePanelOpen: vi.fn(),
  onSetJsonSchemaPanelOpen: vi.fn(),
  onShowError: vi.fn(),
  onShowSuccess: vi.fn(),
  onTrackToolEvent: vi.fn(),
  now: () => 123,
});

describe('appSmartSuggestionCommandRunner', () => {
  it('AI 修复建议委托给现有修复流程且不重复打智能建议埋点', () => {
    const effects = createEffects();

    runAppSmartSuggestionCommand({
      actionId: 'ai-fix',
      currentMode: TransformMode.NONE,
      sourceText: '{bad',
    }, effects);

    expect(effects.onRunAiFix).toHaveBeenCalledTimes(1);
    expect(effects.onSetMode).not.toHaveBeenCalled();
    expect(effects.onClearHighlight).not.toHaveBeenCalled();
    expect(effects.onSetSchemePanelOpen).not.toHaveBeenCalled();
    expect(effects.onSetJsonSchemaPanelOpen).not.toHaveBeenCalled();
    expect(effects.onShowError).not.toHaveBeenCalled();
    expect(effects.onShowSuccess).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).not.toHaveBeenCalled();
  });

  it('Scheme 面板建议会填入裁剪后的 SOURCE 并关闭深度报告', () => {
    const effects = createEffects();

    runAppSmartSuggestionCommand({
      actionId: 'scheme-panel',
      currentMode: TransformMode.NONE,
      sourceText: '  baiduboxapp://v1/open  ',
    }, effects);

    expect(effects.onOpenSchemeInput).toHaveBeenCalledWith('baiduboxapp://v1/open');
    expect(effects.onSetSchemePanelOpen).toHaveBeenCalledWith(true);
    expect(effects.onSetTransformReportOpen).toHaveBeenCalledWith(false);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已填入 Scheme 解析');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(
      'SMART_SUGGESTION_SCHEME_PANEL',
      'smart_suggestion',
      'success',
      123,
    );
  });

  it('Scheme 面板建议在 SOURCE 为空时提示错误并记录跳过', () => {
    const effects = createEffects();

    runAppSmartSuggestionCommand({
      actionId: 'scheme-panel',
      currentMode: TransformMode.NONE,
      sourceText: '   ',
    }, effects);

    expect(effects.onShowError).toHaveBeenCalledWith('SOURCE 为空，暂无可解析内容');
    expect(effects.onOpenSchemeInput).not.toHaveBeenCalled();
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(
      'SMART_SUGGESTION_SCHEME_PANEL',
      'smart_suggestion',
      'skipped',
      123,
    );
  });

  it('结构导航建议会切到深度解析并打开结构面板', () => {
    const effects = createEffects();

    runAppSmartSuggestionCommand({
      actionId: 'structure-nav',
      currentMode: TransformMode.FORMAT,
      sourceText: '{"a":1}',
    }, effects);

    expect(effects.onSetMode).toHaveBeenCalledWith(TransformMode.DEEP_FORMAT);
    expect(effects.onSetJsonTreePanelOpen).toHaveBeenCalledWith(true);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已打开结构导航');
  });

  it('Schema 建议会打开 Schema 面板并记录成功', () => {
    const effects = createEffects();

    runAppSmartSuggestionCommand({
      actionId: 'schema-panel',
      currentMode: TransformMode.NONE,
      sourceText: '{"a":1}',
    }, effects);

    expect(effects.onSetJsonSchemaPanelOpen).toHaveBeenCalledWith(true);
    expect(effects.onShowSuccess).toHaveBeenCalledWith('已打开 Schema 校验');
    expect(effects.onTrackToolEvent).toHaveBeenCalledWith(
      'SMART_SUGGESTION_SCHEMA_PANEL',
      'smart_suggestion',
      'success',
      123,
    );
  });

  it('response 排查建议会清空高亮并关闭报告', () => {
    const effects = createEffects();

    runAppSmartSuggestionCommand({
      actionId: 'response-inspection',
      currentMode: TransformMode.NONE,
      sourceText: '{"errno":0}',
    }, effects);

    expect(effects.onClearHighlight).toHaveBeenCalledTimes(1);
    expect(effects.onSetTransformReportOpen).toHaveBeenCalledWith(false);
  });
});
