import { describe, expect, it, vi } from 'vitest';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { TemplateFillQualityDeltaPanel } from './TemplateFillQualityDeltaPanel';

describe('TemplateFillQualityDeltaPanel', () => {
  it('渲染质量变化内容并透传复制按钮', () => {
    const onCopy = vi.fn();
    const tree = TemplateFillQualityDeltaPanel({
      qualityDelta: '质量变化: +1',
      onCopy,
    });
    const buttons = findByTour(tree, 'template-fill-copy-quality-delta');

    expect(findByTour(tree, 'template-fill-quality-delta')).toHaveLength(1);
    expect(collectText(tree)).toContain('最近回填质量变化');
    expect(collectText(tree)).toContain('质量变化: +1');
    expect(buttons[0].props).toMatchObject({
      title: '复制最近回填质量变化',
      'aria-label': '复制质量对比，复制最近回填质量变化',
    });

    clickElement(buttons[0]);

    expect(onCopy).toHaveBeenCalledTimes(1);
  });
});
