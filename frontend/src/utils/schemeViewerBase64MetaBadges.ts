import {
  formatBase64MetaDisplayValue,
  type Base64MetaInfo,
} from './schemeMetadata';
import { formatSchemeTooltipValue } from './schemeViewerFormatters';

const BASE64_META_BADGE_CLASS = 'bg-editor-bg text-gray-300 px-2 py-0.5 rounded font-mono max-w-full truncate';
const BASE64_META_ENTRY_BADGE_CLASS = 'bg-editor-bg text-emerald-300 px-2 py-0.5 rounded font-mono max-w-full truncate';
const BASE64_META_ENTRY_LIMIT = 6;

export interface SchemeViewerBase64MetaBadge {
  key: string;
  label: string;
  title: string;
  className: string;
}

export interface SchemeViewerBase64MetaBadgeModel {
  badges: SchemeViewerBase64MetaBadge[];
  remainingEntryCount: number;
  suffixLengthLabel?: string;
}

export const buildSchemeViewerBase64MetaBadges = (
  base64MetaInfo: Base64MetaInfo
): SchemeViewerBase64MetaBadgeModel => {
  const badges: SchemeViewerBase64MetaBadge[] = [];

  if (base64MetaInfo.prefix) {
    badges.push({
      key: 'prefix',
      label: `头部=${formatBase64MetaDisplayValue(base64MetaInfo.prefix, 24)}`,
      title: formatSchemeTooltipValue(base64MetaInfo.prefix),
      className: BASE64_META_BADGE_CLASS,
    });
  }

  if (base64MetaInfo.suffix) {
    badges.push({
      key: 'suffix',
      label: `后缀=${formatBase64MetaDisplayValue(base64MetaInfo.suffix, 32)}`,
      title: formatSchemeTooltipValue(base64MetaInfo.suffix),
      className: BASE64_META_BADGE_CLASS,
    });
  }

  if (base64MetaInfo.suffixDecodePrefix) {
    badges.push({
      key: 'suffixDecodePrefix',
      label: `跳过=${formatBase64MetaDisplayValue(base64MetaInfo.suffixDecodePrefix, 16)}`,
      title: formatSchemeTooltipValue(base64MetaInfo.suffixDecodePrefix),
      className: BASE64_META_BADGE_CLASS,
    });
  }

  base64MetaInfo.suffixDecodedEntries.slice(0, BASE64_META_ENTRY_LIMIT).forEach(entry => {
    badges.push({
      key: `entry:${entry.key}`,
      label: `${entry.key}=${entry.displayValue}`,
      title: `${entry.key}=${formatSchemeTooltipValue(entry.displayValue)}`,
      className: BASE64_META_ENTRY_BADGE_CLASS,
    });
  });

  return {
    badges,
    remainingEntryCount: Math.max(0, base64MetaInfo.suffixDecodedCount - BASE64_META_ENTRY_LIMIT),
    suffixLengthLabel: base64MetaInfo.suffix ? `${base64MetaInfo.suffixLength} 字符` : undefined,
  };
};
