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
      ruleLabels: [
        '移除 JSON 注释',
        '修正常见 JS 对象写法',
        '移除尾随逗号',
        '转义字符串内换行/控制字符',
      ],
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

  it('空输入不会生成修复结果', () => {
    expect(repairJsonLocallyWithReport('   ')).toBeNull();
  });
});
