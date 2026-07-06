import { describe, expect, it } from 'vitest';
import { SchemeViewerCommandParamBadges } from './SchemeViewerCommandParamBadges';
import { collectText } from './schemeViewerElementTestHelpers';

describe('SchemeViewerCommandParamBadges', () => {
  it('渲染参数数量、前 6 个 key 和剩余数量', () => {
    const tree = SchemeViewerCommandParamBadges({
      paramCount: 8,
      paramKeys: ['url', 'from', 'skuId', 'storeId', 'fid', 'extra', 'hidden'],
    });
    const text = collectText(tree);

    expect(text).toContain('cmdParams · 8');
    expect(text).toContain('skuId');
    expect(text).toContain('extra');
    expect(text).toContain('+1');
    expect(text).not.toContain('hidden');
  });
});
