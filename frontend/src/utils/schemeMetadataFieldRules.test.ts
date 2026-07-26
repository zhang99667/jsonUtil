import { describe, expect, it } from 'vitest';
import {
  getPrimaryCommandFieldPriority,
  isCmdInsightField,
  isCommandInsightField,
  isExtInsightField,
  isResourceInsightField,
  isUrlInsightField,
} from './schemeMetadataFieldRules';

describe('schemeMetadataFieldRules', () => {
  it('识别 CMD 精确字段并忽略首尾空白和大小写', () => {
    expect(isCmdInsightField(' cmd ')).toBe(true);
    expect(isCmdInsightField('ACTIONCOMMAND')).toBe(true);
    expect(isCmdInsightField('Panel_Scheme')).toBe(true);
    expect(isCmdInsightField('command_name')).toBe(false);
  });

  it.each([
    'custom_cmd',
    'customcmd',
    'custom_scheme',
    'customscheme',
  ])('识别 CMD 后缀字段 %s', key => {
    expect(isCmdInsightField(key)).toBe(true);
  });

  it('识别 URL 精确字段、驼峰字段和各类 URL 后缀', () => {
    expect(isUrlInsightField(' URI ')).toBe(true);
    expect(isUrlInsightField('openUrl')).toBe(true);
    expect(isUrlInsightField('custom_url')).toBe(true);
    expect(isUrlInsightField('customUrl')).toBe(true);
    expect(isUrlInsightField('url_value')).toBe(false);
  });

  it.each([
    'avatar',
    'button_icon',
    'imageUrl',
  ])('识别资源精确字段 %s', key => {
    expect(isResourceInsightField(key)).toBe(true);
  });

  it.each([
    'custom_avatar',
    'custom_avatar_url',
    'custom_cover',
    'custom_cover_url',
    'custom_icon',
    'custom_icon_url',
    'custom_image',
    'custom_image_url',
    'custom_lottie',
    'custom_lottie_url',
    'custom_logo',
    'custom_logo_url',
    'custom_poster',
    'custom_poster_url',
    'custom_portrait',
    'custom_portrait_url',
  ])('识别资源后缀字段 %s', key => {
    expect(isResourceInsightField(key)).toBe(true);
  });

  it('资源 URL 同时属于通用命令线索，分类时可由调用方优先处理资源', () => {
    expect(isResourceInsightField('video_url')).toBe(true);
    expect(isUrlInsightField('video_url')).toBe(true);
    expect(isCommandInsightField('video_url')).toBe(true);
  });

  it('识别扩展字段并统一大小写和空白', () => {
    expect(isExtInsightField('ad_extra_param')).toBe(true);
    expect(isExtInsightField(' extInfo ')).toBe(true);
    expect(isExtInsightField('ADFLAG')).toBe(true);
    expect(isExtInsightField('extra_info')).toBe(false);
  });

  it('保持主命令字段的关键优先级顺序', () => {
    const orderedFields = [
      'scheme',
      'schema',
      'action_cmd',
      'command',
      'convert_cmd',
      'panel_cmd',
      'panel_scheme',
      'stay_cmd',
      'button_scheme',
      'button_cmd',
      'custom_cmd',
      'callbackUrl',
      'url',
      'page_url',
      'click_url',
      'custom_url',
      'video_url',
      'other',
    ];

    expect(orderedFields.map(getPrimaryCommandFieldPriority)).toEqual([
      100,
      98,
      96,
      94,
      92,
      90,
      88,
      86,
      82,
      78,
      70,
      40,
      30,
      28,
      24,
      20,
      10,
      0,
    ]);
    expect(getPrimaryCommandFieldPriority(' CALLBACKURL ')).toBe(40);
  });
});
