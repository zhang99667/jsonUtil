import { describe, expect, it, vi } from 'vitest';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import { SchemeViewerFooterActions } from './SchemeViewerFooterActions';

interface ElementLike {
  type?: unknown;
  props: Record<string, unknown>;
}

const isElementLike = (node: unknown): node is ElementLike => (
  typeof node === 'object' &&
  node !== null &&
  'props' in node &&
  typeof (node as ElementLike).props === 'object' &&
  (node as ElementLike).props !== null
);

const renderFunctionElement = (node: ElementLike): unknown | null => (
  typeof node.type === 'function' ? node.type(node.props) : null
);

const collectText = (node: unknown): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isElementLike(node)) return collectText(renderFunctionElement(node) ?? node.props.children);
  return '';
};

const findByTour = (node: unknown, dataTour: string): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(child => findByTour(child, dataTour));
  if (!isElementLike(node)) return [];

  const renderedNode = renderFunctionElement(node);
  if (renderedNode) return findByTour(renderedNode, dataTour);

  const matches = node.props['data-tour'] === dataTour ? [node] : [];
  return matches.concat(findByTour(node.props.children, dataTour));
};

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
    const text = collectText(tree);

    expect(text).toContain('2 层解码');
    expect(text).toContain('二维码');
    expect(text).toContain('复制原始值');
    expect(text).toContain('复制解码结果');

    const qrCodeButton = findByTour(tree, 'scheme-qrcode-button')[0];
    expect(qrCodeButton.props.disabled).toBe(false);
    clickElement(qrCodeButton);
    clickElement(findByTour(tree, 'scheme-copy-original')[0]);

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

    expect(findByTour(tree, 'scheme-cancel-decode')).toHaveLength(1);
    expect(findByTour(tree, 'scheme-copy-cmd-structure')).toHaveLength(1);
    expect(findByTour(tree, 'scheme-copy-path-values')).toHaveLength(1);
    expect(findByTour(tree, 'scheme-copy-serialized')).toHaveLength(1);
    expect(findByTour(tree, 'scheme-apply-edit')).toHaveLength(1);
  });

  it('禁用不可用的二维码和解码复制操作', () => {
    const tree = renderFooter({
      canShowQRCode: false,
      canCopyDecoded: false,
    });

    expect(findByTour(tree, 'scheme-qrcode-button')[0].props.disabled).toBe(true);
    expect(findByTour(tree, 'scheme-copy-decoded')[0].props.disabled).toBe(true);
  });
});
