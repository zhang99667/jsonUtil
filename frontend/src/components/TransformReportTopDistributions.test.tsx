import { describe, expect, it, vi } from 'vitest';
import type { TransformContextReport } from '../utils/transformSummary';
import { collectText, isElementLike, type ElementLike } from './componentElementTestHelpers';
import { TransformReportTopDistributions } from './TransformReportTopDistributions';

const findButtons = (node: unknown): ElementLike[] => {
  if (Array.isArray(node)) return node.flatMap(findButtons);
  if (!isElementLike(node)) return [];

  const matches = node.props.type === 'button' ? [node] : [];
  return matches.concat(findButtons(node.props.children));
};

describe('TransformReportTopDistributions', () => {
  it('渲染各类 Top 分布并转发筛选动作', () => {
    const onFilter = vi.fn();
    const report = {
      topCommandSchemaOrigins: [{
        origin: 'baiduboxapp',
        count: 2,
        schemaCount: 1,
        recordCount: 2,
        schemas: ['baiduboxapp://v1/open'],
        hasMoreSchemas: false,
      }],
      topCommandSchemas: [{
        schema: 'baiduboxapp://v1/open',
        count: 2,
        recordCount: 2,
        paths: ['$.cmd'],
        hasMorePaths: false,
      }],
      topResourceTypes: [{
        resourceType: 'image',
        resourceTypeLabel: '图片',
        query: '资源类型:图片',
        percentage: 60,
        count: 3,
        schemaCount: 2,
        recordCount: 3,
        schemas: ['https://example.com/a.png'],
        hasMoreSchemas: false,
      }],
      topResourceSchemas: [{
        schema: 'https://example.com/a.png',
        resourceTypeLabel: '图片',
        count: 3,
        recordCount: 3,
        paths: ['$.img'],
        hasMorePaths: false,
      }],
      topNestedCommandFields: [{
        key: 'jump_url',
        count: 1,
        recordCount: 1,
        paths: ['$.nested.jump_url'],
        hasMorePaths: false,
      }],
      topNestedResourceFields: [{
        key: 'image_url',
        count: 1,
        recordCount: 1,
        paths: ['$.image_url'],
        hasMorePaths: false,
      }],
    } as TransformContextReport;

    const tree = TransformReportTopDistributions({ report, onFilter });
    const text = collectText(tree);
    expect(text).toContain('CMD 来源分布');
    expect(text).toContain('静态资源 URL 分布');

    const buttons = findButtons(tree);
    expect(buttons).toHaveLength(6);
    (buttons[0].props.onClick as () => void)();
    (buttons[2].props.onClick as () => void)();
    expect(onFilter).toHaveBeenNthCalledWith(1, 'baiduboxapp');
    expect(onFilter).toHaveBeenNthCalledWith(2, '资源类型:图片');
  });
});
