import React from 'react';
import type { Base64MetaInfo } from '../utils/schemeMetadata';
import { buildSchemeViewerBase64MetaBadges } from '../utils/schemeViewerBase64MetaBadges';

interface SchemeViewerBase64MetaPanelProps {
  base64MetaInfo: Base64MetaInfo | null;
}

export const SchemeViewerBase64MetaPanel: React.FC<SchemeViewerBase64MetaPanelProps> = ({
  base64MetaInfo,
}) => {
  if (!base64MetaInfo) return null;
  const badgeModel = buildSchemeViewerBase64MetaBadges(base64MetaInfo);

  return (
    <div data-tour="scheme-base64-meta" className="flex items-start gap-2 text-xs">
      <span className="shrink-0 text-cyan-300 bg-cyan-900/30 border border-cyan-700/50 px-2 py-0.5 rounded">
        内部 Base64
      </span>
      <div className="flex flex-wrap gap-1 min-w-0">
        {badgeModel.badges.map(badge => (
          <span
            key={badge.key}
            className={badge.className}
            title={badge.title}
          >
            {badge.label}
          </span>
        ))}
        {badgeModel.remainingEntryCount > 0 && (
          <span className="text-gray-500 px-1 py-0.5">
            +{badgeModel.remainingEntryCount}
          </span>
        )}
        {badgeModel.suffixLengthLabel && (
          <span className="text-gray-500 px-1 py-0.5">
            {badgeModel.suffixLengthLabel}
          </span>
        )}
      </div>
    </div>
  );
};
