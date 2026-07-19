import { describe, expect, it } from 'vitest';
import {
  compareAppVersions,
  getAppVersionManifestUrl,
  isRemoteAppVersionNewer,
  normalizeAppVersion,
  parseAppVersionManifest,
} from './appVersion';

describe('appVersion', () => {
  it('规范化版本号前缀', () => {
    expect(normalizeAppVersion('v1.8.70')).toBe('1.8.70');
    expect(normalizeAppVersion('  1.8.70  ')).toBe('1.8.70');
    expect(normalizeAppVersion('v')).toBe('0.0.0');
    expect(normalizeAppVersion()).toBe('0.0.0');
  });

  it('按数字段比较语义版本，避免字符串排序误判', () => {
    expect(compareAppVersions('1.10.0', '1.9.9')).toBe(1);
    expect(compareAppVersions('1.8.70', '1.8.70')).toBe(0);
    expect(compareAppVersions('1.8.69', '1.8.70')).toBe(-1);
    expect(compareAppVersions('v2.0.0', '1.99.99')).toBe(1);
  });

  it('按语义版本规则比较预发布与构建元数据', () => {
    expect(compareAppVersions('1.8.874-beta.2', '1.8.874-beta.1')).toBe(1);
    expect(compareAppVersions('1.8.874', '1.8.874-beta.2')).toBe(1);
    expect(compareAppVersions('1.8.874+build.2', '1.8.874+build.1')).toBe(0);
  });

  it('拒绝不完整或非法版本', () => {
    expect(normalizeAppVersion('v2')).toBe('0.0.0');
    expect(normalizeAppVersion('1.8.874.1')).toBe('0.0.0');
    expect(normalizeAppVersion('release-1.8.874')).toBe('0.0.0');
  });

  it('只在远端版本更新时提示', () => {
    expect(isRemoteAppVersionNewer('1.8.69', '1.8.70')).toBe(true);
    expect(isRemoteAppVersionNewer('1.8.70', '1.8.70')).toBe(false);
    expect(isRemoteAppVersionNewer('1.8.70', '1.8.69')).toBe(false);
  });

  it('解析线上版本 manifest', () => {
    expect(parseAppVersionManifest({
      name: 'JSONUtils',
      version: 'v1.8.70',
      builtAt: '2026-06-16T00:00:00.000Z',
      changelogMarkdown: '## v1.8.70 (2026-06-16) - 测试版本',
    })).toEqual({
      name: 'JSONUtils',
      version: '1.8.70',
      versionLabel: 'v1.8.70',
      builtAt: '2026-06-16T00:00:00.000Z',
      changelogMarkdown: '## v1.8.70 (2026-06-16) - 测试版本',
    });

    expect(parseAppVersionManifest({ version: '' })).toBeNull();
    expect(parseAppVersionManifest({ version: '1.8.874.1' })).toBeNull();
    expect(parseAppVersionManifest({ version: 'release-1.8.874' })).toBeNull();
    expect(parseAppVersionManifest({})).toBeNull();
  });

  it('版本 manifest 请求带时间戳避免缓存', () => {
    expect(getAppVersionManifestUrl(123)).toBe('/version.json?t=123');
  });
});
