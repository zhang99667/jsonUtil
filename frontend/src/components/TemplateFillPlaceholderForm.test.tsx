import { describe, expect, it, vi } from 'vitest';
import type { PlaceholderTemplateDetail } from '../utils/templateFillPanelModel';
import { clickElement, collectText, findByTour } from './componentElementTestHelpers';
import { TemplateFillPlaceholderForm } from './TemplateFillPlaceholderForm';

const placeholderDetails: PlaceholderTemplateDetail[] = [
  {
    value: '__UID__',
    replacement: '',
    description: '用户 ID',
    suggestion: {
      replacement: '10086',
      sourcePath: '$.user.id',
      sourceLabel: 'user.id',
      reason: '字段名匹配',
    },
    sources: [{
      sourcePath: '$.user.id',
      sourceLabel: 'user.id',
      sourceOriginalPreview: '10086',
    }],
  },
  {
    value: '__TOKEN__',
    replacement: 'old-token',
    sources: [{
      sourcePath: '$.token',
      sourceLabel: 'token',
      sourceOriginalPreview: 'old-token',
    }],
  },
];

describe('TemplateFillPlaceholderForm', () => {
  it('渲染占位符行、候选和来源信息', () => {
    const tree = TemplateFillPlaceholderForm({
      placeholderDetails,
      onReplacementChange: vi.fn(),
      onUseSuggestion: vi.fn(),
    });
    const rows = findByTour(tree, 'template-fill-placeholder-row');
    const suggestionButtons = findByTour(tree, 'template-fill-use-suggestion');

    expect(rows).toHaveLength(2);
    expect(collectText(tree)).toContain('__UID__');
    expect(collectText(tree)).toContain('用户 ID');
    expect(collectText(tree)).toContain('候选来源: user.id');
    expect(collectText(tree)).toContain('来源: token');
    expect(suggestionButtons[0].props).toMatchObject({
      disabled: false,
      title: '采用候选：$.user.id',
    });
    expect(suggestionButtons[1].props).toMatchObject({
      disabled: true,
      title: '暂无候选 replacement',
    });
  });

  it('透传 replacement 输入和采用候选回调', () => {
    const onReplacementChange = vi.fn();
    const onUseSuggestion = vi.fn();
    const tree = TemplateFillPlaceholderForm({
      placeholderDetails,
      onReplacementChange,
      onUseSuggestion,
    });
    const inputs = findByTour(tree, 'template-fill-placeholder-replacement');
    const suggestionButtons = findByTour(tree, 'template-fill-use-suggestion');

    (inputs[0].props.onChange as (event: { target: { value: string } }) => void)({
      target: { value: '10086' },
    });
    clickElement(suggestionButtons[0]);

    expect(inputs[0].props).toMatchObject({
      value: '',
      placeholder: 'replacement',
      'aria-label': '__UID__ replacement',
    });
    expect(onReplacementChange).toHaveBeenCalledWith('__UID__', '10086');
    expect(onUseSuggestion).toHaveBeenCalledWith(placeholderDetails[0]);
  });
});
