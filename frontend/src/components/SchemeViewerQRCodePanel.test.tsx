import { QRCodeCanvas } from 'qrcode.react';
import { describe, expect, it, vi } from 'vitest';
import {
  clickElement,
  collectText,
  findByTour,
  findByType,
} from './componentElementTestHelpers';
import { SchemeViewerQRCodePanel } from './SchemeViewerQRCodePanel';

const renderPanel = (
  overrides: Partial<Parameters<typeof SchemeViewerQRCodePanel>[0]> = {},
) => SchemeViewerQRCodePanel({
  isVisible: true,
  qrCodeType: 'original',
  originalContent: 'baiduboxapp://v1/open',
  decodedContent: '{"ok":true}',
  isDecodePending: false,
  qrCodeRef: { current: null },
  onTypeChange: vi.fn(),
  onDownload: vi.fn(),
  ...overrides,
});

describe('SchemeViewerQRCodePanel', () => {
  it('隐藏时不渲染内容', () => {
    expect(renderPanel({ isVisible: false })).toBeNull();
  });

  it('容量内内容渲染二维码并展示字符与字节大小', () => {
    const tree = renderPanel({ originalContent: '中'.repeat(777) });

    expect(findByType(tree, QRCodeCanvas)).toHaveLength(1);
    expect(collectText(tree)).toContain('777 字符 / 2.3 KB');
    expect(findByTour(tree, 'scheme-qrcode-download')[0].props.disabled).toBe(false);
  });

  it('超出 UTF-8 字节容量时阻止渲染和下载', () => {
    const tree = renderPanel({ originalContent: '中'.repeat(778) });

    expect(findByType(tree, QRCodeCanvas)).toHaveLength(0);
    expect(collectText(tree)).toContain('M 级字节模式最多 2331 字节');
    expect(collectText(tree)).toContain('778 字符 / 2.3 KB');
    expect(findByTour(tree, 'scheme-qrcode-download')[0].props.disabled).toBe(true);
  });

  it('纯数字使用数字模式的额外容量', () => {
    const tree = renderPanel({ originalContent: '1'.repeat(5_596) });

    expect(findByType(tree, QRCodeCanvas)).toHaveLength(1);
    expect(findByTour(tree, 'scheme-qrcode-download')[0].props.disabled).toBe(false);
  });

  it('不完整代理字符不会触发二维码依赖异常', () => {
    const tree = renderPanel({ originalContent: '\uD800' });

    expect(findByType(tree, QRCodeCanvas)).toHaveLength(0);
    expect(collectText(tree)).toContain('内容包含不完整的 Unicode 字符');
    expect(findByTour(tree, 'scheme-qrcode-download')[0].props.disabled).toBe(true);
  });

  it('切换类型与下载按钮透传受控回调', () => {
    const onTypeChange = vi.fn();
    const onDownload = vi.fn();
    const tree = renderPanel({ onTypeChange, onDownload });

    clickElement(findByTour(tree, 'scheme-qrcode-decoded')[0]);
    clickElement(findByTour(tree, 'scheme-qrcode-download')[0]);

    expect(onTypeChange).toHaveBeenCalledWith('decoded');
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('解码尚未完成时不使用旧解码结果生成二维码', () => {
    const tree = renderPanel({ qrCodeType: 'decoded', isDecodePending: true });

    expect(findByType(tree, QRCodeCanvas)).toHaveLength(0);
    expect(collectText(tree)).toContain('无内容可生成二维码');
  });
});
