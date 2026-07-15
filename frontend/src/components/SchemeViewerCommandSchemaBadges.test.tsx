import { describe, expect, it } from 'vitest';
import { SchemeViewerCommandSchemaBadges } from './SchemeViewerCommandSchemaBadges';
import { collectText, findByTourOrNull } from './schemeViewerElementTestHelpers';

describe('SchemeViewerCommandSchemaBadges', () => {
  it('渲染主 Schema、Schema 数量和 Top Schema', () => {
    const tree = SchemeViewerCommandSchemaBadges({
      commandSchema: 'sampleapp://v7/vendor/ad/prerender',
      commandSchemaCount: 2,
      topCommandSchemas: [{
        schema: 'sampleapp://v7/vendor/ad/prerender',
        count: 2,
        paths: ['$', '$.nested'],
        hasMorePaths: false,
      }],
    });
    const text = collectText(tree);

    expect(findByTourOrNull(tree, 'scheme-command-schema-count')).toBeTruthy();
    expect(findByTourOrNull(tree, 'scheme-top-command-schemas')).toBeTruthy();
    expect(text).toContain('cmdSchema=sampleapp://v7/vendor/ad/prerender');
    expect(text).toContain('Schema · 2');
    expect(text).toContain('sampleapp://v7/vendor/ad/prerender ×2');
  });

  it('截断过长 Top Schema 展示', () => {
    const longSchema = `sampleapp://v7/${'x'.repeat(80)}`;
    const tree = SchemeViewerCommandSchemaBadges({
      commandSchema: undefined,
      commandSchemaCount: 1,
      topCommandSchemas: [{
        schema: longSchema,
        count: 1,
        paths: ['$'],
        hasMorePaths: true,
      }],
    });

    expect(collectText(tree)).toContain(`${longSchema.slice(0, 42)}... ×1`);
  });
});
