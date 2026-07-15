import { describe, expect, it } from 'vitest';
import { resolveAvailableListQuery } from './listQuery';

describe('resolveAvailableListQuery', () => {
  it('当前页仍有数据时保留原查询', () => {
    const query = { page: 2, pageSize: 10, keyword: '当前条件' };

    expect(resolveAvailableListQuery(query, 11)).toBe(query);
  });

  it('删除末页最后一项后回退并保留其他查询条件', () => {
    expect(resolveAvailableListQuery({
      page: 3,
      pageSize: 10,
      keyword: '最新条件',
    }, 20)).toEqual({
      page: 2,
      pageSize: 10,
      keyword: '最新条件',
    });
  });

  it('空列表统一回到第一页', () => {
    expect(resolveAvailableListQuery({
      page: 4,
      pageSize: 20,
      keyword: '',
    }, 0).page).toBe(1);
  });

  it('并发删除持续缩小总数时页码单调收敛', () => {
    const totals = [25, 15, 5];
    const pages = totals.reduce<number[]>((resolvedPages, total) => {
      const previousPage = resolvedPages.at(-1) ?? 3;
      const resolved = resolveAvailableListQuery({
        page: previousPage,
        pageSize: 10,
        keyword: '持续变化',
      }, total);
      return [...resolvedPages, resolved.page];
    }, []);

    expect(pages).toEqual([3, 2, 1]);
  });
});
