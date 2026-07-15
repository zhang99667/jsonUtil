import { describe, expect, it } from 'vitest';
import type { SchemeCommandSummaryInfo } from '../utils/schemeMetadata';
import { SchemeViewerCommandInsightBadges } from './SchemeViewerCommandInsightBadges';
import { SchemeViewerCommandParamBadges } from './SchemeViewerCommandParamBadges';
import { SchemeViewerCommandSchemaBadges } from './SchemeViewerCommandSchemaBadges';
import { SchemeViewerCommandSummaryPanel } from './SchemeViewerCommandSummaryPanel';
import {
  collectText,
  findByTourOrNull,
  findByTypeOrNull,
} from './schemeViewerElementTestHelpers';

const buildCommandSummary = (
  overrides: Partial<SchemeCommandSummaryInfo> = {}
): SchemeCommandSummaryInfo => ({
  commandSchema: 'sampleapp://v7/vendor/ad/prerender',
  paramCount: 8,
  paramKeys: ['url', 'from', 'skuId', 'storeId', 'fid', 'extra', 'hidden'],
  commandSchemaCount: 2,
  topCommandSchemas: [
    {
      schema: 'sampleapp://v7/vendor/ad/prerender',
      count: 2,
      paths: ['$', '$.nested'],
      hasMorePaths: false,
    },
  ],
  commandFields: ['cmd', 'panel_scheme', 'button_cmd', 'feed_cmd', 'hidden_cmd'],
  commandFieldRows: [],
  commandFieldCount: 5,
  resourceFields: [],
  resourceFieldRows: [],
  resourceFieldCount: 0,
  extFields: ['ext_info'],
  extFieldCount: 1,
  base64SuffixFields: ['os', 'ip'],
  base64SuffixFieldCount: 2,
  ...overrides,
});

describe('SchemeViewerCommandSummaryPanel', () => {
  it('没有 CMD 摘要时不渲染', () => {
    expect(SchemeViewerCommandSummaryPanel({ commandSummaryInfo: null })).toBeNull();
  });

  it('渲染 CMD Schema、Top Schema、参数和嵌套线索', () => {
    const commandSummaryInfo = buildCommandSummary();
    const tree = SchemeViewerCommandSummaryPanel({
      commandSummaryInfo,
    });
    const text = collectText(tree);

    expect(findByTourOrNull(tree, 'scheme-command-summary')).toBeTruthy();
    expect(text).toContain('CMD 结构');
    expect(findByTypeOrNull(tree, SchemeViewerCommandSchemaBadges)?.props).toMatchObject({
      commandSchema: commandSummaryInfo.commandSchema,
      commandSchemaCount: commandSummaryInfo.commandSchemaCount,
      topCommandSchemas: commandSummaryInfo.topCommandSchemas,
    });
    expect(findByTypeOrNull(tree, SchemeViewerCommandParamBadges)?.props).toMatchObject({
      paramCount: commandSummaryInfo.paramCount,
      paramKeys: commandSummaryInfo.paramKeys,
    });
    expect(findByTypeOrNull(tree, SchemeViewerCommandInsightBadges)?.props).toMatchObject({
      commandFields: commandSummaryInfo.commandFields,
      extFields: commandSummaryInfo.extFields,
      base64SuffixFields: commandSummaryInfo.base64SuffixFields,
    });
  });

});
