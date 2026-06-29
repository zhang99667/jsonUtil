import { describe, expect, it } from 'vitest';
import {
  appendCommandSchemaOriginSummarySection,
  appendCommandSchemaSummarySection,
  appendNestedCommandFieldSummarySection,
  appendNestedResourceFieldSummarySection,
  appendResourceSchemaSummarySection,
  appendResourceTypeSummarySection,
  formatResourceSchemaGroupTitle,
} from './transformReportTextDistributionSections';

describe('transformReportTextDistributionSections', () => {
  it('追加 schema、资源和字段分布摘要段落', () => {
    const lines: string[] = [];

    appendCommandSchemaOriginSummarySection(lines, [{
      origin: 'baiduboxapp://feed',
      count: 2,
      schemaCount: 2,
      recordCount: 1,
      schemas: ['baiduboxapp://feed/detail'],
      hasMoreSchemas: true,
    }]);
    appendCommandSchemaSummarySection(lines, [{
      schema: 'baiduboxapp://feed/detail',
      count: 2,
      recordCount: 1,
      paths: ['$.cmd'],
      hasMorePaths: true,
    }]);
    appendResourceTypeSummarySection(lines, [{
      resourceType: 'image',
      resourceTypeLabel: '图片',
      query: '资源类型:图片',
      count: 3,
      percentage: 75,
      recordCount: 2,
      schemaCount: 2,
      schemas: ['https://cdn.example.com/a.png'],
      hasMoreSchemas: true,
    }]);
    appendResourceSchemaSummarySection(lines, [{
      schema: 'https://cdn.example.com/a.png',
      count: 3,
      recordCount: 2,
      paths: ['$.image'],
      hasMorePaths: true,
      resourceType: 'image',
      resourceTypeLabel: '图片',
    }]);
    appendNestedCommandFieldSummarySection(lines, [{
      key: 'panel_scheme',
      count: 1,
      recordCount: 1,
      paths: ['$.panel'],
      hasMorePaths: false,
    }]);
    appendNestedResourceFieldSummarySection(lines, [{
      key: 'image_url',
      count: 1,
      recordCount: 1,
      paths: ['$.image_url'],
      hasMorePaths: false,
    }]);

    expect(lines).toEqual([
      'CMD 来源分布:',
      '- baiduboxapp://feed ×2（Schema 2 / 来源记录 1）',
      '  示例Schema: baiduboxapp://feed/detail；...',
      '',
      'CMD Schema 分布:',
      '- baiduboxapp://feed/detail ×2（来源记录 1）',
      '  示例路径: $.cmd；...',
      '',
      '静态资源类型分布:',
      '- 图片 75% ×3（URL 2 / 来源记录 2）',
      '  示例URL: https://cdn.example.com/a.png；...',
      '',
      '静态资源 URL 分布:',
      '- [图片] https://cdn.example.com/a.png ×3（来源记录 2）',
      '  示例路径: $.image；...',
      '',
      '内部CMD字段分布:',
      '- panel_scheme ×1（来源记录 1）',
      '  示例路径: $.panel',
      '',
      '静态资源字段分布:',
      '- image_url ×1（来源记录 1）',
      '  示例路径: $.image_url',
      '',
    ]);
  });

  it('空分布不追加内容，并支持无资源类型标题', () => {
    const lines = ['head'];

    appendCommandSchemaSummarySection(lines, []);

    expect(lines).toEqual(['head']);
    expect(formatResourceSchemaGroupTitle({
      schema: 'https://cdn.example.com/raw.bin',
      count: 1,
      recordCount: 1,
      paths: ['$.raw'],
      hasMorePaths: false,
    })).toBe('https://cdn.example.com/raw.bin');
  });
});
