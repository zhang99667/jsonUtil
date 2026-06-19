export const APP_CHANGELOG_OPEN_EVENT = 'json-helper:open-changelog';

export interface AppChangelogOpenDetail {
  version?: string;
  versionLabel?: string;
  changelogMarkdown?: string;
}

export const openAppChangelog = (detail: AppChangelogOpenDetail = {}) => {
  window.dispatchEvent(new CustomEvent<AppChangelogOpenDetail>(APP_CHANGELOG_OPEN_EVENT, {
    detail,
  }));
};
