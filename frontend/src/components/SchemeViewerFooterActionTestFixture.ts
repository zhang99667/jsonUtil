import { vi } from 'vitest';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import type { ElementLike } from './schemeViewerElementTestHelpers';
import {
  SchemeViewerFooterActionList,
  type SchemeViewerFooterActionListProps,
} from './SchemeViewerFooterActionList';
import { SchemeViewerFooterActions } from './SchemeViewerFooterActions';

export const schemeViewerFooterActionTitles: SchemeViewerActionTitles = {
  qrCode: '生成二维码',
  copyOriginal: '复制原始值到剪贴板',
  copyDecoded: '复制解码结果到剪贴板',
  copyQualitySnapshot: '复制质量快照',
  copyCmdStructure: '复制 CMD 结构',
  copyPathValues: '复制路径和值',
  copySerialized: '复制序列化结果',
  applyEdit: '应用修改',
};

export const clickRenderedElement = (node: ElementLike) => {
  const onClick = node.props.onClick;
  if (typeof onClick !== 'function') throw new Error('expected clickable element');
  onClick();
};

export const createSchemeFooterActionListProps = (
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
  actionTitles: schemeViewerFooterActionTitles,
  ...overrides,
});

export const renderSchemeFooterActionList = (
  overrides: Partial<SchemeViewerFooterActionListProps> = {}
) => SchemeViewerFooterActionList(createSchemeFooterActionListProps(overrides));

export const renderSchemeFooterActions = (
  overrides: Partial<Parameters<typeof SchemeViewerFooterActions>[0]> = {}
) => SchemeViewerFooterActions({
  decodeStatusText: '2 层解码',
  onClose: vi.fn(),
  ...createSchemeFooterActionListProps(),
  ...overrides,
});
