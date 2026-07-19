import { describe, expect, it } from 'vitest';
import {
  repairJsonLocally,
  repairJsonLocallyWithReport,
} from './aiLocalJsonRepair';

describe('aiLocalJsonRepair', () => {
  it('本地修复常见 JSON 小错误', () => {
    expect(repairJsonLocally(`// comment
      {items:[1,2,], ok:true, name:'json', note:"line
      break"}`)).toBe('{"items":[1,2],"ok":true,"name":"json","note":"line\\n      break"}');
  });

  it('本地修复会返回命中的确定性规则', () => {
    expect(repairJsonLocallyWithReport(`// comment
      {items:[1,2,], note:"line
      break"}`)).toEqual({
      fixedJson: '{"items":[1,2],"note":"line\\n      break"}',
      ruleLabels: ['修正非标准 JSON 语法'],
    });
  });

  it('本地修复不会移除字符串内的注释符和尾随逗号样式文本', () => {
    expect(repairJsonLocally(
      '{url:"https://example.com/a//b", block:"/* keep */", tail:",]", brace:",}", ok:true,}'
    )).toBe(
      '{"url":"https://example.com/a//b","block":"/* keep */","tail":",]","brace":",}","ok":true}'
    );
  });

  it('本地修复不会被字符串内的转义引号和注释符提前截断', () => {
    expect(repairJsonLocally(
      '{text:"before \\"// still text\\" after", ok:true}'
    )).toBe('{"text":"before \\"// still text\\" after","ok":true}');
  });

  it('本地修复不会给字符串内容里的裸 key 文本补引号', () => {
    expect(repairJsonLocally(
      '{text:"literal {bare:1, next:2}", ok:true}'
    )).toBe('{"text":"literal {bare:1, next:2}","ok":true}');
  });

  it('本地修复不会改坏双引号字符串里的单引号文本', () => {
    expect(repairJsonLocally(
      '{text:"a\'b\'c", ok:true}'
    )).toBe('{"text":"a\'b\'c","ok":true}');
  });

  it('本地修复支持单引号字符串内的转义单引号', () => {
    expect(repairJsonLocally(
      "{text:'it\\'s ok', ok:true}"
    )).toBe('{"text":"it\'s ok","ok":true}');
  });

  it('成熟修复器支持缺少分隔符、截断结构和脚本语言常量', () => {
    expect(repairJsonLocally(
      '{items:[1 2 3], active:True'
    )).toBe('{"items":[1,2,3],"active":true}');
  });

  it('成熟修复器支持提取代码围栏中的 JSON', () => {
    expect(repairJsonLocally('```json\n{ok:true}\n```')).toBe('{"ok":true}');
    expect(repairJsonLocally('```\n{ok:true}\n```')).toBe('{"ok":true}');
  });

  it('缺失属性值、数组空槽和普通文字不由本地修复器猜测', () => {
    expect(repairJsonLocally('{ok:}')).toBeNull();
    expect(repairJsonLocally('这不是 JSON')).toBeNull();
    expect(repairJsonLocally('{ok: /* 注释 */ next:1}')).toBeNull();
    expect(repairJsonLocally('{ok: // 注释\nnext:1}')).toBeNull();
    expect(repairJsonLocally('[1,,2]')).toBeNull();
  });

  it('缺失值守卫不会误判字符串和注释中的分隔符', () => {
    expect(repairJsonLocally(
      '{text:": }", /* 示例: } */ ok:true}'
    )).toBe('{"text":": }","ok":true}');
  });

  it('日期、版本文本和非 JSON 代码围栏不会被包装成字符串', () => {
    expect(repairJsonLocally('2026-07-19')).toBeNull();
    expect(repairJsonLocally('1.2.3')).toBeNull();
    expect(repairJsonLocally('-not-json')).toBeNull();
    expect(repairJsonLocally('```text\nhello\n```')).toBeNull();
  });

  it('空输入不会生成修复结果', () => {
    expect(repairJsonLocallyWithReport('   ')).toBeNull();
  });
});
