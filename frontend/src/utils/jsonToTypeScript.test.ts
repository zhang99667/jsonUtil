import { describe, expect, it } from 'vitest';
import { jsonValueToTypeScriptDeclaration } from './jsonToTypeScript';

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
});
