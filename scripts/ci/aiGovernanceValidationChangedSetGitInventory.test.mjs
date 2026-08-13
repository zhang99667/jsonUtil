import assert from 'node:assert/strict';
import { test } from 'node:test';

import * as changedSet from './aiGovernanceValidationChangedSet.mjs';
import {
  parseValidationHeadEntries,
  parseValidationIndexEntries,
} from './aiGovernanceValidationChangedSetGitInventory.mjs';
import * as gitInventory from './aiGovernanceValidationChangedSetGitInventory.mjs';

const SHA1 = '1'.repeat(40);

test('changed-set Git inventory owns the parser API without compatibility re-exports', () => {
  assert.deepEqual(Object.keys(changedSet), ['collectAuthoritativeValidationChangedSet']);
  assert.deepEqual(Object.keys(gitInventory).sort(), [
    'ValidationChangedSetInventoryError',
    'assertValidationChangedSetGitStateCurrent',
    'captureValidationChangedSetGitState',
    'parseValidationHeadEntries',
    'parseValidationIndexEntries',
  ]);
});

test('changed-set Git inventory parses raw NUL records and preserves unusual UTF-8 paths', () => {
  const file = '目录/new\nraw.txt';
  assert.deepEqual(parseValidationHeadEntries(Buffer.from(`100755 blob ${SHA1} ${file}\0`)), [{
    mode: '100755', type: 'blob', oid: SHA1, path: file,
  }]);
  assert.deepEqual(parseValidationIndexEntries(Buffer.from(`100644 ${SHA1} 0 ${file}\0`)), [{
    mode: '100644', oid: SHA1, stage: 0, path: file,
  }]);
});

test('changed-set Git inventory rejects unsafe paths and invalid UTF-8 without reflecting path bytes', () => {
  assert.throws(
    () => parseValidationHeadEntries(Buffer.from(`100644 blob ${SHA1} unsafe\\path.txt\0`)),
    error => error?.code === 'unsafe-path' && error.message === 'unsafe-path',
  );
  assert.throws(
    () => parseValidationIndexEntries(Buffer.from([0xff, 0x00])),
    error => error?.code === 'invalid-nul-or-utf8' && error.message === 'invalid-nul-or-utf8',
  );
});
