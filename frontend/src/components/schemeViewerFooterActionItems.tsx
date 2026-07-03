import type { ReactNode } from 'react';
import type { SchemeViewerActionTitles } from '../utils/schemeViewerActionTitles';
import type { SchemeViewerFooterActionTone } from './SchemeViewerFooterActionButton';
import { SchemeViewerFooterActionIcons } from './SchemeViewerFooterActionIcons';

export interface SchemeViewerFooterActionListProps {
  canCancelDecode: boolean;
  onCancelDecode: () => void;
  showQRCode: boolean;
  canShowQRCode: boolean;
  onToggleQRCode: () => void;
  canCopyOriginal: boolean;
  onCopyOriginal: () => void;
  canCopyDecoded: boolean;
  onCopyDecoded: () => void;
  hasCommandSummary: boolean;
  canCopyCmdStructure: boolean;
  onCopyCmdStructure: () => void;
  isJsonResult: boolean;
  canCopyPathValues: boolean;
  onCopyPathValues: () => void;
  isStandalone: boolean;
  hasDecodeLayers: boolean;
  canCopySerializedContent: boolean;
  onCopySerialized: () => void;
  canShowApplyEdit: boolean;
  canApplyEdit: boolean;
  onApplyEdit: () => void;
  actionTitles: SchemeViewerActionTitles;
}

interface SchemeViewerFooterActionItem {
  key: string;
  visible: boolean;
  dataTour: string;
  label: string;
  title: string;
  ariaLabel: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaPressed?: boolean;
  tone?: SchemeViewerFooterActionTone;
}

export const buildSchemeViewerFooterActionItems = (
  props: SchemeViewerFooterActionListProps
): SchemeViewerFooterActionItem[] => [
  {
    key: 'cancel-decode',
    visible: props.canCancelDecode,
    dataTour: 'scheme-cancel-decode',
    onClick: props.onCancelDecode,
    tone: 'warning',
    label: '取消解析',
    title: '停止当前大内容解析',
    ariaLabel: '取消解析，停止当前大内容解析',
    icon: SchemeViewerFooterActionIcons.cancelDecode,
  },
  {
    key: 'qr-code',
    visible: true,
    dataTour: 'scheme-qrcode-button',
    onClick: props.onToggleQRCode,
    disabled: !props.canShowQRCode,
    ariaPressed: props.showQRCode,
    ariaLabel: `二维码，${props.actionTitles.qrCode}`,
    tone: props.showQRCode ? 'success' : 'neutral',
    label: '二维码',
    title: props.actionTitles.qrCode,
    icon: SchemeViewerFooterActionIcons.qrCode,
  },
  {
    key: 'copy-original',
    visible: true,
    dataTour: 'scheme-copy-original',
    onClick: props.onCopyOriginal,
    disabled: !props.canCopyOriginal,
    title: props.actionTitles.copyOriginal,
    ariaLabel: `复制原始值，${props.actionTitles.copyOriginal}`,
    label: '复制原始值',
    icon: SchemeViewerFooterActionIcons.copyOriginal,
  },
  {
    key: 'copy-decoded',
    visible: true,
    dataTour: 'scheme-copy-decoded',
    onClick: props.onCopyDecoded,
    disabled: !props.canCopyDecoded,
    title: props.actionTitles.copyDecoded,
    ariaLabel: `复制解码结果，${props.actionTitles.copyDecoded}`,
    label: '复制解码结果',
    icon: SchemeViewerFooterActionIcons.copyDecoded,
  },
  {
    key: 'copy-cmd-structure',
    visible: props.hasCommandSummary,
    dataTour: 'scheme-copy-cmd-structure',
    onClick: props.onCopyCmdStructure,
    disabled: !props.canCopyCmdStructure,
    title: props.actionTitles.copyCmdStructure,
    ariaLabel: `复制 CMD 结构，${props.actionTitles.copyCmdStructure}`,
    label: '复制 CMD 结构',
    icon: SchemeViewerFooterActionIcons.copyCmdStructure,
  },
  {
    key: 'copy-path-values',
    visible: props.isJsonResult,
    dataTour: 'scheme-copy-path-values',
    onClick: props.onCopyPathValues,
    disabled: !props.canCopyPathValues,
    title: props.actionTitles.copyPathValues,
    ariaLabel: `复制路径和值，${props.actionTitles.copyPathValues}`,
    label: '复制路径和值',
    icon: SchemeViewerFooterActionIcons.copyPathValues,
  },
  {
    key: 'copy-serialized',
    visible: props.isStandalone && props.hasDecodeLayers,
    dataTour: 'scheme-copy-serialized',
    onClick: props.onCopySerialized,
    disabled: !props.canCopySerializedContent,
    title: props.actionTitles.copySerialized,
    ariaLabel: `复制序列化结果，${props.actionTitles.copySerialized}`,
    label: '复制序列化结果',
    icon: SchemeViewerFooterActionIcons.copySerialized,
  },
  {
    key: 'apply-edit',
    visible: props.canShowApplyEdit,
    dataTour: 'scheme-apply-edit',
    onClick: props.onApplyEdit,
    disabled: !props.canApplyEdit,
    title: props.actionTitles.applyEdit,
    ariaLabel: `应用修改，${props.actionTitles.applyEdit}`,
    tone: 'primary',
    label: '应用修改',
    icon: SchemeViewerFooterActionIcons.applyEdit,
  },
];
