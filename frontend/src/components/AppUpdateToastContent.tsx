import React from 'react';
import type { AppVersionManifest } from '../utils/appVersion';
import './AppReleaseToast.css';

interface AppUpdateToastContentProps {
  manifest: AppVersionManifest;
  toastId: string;
  onOpenChangelog: (manifest: AppVersionManifest) => void;
  onReload: () => void;
  onDismiss: (toastId: string) => void;
}

export const AppUpdateToastContent: React.FC<AppUpdateToastContentProps> = ({
  manifest,
  toastId,
  onOpenChangelog,
  onReload,
  onDismiss,
}) => (
  <div
    data-tour="app-update-toast"
    className="app-release-toast"
  >
    <div className="app-release-toast__body">
      <div className="app-release-toast__title">发现新版本 {manifest.versionLabel}</div>
      <div className="app-release-toast__description">刷新后即可使用最新功能和修复</div>
    </div>
    <div className="app-release-toast__actions">
      <button
        type="button"
        className="app-release-toast__button app-release-toast__button--secondary"
        onClick={() => onOpenChangelog(manifest)}
      >
        查看更新
      </button>
      <button
        type="button"
        className="app-release-toast__button app-release-toast__button--primary"
        onClick={onReload}
      >
        刷新
      </button>
      <button
        type="button"
        className="app-release-toast__button app-release-toast__button--muted"
        onClick={() => onDismiss(toastId)}
      >
        稍后
      </button>
    </div>
  </div>
);
