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
});
