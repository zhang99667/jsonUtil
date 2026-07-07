import { describe, expect, it } from 'vitest';
import {
  AI_CONNECTION_TEST_INVALID_MESSAGE,
  assertAiConnectionTestResult,
} from './aiRepairConnectionTest';

describe('aiRepairConnectionTest', () => {
  it('连接测试返回 connection true 时通过', () => {
    expect(() => assertAiConnectionTestResult('{"connection":true}')).not.toThrow();
  });

  it('连接测试返回无关 JSON 时抛出可读错误', () => {
    expect(() => assertAiConnectionTestResult('{}'))
      .toThrow(AI_CONNECTION_TEST_INVALID_MESSAGE);
    expect(() => assertAiConnectionTestResult('{"connection":false}'))
      .toThrow(AI_CONNECTION_TEST_INVALID_MESSAGE);
  });
});
