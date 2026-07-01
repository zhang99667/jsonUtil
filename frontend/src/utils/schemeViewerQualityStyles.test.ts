import { describe, expect, it } from 'vitest';
import {
  getSchemeQualityClassName,
  getSchemeQualityItemClassName,
} from './schemeViewerQualityStyles';

describe('schemeViewerQualityStyles', () => {
  it('映射质量摘要状态样式', () => {
    expect(getSchemeQualityClassName('success')).toContain('emerald');
    expect(getSchemeQualityClassName('warning')).toContain('amber');
    expect(getSchemeQualityClassName('error')).toContain('red');
    expect(getSchemeQualityClassName('info')).toContain('cyan');
  });

  it('映射质量指标徽标样式并提供默认态', () => {
    expect(getSchemeQualityItemClassName('success')).toContain('emerald');
    expect(getSchemeQualityItemClassName('warning')).toContain('amber');
    expect(getSchemeQualityItemClassName('cyan')).toContain('cyan');
    expect(getSchemeQualityItemClassName()).toContain('editor-bg');
  });
});
