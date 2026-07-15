import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import { readEvolutionEvalCorpus } from './aiGovernanceEvolutionEvalContract.mjs';

const source = JSON.parse(fs.readFileSync('evals/ai-governance/cases.json', 'utf8'));

const withCorpusSize = (size, run) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jsonutils-corpus-size-'));
  try {
    const corpus = structuredClone(source);
    while (corpus.cases.length < size) {
      const index = corpus.cases.length + 1;
      const copy = structuredClone(corpus.cases[0]);
      copy.id = `capacity-boundary-${index}`;
      copy.subject.id = `capacity-boundary-${index}`;
      corpus.cases.push(copy);
    }
    const file = path.join(rootDir, 'cases.json');
    fs.writeFileSync(file, JSON.stringify(corpus));
    run(readEvolutionEvalCorpus(file, { maxDate: '2026-07-13' }));
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
};

test('AI evolution corpus 容量允许 34 个代表 case 并拒绝第 35 个', () => {
  withCorpusSize(34, report => assert.doesNotMatch(report.failures.join('\n'), /cases 数量/));
  withCorpusSize(35, report => assert.match(report.failures.join('\n'), /cases 数量必须在 10 到 34 之间/));
});
