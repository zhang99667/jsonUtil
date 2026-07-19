import { describe, expect, it } from 'vitest';
import type { JsonValue } from '../types';
import { jsonValueToTypeScriptDeclaration } from './jsonToTypeScript';

const wrapObject = (levels: number, leaf: JsonValue = 'leaf'): JsonValue => {
  let value = leaf;
  for (let level = 0; level < levels; level += 1) value = { child: value };
  return value;
};

const wrapArray = (levels: number, leaf: JsonValue = 'leaf'): JsonValue => {
  let value = leaf;
  for (let level = 0; level < levels; level += 1) value = [value];
  return value;
};

describe('jsonToTypeScript', () => {
  it('根据对象生成嵌套 TypeScript interface', () => {
    const declaration = jsonValueToTypeScriptDeclaration({
      user: {
        id: 1,
        name: 'Ada',
        'trace.id': 'trace-1',
      },
      tags: ['debug', null],
      active: true,
    });

    expect(declaration).toContain('export interface Root {');
    expect(declaration).toContain('  user: RootUser;');
    expect(declaration).toContain('  tags: (string | null)[];');
    expect(declaration).toContain('  active: boolean;');
    expect(declaration).toContain('export interface RootUser {');
    expect(declaration).toContain('  id: number;');
    expect(declaration).toContain('  name: string;');
    expect(declaration).toContain('  "trace.id": string;');
  });

  it('合并数组对象样本并把缺失字段标为可选', () => {
    const declaration = jsonValueToTypeScriptDeclaration([
      { id: 1, title: 'first' },
      { id: 2, enabled: true },
    ]);

    expect(declaration).toContain('export type Root = RootItem[];');
    expect(declaration).toContain('export interface RootItem {');
    expect(declaration).toContain('  id: number;');
    expect(declaration).toContain('  title?: string;');
    expect(declaration).toContain('  enabled?: boolean;');
  });

  it('为空数组生成 unknown 数组类型', () => {
    expect(jsonValueToTypeScriptDeclaration([])).toBe('export type Root = unknown[];');
  });

  it('支持自定义根类型名', () => {
    const declaration = jsonValueToTypeScriptDeclaration([
      { id: 1, name: 'Ada' },
    ], { rootName: 'items' });

    expect(declaration).toContain('export type Items = ItemsItem[];');
    expect(declaration).toContain('export interface ItemsItem {');
  });

  it('可输出生成可信度摘要', () => {
    const declaration = jsonValueToTypeScriptDeclaration([
      { id: 1, tags: [], value: '1' },
      { id: 2, active: true, value: 2 },
    ], { includeSummary: true });

    expect(declaration).toContain('// 生成说明: 基于数组样本 2 项推断，生成 1 个对象类型');
    expect(declaration).toContain('// 可信提示: 2 个可选字段，1 处混合类型，1 个空数组为 unknown[]');
    expect(declaration).toContain('  active?: boolean;');
    expect(declaration).toContain('  value: string | number;');
  });

  it('只在第 33 层对象或数组结构开始降级', () => {
    const objectWithinBudget = jsonValueToTypeScriptDeclaration(
      wrapObject(32),
      { includeSummary: true }
    );
    const objectOverBudget = jsonValueToTypeScriptDeclaration(
      wrapObject(33),
      { includeSummary: true }
    );
    const arrayWithinBudget = jsonValueToTypeScriptDeclaration(
      wrapArray(32),
      { includeSummary: true }
    );
    const arrayOverBudget = jsonValueToTypeScriptDeclaration(
      wrapArray(33),
      { includeSummary: true }
    );

    expect(objectWithinBudget).not.toContain('超深结构降级');
    expect(objectWithinBudget).toContain('  child: string;');
    expect(arrayWithinBudget).not.toContain('超深结构降级');
    expect(arrayWithinBudget).toContain('string[][]');
    expect(objectOverBudget).toContain('1 处超深结构降级为 unknown');
    expect(objectOverBudget).toContain('  child: unknown;');
    expect(arrayOverBudget).toContain('1 处超深结构降级为 unknown');
    expect(arrayOverBudget).not.toContain('个空数组为 unknown[]');
  });

  it('超深输入按截断分支计数且不耗尽调用栈', () => {
    const deepDeclaration = jsonValueToTypeScriptDeclaration(
      wrapObject(5000),
      { includeSummary: true }
    );

    let branchedValue: JsonValue = {
      left: { id: 1 },
      right: [1],
      leaf: 'kept',
    };
    branchedValue = wrapObject(31, branchedValue);
    const branchedDeclaration = jsonValueToTypeScriptDeclaration(
      branchedValue,
      { includeSummary: true }
    );

    expect(deepDeclaration).toContain('1 处超深结构降级为 unknown');
    expect(branchedDeclaration).toContain('2 处超深结构降级为 unknown');
    expect(branchedDeclaration).toContain('  left: unknown;');
    expect(branchedDeclaration).toContain('  right: unknown;');
    expect(branchedDeclaration).toContain('  leaf: string;');
  });

  it('深度 unknown 支配具体样本而空数组 unknown 仍可被具体样本替代', () => {
    const depthLimitedSamples = wrapArray(31, [{ id: 1 }, 'known']);
    const depthLimitedDeclaration = jsonValueToTypeScriptDeclaration(
      depthLimitedSamples,
      { includeSummary: true }
    );
    const emptyAndConcreteDeclaration = jsonValueToTypeScriptDeclaration([[], [1]]);

    expect(depthLimitedDeclaration).toContain('1 处超深结构降级为 unknown');
    expect(depthLimitedDeclaration).toContain('unknown[]');
    expect(depthLimitedDeclaration).not.toContain('string');
    expect(emptyAndConcreteDeclaration).toBe('export type Root = number[][];');
  });

  it('长数组复用代表采样并披露未参与推断的元素', () => {
    const rows = Array.from({ length: 10_000 }, (_, index) => ({
      id: index,
      score: index === 9_999 ? 'late-score' : index,
      ...(index === 9_999 ? { tailOnly: true } : {}),
    }));

    const declaration = jsonValueToTypeScriptDeclaration(rows, { includeSummary: true });

    expect(declaration).toContain('基于数组 10000 项中的 24 项抽样推断');
    expect(declaration).toContain('1 个长数组按预算抽样，共跳过 9976 个元素');
    expect(declaration).toContain('  score: string | number;');
    expect(declaration).toContain('  tailOnly?: boolean;');
  });

  it('多个长数组汇总实际跳过的元素数量', () => {
    const declaration = jsonValueToTypeScriptDeclaration({
      first: Array.from({ length: 40 }, (_, id) => ({ id })),
      second: Array.from({ length: 40 }, (_, id) => ({ id })),
    }, { includeSummary: true });

    expect(declaration).toContain('2 个长数组按预算抽样，共跳过 32 个元素');
  });
});
