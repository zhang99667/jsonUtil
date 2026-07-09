import fs from 'node:fs';
import path from 'node:path';

const ACTIVE_TEST_DECLARATION_PATTERN = /^\s*(?:test|it)\s*\(/m;
const FOCUSED_TEST_DECLARATION_PATTERN = /^\s*(?:test|it)\s*\.\s*only\s*\(/m;

export const collectDecisionLedgerActiveTestFailures = (rootDir, label, files) => (
  [...new Set(files)]
    .filter(file => fs.existsSync(path.join(rootDir, file)))
    .flatMap((file) => {
      const content = fs.readFileSync(path.join(rootDir, file), 'utf8');
      return [
        ...(!ACTIVE_TEST_DECLARATION_PATTERN.test(content) ? [`${label} 锁定测试文件缺少可执行 test(...) 或 it(...) 用例 \`${file}\``] : []),
        ...(FOCUSED_TEST_DECLARATION_PATTERN.test(content) ? [`${label} 锁定测试文件不能包含 test.only(...) 或 it.only(...) \`${file}\``] : []),
      ];
    })
);
