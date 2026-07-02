import { describe, expect, it } from 'vitest';
import { SchemeViewerCommandInsightBadges } from './SchemeViewerCommandInsightBadges';
import { collectText } from './schemeViewerElementTestHelpers';

describe('SchemeViewerCommandInsightBadges', () => {
  it('渲染 cmd、ext 和 Base64 后缀线索', () => {
    const tree = SchemeViewerCommandInsightBadges({
      commandFields: ['cmd', 'panel_scheme', 'button_cmd', 'feed_cmd', 'hidden_cmd'],
      extFields: ['ext_info'],
      base64SuffixFields: ['os', 'ip'],
    });
    const text = collectText(tree);

    expect(text).toContain('cmd解析: cmd, panel_scheme, button_cmd, feed_cmd +1');
    expect(text).toContain('ext解析: ext_info');
    expect(text).toContain('Base64 后缀: os, ip');
  });

  it('空线索不渲染', () => {
    expect(SchemeViewerCommandInsightBadges({
      commandFields: [],
      extFields: [],
      base64SuffixFields: [],
    })).toBeNull();
  });
});
