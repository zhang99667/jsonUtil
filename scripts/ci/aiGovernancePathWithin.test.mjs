import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import { isPathWithin } from './aiGovernancePathWithin.mjs';

test('isPathWithin 接受相同路径和严格内部路径', () => {
  assert.equal(isPathWithin('/repo', '/repo'), true);
  assert.equal(isPathWithin('/repo', '/repo/src/file.mjs'), true);
  assert.equal(isPathWithin('/repo', '/repository'), false);
});

test('isPathWithin 拒绝父路径、兄弟路径和绝对逃逸', () => {
  assert.equal(isPathWithin('/repo/src', '/repo'), false);
  assert.equal(isPathWithin('/repo/src', '/repo/../sibling'), false);
  assert.equal(isPathWithin(path.resolve('/repo'), path.resolve('/other/file')), false);
});
