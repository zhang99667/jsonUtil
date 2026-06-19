import { describe, expect, it } from 'vitest';
import { formatChangelogText, parseChangelog } from './changelog';

describe('changelog', () => {
  const markdown = `# 更新日志
## v1.8.200 (2026-06-19) - 前端版本更新日志
### ✨ 新特性
- **版本入口**: 状态栏版本号可打开 \`CHANGELOG\`
- **更新提示**: 新版本 Toast 支持查看远端更新说明

## v1.8.199 (2026-06-19) - Schema AllOf 根约束示例
### ✨ 新特性
- **JSON Schema 示例**: 合并根约束
`;

  it('按版本标题解析最近更新内容', () => {
    expect(parseChangelog(markdown, 1)).toEqual([
      {
        version: '1.8.200',
        versionLabel: 'v1.8.200',
        date: '2026-06-19',
        title: '前端版本更新日志',
        sections: [
          {
            title: '✨ 新特性',
            items: [
              '版本入口: 状态栏版本号可打开 CHANGELOG',
              '更新提示: 新版本 Toast 支持查看远端更新说明',
            ],
          },
        ],
      },
    ]);
  });

  it('清理常见行内 Markdown 标记用于前端展示', () => {
    expect(formatChangelogText('**JSON Schema**: 支持 `allOf`')).toBe('JSON Schema: 支持 allOf');
  });
});
