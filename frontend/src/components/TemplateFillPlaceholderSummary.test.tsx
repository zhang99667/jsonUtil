import { describe, expect, it } from 'vitest';
import { collectText, findByTour } from './componentElementTestHelpers';
import { TemplateFillPlaceholderSummary } from './TemplateFillPlaceholderSummary';

describe('TemplateFillPlaceholderSummary', () => {
  it('渲染 replacement、候选和待补摘要', () => {
    const tree = TemplateFillPlaceholderSummary({
      summary: {
        total: 5,
        filled: 2,
        pending: 3,
        suggested: 1,
      },
    });

    expect(findByTour(tree, 'template-fill-placeholder-summary')).toHaveLength(1);
    expect(collectText(tree)).toContain('回填模板: replacement 2/5');
    expect(collectText(tree)).toContain('候选 1');
    expect(collectText(tree)).toContain('待补 3');
  });

  it('无候选和待补时只展示 replacement 摘要', () => {
    const tree = TemplateFillPlaceholderSummary({
      summary: {
        total: 2,
        filled: 2,
        pending: 0,
        suggested: 0,
      },
    });

    expect(collectText(tree)).toBe('回填模板: replacement 2/2');
  });
});
