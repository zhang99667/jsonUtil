import { describe, expect, it, vi } from 'vitest';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import {
  buildSchemeViewerFooterActionItems,
  type SchemeViewerFooterActionListProps,
} from './schemeViewerFooterActionItems';

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

const createActionListProps = (
  overrides: Partial<SchemeViewerFooterActionListProps> = {}
): SchemeViewerFooterActionListProps => ({
  canCancelDecode: false,
  onCancelDecode: vi.fn(),
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

describe('schemeViewerFooterActionItems', () => {
  it('保留可选按钮的显隐顺序和 tone', () => {
    const items = buildSchemeViewerFooterActionItems(createActionListProps({
      canCancelDecode: true,
      hasCommandSummary: true,
      isJsonResult: true,
      isStandalone: true,
      hasDecodeLayers: true,
      canShowApplyEdit: true,
    }));

    expect(items.filter(item => item.visible).map(item => item.dataTour)).toEqual([
      'scheme-cancel-decode',
      'scheme-qrcode-button',
      'scheme-copy-original',
      'scheme-copy-decoded',
      'scheme-copy-cmd-structure',
      'scheme-copy-path-values',
      'scheme-copy-serialized',
      'scheme-apply-edit',
    ]);
    expect(items.find(item => item.dataTour === 'scheme-cancel-decode')?.tone).toBe('warning');
    expect(items.find(item => item.dataTour === 'scheme-apply-edit')?.tone).toBe('primary');
  });
});
