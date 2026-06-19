import { describe, expect, it } from 'vitest';
import { TransformMode } from '../types';
import { getSmartInputSuggestion, getSmartSuggestionMode } from './smartInputSuggestion';

describe('getSmartInputSuggestion', () => {
  it('为空输入不展示建议', () => {
    expect(getSmartInputSuggestion('   ')).toBeNull();
  });

  it('合法 JSON 内含业务 Scheme 时推荐嵌套解析', () => {
    const scheme = 'baiduboxapp://v7/vendor/ad/makePhoneCall?params=%7B%22phone%22%3A%2213718164578%22%7D';
    const suggestion = getSmartInputSuggestion(JSON.stringify({
      data: {
        action_cmd: scheme,
      },
    }));

    expect(suggestion).toMatchObject({
      id: 'json-with-cmd',
      actions: [
        { id: 'response-inspection', label: '排查工作流' },
        { id: 'deep-format-report' },
      ],
    });
    expect(getSmartSuggestionMode('response-inspection')).toBe(TransformMode.DEEP_FORMAT);
  });

  it('独立业务 Scheme 推荐打开 Scheme 面板', () => {
    const suggestion = getSmartInputSuggestion(
      'baiduboxapp://v7/vendor/ad/makePhoneCall?params=%7B%22phone%22%3A%2213718164578%22%7D'
    );

    expect(suggestion).toMatchObject({
      id: 'standalone-scheme',
      actions: [
        { id: 'scheme-panel' },
        { id: 'deep-format-report' },
      ],
    });
  });

  it('普通 HTTPS URL 不误报成 Scheme', () => {
    const suggestion = getSmartInputSuggestion('https://example.com/docs?a=1&b=2');

    expect(suggestion).toMatchObject({
      id: 'plain-url',
      actions: [
        { id: 'url-decode' },
      ],
    });
  });

  it('JSON 中的普通 HTTPS 字段不误报为 CMD/Scheme', () => {
    const suggestion = getSmartInputSuggestion(JSON.stringify({
      url: 'https://example.com/docs?a=1&b=2',
    }));

    expect(suggestion?.id).toBe('json-modeling');
  });

  it('可解码 HTTP URL 参数仍推荐 Scheme 面板', () => {
    const nested = encodeURIComponent('baiduboxapp://v1/open?url=https%3A%2F%2Fexample.com');
    const suggestion = getSmartInputSuggestion(`https://example.com/landing?scheme=${nested}`);

    expect(suggestion).toMatchObject({
      id: 'standalone-scheme'
    });
    expect(suggestion?.actions[0]).toMatchObject({ id: 'scheme-panel' });
  });

  it('无效 JSON 容器推荐智能修复', () => {
    const suggestion = getSmartInputSuggestion('{items:[1,2], ok:}');

    expect(suggestion).toMatchObject({
      id: 'malformed-json',
      actions: [
        { id: 'ai-fix' },
      ],
    });
  });

  it('超大 JSON 候选跳过同步解析时推荐结构导航', () => {
    const largeJson = `{"items":[${Array.from({ length: 120_000 }, () => '0').join(',')}]}`;
    const suggestion = getSmartInputSuggestion(largeJson);

    expect(suggestion).toMatchObject({
      id: 'large-json',
      actions: [
        { id: 'structure-nav' },
        { id: 'schema-panel' },
      ],
    });
  });

  it('复杂 JSON 推荐结构导航', () => {
    const suggestion = getSmartInputSuggestion(JSON.stringify({
      users: Array.from({ length: 6 }, (_, index) => ({
        id: index,
        profile: {
          name: `user-${index}`,
          meta: {
            score: index * 10,
          },
        },
      })),
      paging: {
        total: 6,
      },
    }));

    expect(suggestion).toMatchObject({
      id: 'json-structure',
      actions: [
        { id: 'structure-nav' },
        { id: 'schema-panel' },
      ],
    });
  });

  it('简单 JSON 推荐类型或 Schema 生成', () => {
    const suggestion = getSmartInputSuggestion('{"id":1,"name":"Ada"}');

    expect(suggestion).toMatchObject({
      id: 'json-modeling',
      actions: [
        { id: 'json-to-typescript' },
        { id: 'schema-panel' },
      ],
    });
  });
});
