import React from 'react';

export const buildIndexedMoreContent = (
  shouldShow: boolean,
  leadContent: React.ReactNode,
  indexedCount: number,
  visibleCount: number,
  indexedSuffix: string
): React.ReactNode => {
  if (!shouldShow) return undefined;

  return (
    <>
      {leadContent}
      {indexedCount > visibleCount && <span>，已索引 {indexedCount} {indexedSuffix}</span>}
    </>
  );
};
