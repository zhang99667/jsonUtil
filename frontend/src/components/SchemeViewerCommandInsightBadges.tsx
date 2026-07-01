import React from 'react';
import {
  formatSchemeInsightItems,
  type SchemeCommandSummaryInfo,
} from '../utils/schemeMetadata';

type SchemeViewerCommandInsightBadgesProps = Pick<
  SchemeCommandSummaryInfo,
  'commandFields' | 'extFields' | 'base64SuffixFields'
>;

const renderInsightBadge = (
  insight: string,
  className: string
): React.ReactNode => (
  <span
    className={`bg-editor-bg px-2 py-0.5 rounded font-mono max-w-full truncate ${className}`}
    title={insight}
  >
    {insight}
  </span>
);

export const SchemeViewerCommandInsightBadges: React.FC<SchemeViewerCommandInsightBadgesProps> = ({
  commandFields,
  extFields,
  base64SuffixFields,
}) => {
  const nestedCommandInsight = formatSchemeInsightItems('cmd解析', commandFields);
  const extInsight = formatSchemeInsightItems('ext解析', extFields);
  const base64SuffixInsight = formatSchemeInsightItems('Base64 后缀', base64SuffixFields, 6);

  if (!nestedCommandInsight && !extInsight && !base64SuffixInsight) return null;

  return (
    <>
      {nestedCommandInsight && renderInsightBadge(nestedCommandInsight, 'text-emerald-300')}
      {extInsight && renderInsightBadge(extInsight, 'text-amber-200')}
      {base64SuffixInsight && renderInsightBadge(base64SuffixInsight, 'text-emerald-300')}
    </>
  );
};
