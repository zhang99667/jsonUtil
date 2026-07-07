import { describe, expect, it } from 'vitest';
import { collectText, findByTour } from './componentElementTestHelpers';
import { TemplateFillStatusAlerts } from './TemplateFillStatusAlerts';

describe('TemplateFillStatusAlerts', () => {
  it('有模板内容且模板非法时展示模板错误', () => {
    const tree = TemplateFillStatusAlerts({
      hasTemplateContent: true,
      templateError: 'Unexpected token',
    });

    expect(findByTour(tree, 'template-fill-validation-error')).toHaveLength(1);
    expect(collectText(tree)).toContain('Unexpected token');
  });

  it('空模板不展示模板错误但保留 SOURCE 错误', () => {
    const tree = TemplateFillStatusAlerts({
      hasTemplateContent: false,
      templateError: 'Unexpected token',
      targetError: 'SOURCE 不是合法 JSON',
    });

    expect(findByTour(tree, 'template-fill-validation-error')).toHaveLength(0);
    expect(findByTour(tree, 'template-fill-target-error')).toHaveLength(1);
    expect(collectText(tree)).toContain('SOURCE 不是合法 JSON');
  });
});
