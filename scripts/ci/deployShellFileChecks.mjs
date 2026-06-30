import fs from 'node:fs';
import path from 'node:path';

import { collectScriptHeredocs } from './deployShellHeredocs.mjs';
import { checkBashSyntax } from './deployShellSyntaxRunner.mjs';

export const checkDeployShellFiles = (rootDir, files, runner) => {
  const checkedFiles = [];
  const checkedHeredocs = [];
  const failures = [];

  for (const file of files) {
    const filePath = path.join(rootDir, file);
    if (!fs.existsSync(filePath)) {
      failures.push(`${file}: 文件不存在`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    checkedFiles.push(file);
    const fileFailure = checkBashSyntax(runner, file, ['-n', filePath], { encoding: 'utf8' });
    if (fileFailure) failures.push(fileFailure);

    for (const heredoc of collectScriptHeredocs(content)) {
      const label = `${file}:${heredoc.marker}:${heredoc.startLine}`;
      checkedHeredocs.push(label);
      const failure = checkBashSyntax(runner, label, ['-n'], { encoding: 'utf8', input: heredoc.content });
      if (failure) failures.push(failure);
    }
  }

  return { checkedFiles, checkedHeredocs, failures };
};
