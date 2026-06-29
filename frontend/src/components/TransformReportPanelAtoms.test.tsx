import { describe, expect, it } from 'vitest';
import type { TransformReportRecord } from '../utils/transformSummary';
import {
  COMMAND_SCHEMA_ROW_DISPLAY_LIMIT,
  formatDecodedPathCount,
} from './TransformReportPanelAtoms';

const buildRecord = (
  decodedPathCount: number,
  isDecodedPathCountTruncated: boolean
): TransformReportRecord => ({
  decodedPathCount,
  isDecodedPathCountTruncated,
} as TransformReportRecord);

describe('TransformReportPanelAtoms', () => {
  it('保持 CMD Schema 行展示上限稳定', () => {
    expect(COMMAND_SCHEMA_ROW_DISPLAY_LIMIT).toBe(8);
  });

  it('格式化内部路径总数和截断态', () => {
    expect(formatDecodedPathCount(buildRecord(12, false))).toBe('12');
    expect(formatDecodedPathCount(buildRecord(12, true))).toBe('12+');
  });
});
