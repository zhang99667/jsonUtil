import { describe, expect, it } from 'vitest';
import {
  buildSchemeViewerActionTitles,
  type SchemeViewerActionTitleState,
} from './schemeViewerActionTitles';

const buildState = (
  overrides: Partial<SchemeViewerActionTitleState> = {}
): SchemeViewerActionTitleState => ({
  hasOriginalValue: true,
  showQRCode: false,
  isDecodePending: false,
  hasDecodedContent: true,
  hasSchemeQualitySummary: true,
  hasEditedJsonError: false,
  isJsonResult: true,
  hasNonReversibleLayer: false,
  decodeLayerCount: 1,
  isEditing: true,
  ...overrides,
});

describe('schemeViewerActionTitles', () => {
  it('生成可操作状态下的按钮标题', () => {
    expect(buildSchemeViewerActionTitles(buildState())).toEqual({
      qrCode: '生成二维码',
      copyOriginal: '复制原始值到剪贴板',
      copyDecoded: '复制解码结果到剪贴板',
      copyQualitySnapshot: '复制不含原始值的 Scheme 解析质量指标 JSON',
      copyCmdStructure: '复制为 cmdHandler 风格的 cmdSchema / cmdParams 结构',
      copyPathValues: '复制解码 JSON 中的路径和值',
      copySerialized: '复制当前编辑内容重新编码后的结果',
      applyEdit: '将当前编辑内容重新编码并应用回来源',
    });
  });

  it('生成空内容和二维码展开状态标题', () => {
    const titles = buildSchemeViewerActionTitles(buildState({
      hasOriginalValue: false,
      showQRCode: true,
      hasDecodedContent: false,
      hasSchemeQualitySummary: false,
    }));

    expect(titles.qrCode).toBe('请输入内容后生成二维码');
    expect(titles.copyOriginal).toBe('请输入待复制的原始值');
    expect(titles.copyDecoded).toBe('暂无解码结果可复制');
    expect(titles.copyQualitySnapshot).toBe('暂无质量快照可复制');
    expect(buildSchemeViewerActionTitles(buildState({ showQRCode: true })).qrCode).toBe('隐藏二维码');
  });

  it('解析中状态优先阻止复制和应用', () => {
    const titles = buildSchemeViewerActionTitles(buildState({ isDecodePending: true }));

    expect(titles.copyDecoded).toBe('解析完成后可复制解码结果');
    expect(titles.copyCmdStructure).toBe('解析完成后可复制 CMD 结构');
    expect(titles.copyPathValues).toBe('解析完成后可复制路径和值');
    expect(titles.copySerialized).toBe('解析完成后可复制序列化结果');
    expect(titles.applyEdit).toBe('解析完成后可应用修改');
  });

  it('JSON 错误和非 JSON 结果给出对应阻断原因', () => {
    const jsonErrorTitles = buildSchemeViewerActionTitles(buildState({ hasEditedJsonError: true }));

    expect(jsonErrorTitles.copyCmdStructure).toBe('请先修正解码结果中的 JSON 错误');
    expect(jsonErrorTitles.copyPathValues).toBe('请先修正解码结果中的 JSON 错误');
    expect(jsonErrorTitles.copySerialized).toBe('请先修正解码结果中的 JSON 错误');
    expect(jsonErrorTitles.applyEdit).toBe('请先修正解码结果中的 JSON 错误');

    expect(buildSchemeViewerActionTitles(buildState({ isJsonResult: false })).copyCmdStructure)
      .toBe('当前结果不是 JSON，暂无 CMD 结构可复制');
  });

  it('区分不可逆、无解码层和未编辑状态', () => {
    expect(buildSchemeViewerActionTitles(buildState({ hasNonReversibleLayer: true })).copySerialized)
      .toBe('当前编码层不可逆，仅支持查看和复制');
    expect(buildSchemeViewerActionTitles(buildState({ hasNonReversibleLayer: true })).applyEdit)
      .toBe('当前编码层不可逆，无法应用修改');
    expect(buildSchemeViewerActionTitles(buildState({ decodeLayerCount: 0 })).copySerialized)
      .toBe('当前内容无需重新编码');
    expect(buildSchemeViewerActionTitles(buildState({ isEditing: false })).applyEdit)
      .toBe('修改解码结果后可应用');
  });
});
