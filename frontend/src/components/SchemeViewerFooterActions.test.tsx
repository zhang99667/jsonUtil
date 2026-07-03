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
  it('渲染基础状态和常用操作，并透传点击回调', () => {
    const onToggleQRCode = vi.fn();
    const onCopyOriginal = vi.fn();
    const tree = renderFooter({ onToggleQRCode, onCopyOriginal });
    const text = collectRenderedText(tree);

    expect(text).toContain('2 层解码');
    expect(text).toContain('二维码');
    expect(text).toContain('复制原始值');
    expect(text).toContain('复制解码结果');

    const qrCodeButton = findRenderedByTour(tree, 'scheme-qrcode-button')[0];
    expect(qrCodeButton.props.disabled).toBe(false);
    clickElement(qrCodeButton);
    clickElement(findRenderedByTour(tree, 'scheme-copy-original')[0]);

    expect(onToggleQRCode).toHaveBeenCalledTimes(1);
    expect(onCopyOriginal).toHaveBeenCalledTimes(1);
  });

  it('按能力展示可选操作', () => {
    const tree = renderFooter({
      canCancelDecode: true,
      hasCommandSummary: true,
      canCopyCmdStructure: true,
      isJsonResult: true,
      canCopyPathValues: true,
      isStandalone: true,
      hasDecodeLayers: true,
      canCopySerializedContent: true,
      canShowApplyEdit: true,
      canApplyEdit: true,
    });

    expect(findRenderedByTour(tree, 'scheme-cancel-decode')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-copy-cmd-structure')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-copy-path-values')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-copy-serialized')).toHaveLength(1);
    expect(findRenderedByTour(tree, 'scheme-apply-edit')).toHaveLength(1);
  });

  it('禁用不可用的二维码和解码复制操作', () => {
    const tree = renderFooter({
      canShowQRCode: false,
      canCopyDecoded: false,
    });

    expect(findRenderedByTour(tree, 'scheme-qrcode-button')[0].props.disabled).toBe(true);
    expect(findRenderedByTour(tree, 'scheme-copy-decoded')[0].props.disabled).toBe(true);
  });
});
