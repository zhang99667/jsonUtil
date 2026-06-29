import { describe, expect, it } from 'vitest';
import {
  getCoverageClassName,
  getFooterActionClassName,
  getNextActionClassName,
  type ReportFooterActionTone,
  type ReportNextActionTone,
} from './transformReportPanelStyles';

describe('transformReportPanelStyles', () => {
  it('按覆盖率等级生成摘要样式', () => {
    expect(getCoverageClassName('success')).toContain('border-emerald-700/50');
    expect(getCoverageClassName('info')).toContain('border-sky-700/50');
    expect(getCoverageClassName('warning')).toContain('border-amber-700/50');
  });

  it('按下一步行动 tone 生成按钮样式', () => {
    const toneExpectations: Array<[ReportNextActionTone, string]> = [
      ['primary', 'border-teal-700/70'],
      ['purple', 'border-violet-700/70'],
      ['rose', 'border-rose-700/70'],
      ['cyan', 'border-cyan-800/70'],
    ];

    for (const [tone, expectedClassName] of toneExpectations) {
      const className = getNextActionClassName(tone);
      expect(className).toContain('disabled:cursor-not-allowed');
      expect(className).toContain(expectedClassName);
    }
  });

  it('按 footer 操作 tone 生成紧凑按钮样式', () => {
    const toneExpectations: Array<[ReportFooterActionTone, string]> = [
      ['cyan', 'bg-cyan-900/40'],
      ['neutral', 'text-gray-200'],
      ['muted', 'text-gray-300'],
      ['success', 'bg-emerald-900/40'],
    ];

    for (const [tone, expectedClassName] of toneExpectations) {
      const className = getFooterActionClassName(tone);
      expect(className).toContain('whitespace-nowrap');
      expect(className).toContain(expectedClassName);
    }
  });
});
