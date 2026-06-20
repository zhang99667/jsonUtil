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
        { id: 'structure-nav' },
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

  it('合法 JSON Lines 推荐结构导航和类型生成', () => {
    const suggestion = getSmartInputSuggestion('{"level":"info","user":{"id":1}}\n{"level":"error","user":{"id":2}}');

    expect(suggestion).toMatchObject({
      id: 'json-lines-structure',
      title: '检测到 JSON Lines / NDJSON',
      actions: [
        { id: 'structure-nav' },
        { id: 'json-to-typescript' },
        { id: 'deep-format-report' },
      ],
    });
    expect(suggestion?.actions.some(action => action.id === 'ai-fix')).toBe(false);
  });

  it('JSON Lines 内含业务 Scheme 时推荐排查工作流', () => {
    const scheme = 'baiduboxapp://v7/vendor/ad/makePhoneCall?params=%7B%22phone%22%3A%2213718164578%22%7D';
    const suggestion = getSmartInputSuggestion([
      JSON.stringify({ level: 'info', action_cmd: scheme }),
      JSON.stringify({ level: 'debug', id: 2 }),
    ].join('\n'));

    expect(suggestion).toMatchObject({
      id: 'json-lines-with-cmd',
      actions: [
        { id: 'response-inspection' },
        { id: 'deep-format-report' },
        { id: 'structure-nav' },
      ],
    });
  });

  it('部分 JSON Lines 行损坏时提示首个失败行', () => {
    const suggestion = getSmartInputSuggestion('{"ok":1}\n{"broken":}\n{"ok":3}');

    expect(suggestion).toMatchObject({
      id: 'malformed-json-lines',
      title: 'JSON Lines 第 2 行可能有语法错误',
      actions: [
        { id: 'ai-fix' },
      ],
    });
    expect(suggestion?.description).toContain('JSON Lines 第 2 行解析错误');
  });

  it('无效多行普通 JSON 仍按 JSON 修复提示处理', () => {
    const suggestion = getSmartInputSuggestion('{\n  "items": [1, 2],\n  "ok":\n}');

    expect(suggestion).toMatchObject({
      id: 'malformed-json',
      actions: [
        { id: 'ai-fix' },
      ],
    });
  });

  it('超大 JSON Lines 候选跳过同步解析时不推荐 Schema', () => {
    const largeJsonLines = Array.from({ length: 18_000 }, (_, index) => (
      JSON.stringify({ id: index, level: index % 2 === 0 ? 'info' : 'error' })
    )).join('\n');
    const suggestion = getSmartInputSuggestion(largeJsonLines);

    expect(suggestion).toMatchObject({
      id: 'large-json-lines',
      actions: [
        { id: 'structure-nav' },
        { id: 'deep-format-report' },
      ],
    });
    expect(suggestion?.actions.some(action => action.id === 'schema-panel')).toBe(false);
  });

  it('超大 JSON 候选跳过同步解析时推荐结构导航', () => {
    const largeJson = `{"items":[${Array.from({ length: 120_000 }, () => '0').join(',')}]}`;
    const suggestion = getSmartInputSuggestion(largeJson);

    expect(suggestion).toMatchObject({
      id: 'large-json',
      actions: [
        { id: 'structure-nav' },
        { id: 'schema-panel' },
        { id: 'deep-format-report' },
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
        { id: 'json-to-typescript' },
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
        { id: 'structure-nav' },
      ],
    });
  });
});
