const ACTIVE_TEST_DECLARATION_PATTERN = /^\s*(?:test|it)\s*\(/m;
const FOCUSED_TEST_DECLARATION_PATTERN = /^\s*(?:test|it)\s*\.\s*only\s*\(/m;

export const collectDecisionLedgerActiveTestContentFailures = (label, file, content) => [
  ...(!ACTIVE_TEST_DECLARATION_PATTERN.test(content)
    ? [`${label} 锁定测试文件缺少可执行 test(...) 或 it(...) 用例 \`${file}\``]
    : []),
  ...(FOCUSED_TEST_DECLARATION_PATTERN.test(content)
    ? [`${label} 锁定测试文件不能包含 test.only(...) 或 it.only(...) \`${file}\``]
    : []),
];
