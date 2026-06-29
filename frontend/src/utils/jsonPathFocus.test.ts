import { describe, expect, it } from 'vitest';
import {
  buildFocusedJsonValue,
  getJsonPathLeafKey,
  getJsonValueBySegments,
  parseGeneratedJsonPath,
} from './jsonPathFocus';

describe('jsonPathFocus', () => {
  it('解析工具生成的 dot、数组下标和 bracket 字符串路径', () => {
    expect(parseGeneratedJsonPath('$.video[0]["trace.id"].url')).toEqual([
      'video',
      0,
      'trace.id',
      'url',
    ]);
    expect(parseGeneratedJsonPath('$.')).toBeNull();
    expect(parseGeneratedJsonPath('$["bad"')).toBeNull();
    expect(parseGeneratedJsonPath('video[0]')).toBeNull();
  });

  it('按解析后的路径读取 JSON 值并获取叶子 key', () => {
    const value = {
      video: [
        {
          'trace.id': {
            url: 'https://example.com',
          },
        },
      ],
    };

    expect(getJsonValueBySegments(value, ['video', 0, 'trace.id', 'url'])).toBe('https://example.com');
    expect(getJsonValueBySegments(value, ['video', '0'])).toBeUndefined();
    expect(getJsonPathLeafKey('$.video[0]["trace.id"].url')).toBe('url');
    expect(getJsonPathLeafKey('$[0]')).toBe('$[0]');
  });

  it('按 basePath 和命中路径构建聚焦 JSON 子树', () => {
    const decodedValue = {
      video_info: {
        tail_frame: {
          panel_scheme: {
            panel_cmd: {
              params: {
                appUrl: {
                  params: {
                    category: 'jump',
                    url: 'https://example.com',
                  },
                },
              },
            },
          },
          bottom_button_scheme: {
            task_id: '602',
          },
        },
      },
      reward: {
        stay_cmd: {
          convert_btn: {
            button_cmd: '__CONVERT_CMD__',
          },
          convert_cmd: {
            params: {
              appUrl: {
                params: {
                  category: 'jump',
                  url: 'https://shop.example.com',
                },
              },
            },
          },
        },
      },
    };

    expect(buildFocusedJsonValue(decodedValue, '$.scheme', [
      '$.scheme.video_info.tail_frame.panel_scheme.panel_cmd.params.appUrl.params.category',
      '$.scheme.reward.stay_cmd.convert_cmd.params.appUrl.params.category',
    ])).toEqual({
      video_info: {
        tail_frame: {
          panel_scheme: {
            panel_cmd: {
              params: {
                appUrl: {
                  params: {
                    category: 'jump',
                  },
                },
              },
            },
          },
        },
      },
      reward: {
        stay_cmd: {
          convert_cmd: {
            params: {
              appUrl: {
                params: {
                  category: 'jump',
                },
              },
            },
          },
        },
      },
    });
  });

  it('忽略不属于 basePath 或无法命中的路径', () => {
    expect(buildFocusedJsonValue({ a: 1 }, '$.scheme', [
      '$.other.a',
      '$.scheme.missing',
      'bad.path',
    ])).toBeNull();
  });
});
