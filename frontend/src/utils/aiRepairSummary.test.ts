import { describe, expect, it } from 'vitest';
import { buildAiRepairSummary, formatAiRepairSummary } from './aiRepairSummary';

describe('buildAiRepairSummary', () => {
  it('内容一致时返回无差异摘要', () => {
    const summary = buildAiRepairSummary('{"ok":true}', '{"ok":true}');

    expect(summary.changed).toBe(false);
    expect(summary.changedChunks).toBe(0);
    expect(summary.rootDescription).toBe('对象 1 个键');
  });

  it('统计字符级新增、删除和变更块', () => {
    const summary = buildAiRepairSummary('abc', 'adc');

    expect(summary.changed).toBe(true);
    expect(summary.changedChunks).toBe(1);
    expect(summary.addedChars).toBe(1);
    expect(summary.removedChars).toBe(1);
    expect(summary.previewItems).toEqual([
      { type: 'delete', text: 'b', length: 1 },
      { type: 'add', text: 'd', length: 1 },
    ]);
  });

  it('识别修复后 JSON 根结构', () => {
    const summary = buildAiRepairSummary('{items:[1,2]}', '{"items":[1,2],"ok":true}');

    expect(summary.rootDescription).toBe('对象 2 个键');
    expect(formatAiRepairSummary(summary)).toContain('结构: 对象 2 个键');
  });

  it('大内容跳过字符级预览，避免主线程过重计算', () => {
    const largeBefore = 'a'.repeat(120_000);
    const largeAfter = `{"value":"${'b'.repeat(120_000)}"}`;
    const summary = buildAiRepairSummary(largeBefore, largeAfter);

    expect(summary.changed).toBe(true);
    expect(summary.isDiffSkipped).toBe(true);
    expect(summary.previewItems).toEqual([]);
  });
});
