import { describe, expect, it, vi } from 'vitest';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import type { ElementLike } from './schemeViewerElementTestHelpers';
import { collectRenderedText, findRenderedByTour } from './schemeViewerRenderedElementTestHelpers';
import { SchemeViewerFooterActions } from './SchemeViewerFooterActions';

const clickElement = (node: ElementLike) => {
  const onClick = node.props.onClick;
  if (typeof onClick !== 'function') throw new Error('expected clickable element');
  onClick();
};

const actionTitles: SchemeViewerActionTitles = {
  qrCode: '生成二维码',
  copyOriginal: '复制原始值到剪贴板',
  copyDecoded: '复制解码结果到剪贴板',
  copyQualitySnapshot: '复制质量快照',
  copyCmdStructure: '复制 CMD 结构',
  copyPathValues: '复制路径和值',
  copySerialized: '复制序列化结果',
  applyEdit: '应用修改',
};

const renderFooter = (
  overrides: Partial<Parameters<typeof SchemeViewerFooterActions>[0]> = {}
) => SchemeViewerFooterActions({
  decodeStatusText: '2 层解码',
  canCancelDecode: false,
  onCancelDecode: vi.fn(),
  onClose: vi.fn(),
  showQRCode: false,
  canShowQRCode: true,
  onToggleQRCode: vi.fn(),
  canCopyOriginal: true,
  onCopyOriginal: vi.fn(),
  canCopyDecoded: true,
  onCopyDecoded: vi.fn(),
  hasCommandSummary: false,
  canCopyCmdStructure: false,
  onCopyCmdStructure: vi.fn(),
  isJsonResult: false,
  canCopyPathValues: false,
  onCopyPathValues: vi.fn(),
  isStandalone: false,
  hasDecodeLayers: false,
  canCopySerializedContent: false,
  onCopySerialized: vi.fn(),
  canShowApplyEdit: false,
  canApplyEdit: false,
  onApplyEdit: vi.fn(),
  actionTitles,
  ...overrides,
});

describe('SchemeViewerFooterActions', () => {
  it('渲染解码状态、关闭入口和动作列表', () => {
    const tree = renderFooter();

    expect(collectRenderedText(tree)).toContain('2 层解码');
    expect(collectRenderedText(tree)).toContain('关闭');
    expect(findRenderedByTour(tree, 'scheme-footer-actions')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-qrcode-button')).toHaveLength(1);
  });

  it('关闭按钮保留独立回调和可访问提示', () => {
    const onClose = vi.fn();
    const tree = renderFooter({ onClose });
    const closeButton = findRenderedByTour(tree, 'scheme-close-button')[0];

    expect(closeButton.props.title).toBe('关闭 Scheme 解析');
    expect(closeButton.props['aria-label']).toBe('关闭 Scheme 解析');
    clickElement(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
