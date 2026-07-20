import React from 'react';
import { APP_VERSION_LABEL } from '../utils/appVersion';

interface StatusBarVersionBadgeProps {
  onOpenChangelog?: () => void;
}

const VERSION_BADGE_CLASS_NAME = 'rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white';

export const StatusBarVersionBadge: React.FC<StatusBarVersionBadgeProps> = ({
  onOpenChangelog,
}) => {
  if (onOpenChangelog) {
    return (
      <button
        data-tour="statusbar-version"
        type="button"
        onClick={onOpenChangelog}
        className={`${VERSION_BADGE_CLASS_NAME} transition-colors hover:bg-white/25 hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-white`}
        title="当前版本，点击查看更新日志"
        aria-label={`查看版本更新，当前版本 ${APP_VERSION_LABEL}`}
      >
        {APP_VERSION_LABEL}
      </button>
    );
  }

  return (
    <span
      data-tour="statusbar-version"
      className={VERSION_BADGE_CLASS_NAME}
      title="当前版本"
    >
      {APP_VERSION_LABEL}
    </span>
  );
};
