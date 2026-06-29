import { describe, expect, it } from 'vitest';
import {
  createVersionManifest,
  createVersionManifestAssetSource,
  extractRecentChangelogMarkdown,
} from './versionManifest';

describe('versionManifest', () => {
  const markdown = `# 更新日志
## v1.8.254 (2026-06-20) - JSON Lines 多样本 Schema
### ✨ 新特性
- **JSON Lines Schema 生成**: 支持多样本

## v1.8.253 (2026-06-20) - 本地隐私状态
### ✨ 新特性
- **本地隐私状态**: 明确本地处理

## v1.8.252 (2026-06-20) - 结构语义 ID 线索
### ✨ 新特性
- **更多语义预览**: 新增 UUID
`;

  it('按版本条目截取构建注入所需的最近 CHANGELOG', () => {
    expect(extractRecentChangelogMarkdown(markdown, 2)).toBe(`## v1.8.254 (2026-06-20) - JSON Lines 多样本 Schema
### ✨ 新特性
- **JSON Lines Schema 生成**: 支持多样本

## v1.8.253 (2026-06-20) - 本地隐私状态
### ✨ 新特性
- **本地隐私状态**: 明确本地处理`);
  });

  it('生成前端版本 manifest，供打开状态下更新检查使用', () => {
    expect(createVersionManifest({
      version: '1.8.254',
      changelogMarkdown: markdown,
      builtAt: '2026-06-20T00:00:00.000Z',
      changelogLimit: 1,
    })).toEqual({
      name: 'JSONUtils',
      version: '1.8.254',
      versionLabel: 'v1.8.254',
      builtAt: '2026-06-20T00:00:00.000Z',
      changelogMarkdown: `## v1.8.254 (2026-06-20) - JSON Lines 多样本 Schema
### ✨ 新特性
- **JSON Lines Schema 生成**: 支持多样本`,
    });
  });

  it('生成确定性的 version.json asset 内容，方便构建插件复用', () => {
    expect(JSON.parse(createVersionManifestAssetSource({
      version: '1.8.254',
      changelogMarkdown: markdown,
      getBuiltAt: () => '2026-06-20T00:00:00.000Z',
      changelogLimit: 1,
    }))).toMatchObject({
      name: 'JSONUtils',
      version: '1.8.254',
      versionLabel: 'v1.8.254',
      builtAt: '2026-06-20T00:00:00.000Z',
    });
  });
});
