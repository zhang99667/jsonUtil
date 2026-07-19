import { isRecord } from './storage';

export interface JsonArraySampleEntry<T> {
  index: number;
  item: T;
}

export interface JsonArraySampleResult<T> {
  entries: Array<JsonArraySampleEntry<T>>;
  scannedItems: number;
  sparseFieldKeys: string[];
}

const MAX_ARRAY_SAMPLE_ITEMS = 32;
const ARRAY_SAMPLE_FRONT_ITEMS = 12;
const ARRAY_SAMPLE_TAIL_ITEMS = 8;
const ARRAY_SAMPLE_MIDDLE_ITEMS = 4;
const MAX_ARRAY_SPARSE_FIELD_SCAN_ITEMS = 200;

const addArraySampleIndex = (
  indices: Set<number>,
  index: number,
  arrayLength: number
): void => {
  if (
    index < 0
    || index >= arrayLength
    || indices.has(index)
    || indices.size >= MAX_ARRAY_SAMPLE_ITEMS
  ) return;

  indices.add(index);
};

const collectRecordKeys = (value: unknown): string[] => (
  isRecord(value) ? Object.keys(value) : []
);

/** 从长数组首尾、中部和稀疏字段行中提取有代表性的固定数量样本。 */
export const getJsonArraySampleEntries = <T>(value: readonly T[]): JsonArraySampleResult<T> => {
  if (value.length <= MAX_ARRAY_SAMPLE_ITEMS) {
    return {
      entries: value.map((item, index) => ({ index, item })),
      scannedItems: value.length,
      sparseFieldKeys: [],
    };
  }

  const indices = new Set<number>();
  const sparseFieldKeys = new Set<string>();

  for (let index = 0; index < ARRAY_SAMPLE_FRONT_ITEMS; index += 1) {
    addArraySampleIndex(indices, index, value.length);
  }

  const tailStart = Math.max(value.length - ARRAY_SAMPLE_TAIL_ITEMS, 0);
  for (let index = tailStart; index < value.length; index += 1) {
    addArraySampleIndex(indices, index, value.length);
  }

  const middleStart = ARRAY_SAMPLE_FRONT_ITEMS;
  const middleEnd = Math.max(middleStart, tailStart - 1);
  const middleSpan = middleEnd - middleStart + 1;
  for (let order = 1; order <= ARRAY_SAMPLE_MIDDLE_ITEMS && middleSpan > 0; order += 1) {
    const index = middleStart + Math.floor(
      (middleSpan * order) / (ARRAY_SAMPLE_MIDDLE_ITEMS + 1)
    );
    addArraySampleIndex(indices, index, value.length);
  }

  const seenKeys = new Set<string>();
  indices.forEach(index => {
    collectRecordKeys(value[index]).forEach(key => seenKeys.add(key));
  });

  // 长数组里稀疏字段常出现在后段样本，扫描代表行可避免推断结果漏字段。
  const scanLimit = Math.min(value.length, MAX_ARRAY_SPARSE_FIELD_SCAN_ITEMS);
  for (let index = 0; index < scanLimit && indices.size < MAX_ARRAY_SAMPLE_ITEMS; index += 1) {
    const keys = collectRecordKeys(value[index]);
    const newKeys = keys.filter(key => !seenKeys.has(key));
    if (newKeys.length === 0) continue;

    addArraySampleIndex(indices, index, value.length);
    newKeys.forEach(key => sparseFieldKeys.add(key));
    keys.forEach(key => seenKeys.add(key));
  }

  return {
    entries: [...indices]
      .sort((left, right) => left - right)
      .map(index => ({ index, item: value[index] as T })),
    scannedItems: scanLimit,
    sparseFieldKeys: [...sparseFieldKeys].sort(),
  };
};
