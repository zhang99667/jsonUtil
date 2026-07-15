import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  compareStrictSemverPrecedence,
  isStrictSemver,
  isStrictSemverIncrement,
  parseStrictSemver,
} from './aiGovernanceSemver.mjs';

test('严格 SemVer 接受合法 core、prerelease、build 与超大数字', () => {
  for (const version of [
    '0.0.0', '1.2.3', '1.2.3-alpha.1', '1.2.3-x.7.z.92',
    '1.2.3+build.01', '999999999999999999999999.0.0',
  ]) assert.equal(isStrictSemver(version), true, version);
  assert.equal(parseStrictSemver('1.2.3')?.core[0], 1n);
});

test('严格 SemVer 拒绝前导零、空 identifier 和非法字符', () => {
  for (const version of [
    '01.2.3', '1.02.3', '1.2.03', '1.2', '1.2.3-', '1.2.3-..',
    '1.2.3-01', '1.2.3+', '1.2.3+..', '1.2.3+a_b', 1,
  ]) assert.equal(isStrictSemver(version), false, String(version));
});

test('严格 SemVer 按官方 precedence 比较且忽略 build metadata', () => {
  const precedence = [
    '1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-alpha.beta', '1.0.0-beta',
    '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0',
  ];
  for (let index = 1; index < precedence.length; index += 1) {
    assert.equal(compareStrictSemverPrecedence(precedence[index], precedence[index - 1]), 1);
  }
  assert.equal(compareStrictSemverPrecedence('1.0.0+left', '1.0.0+right'), 0);
  assert.equal(isStrictSemverIncrement('1.0.0+left', '1.0.0+right'), false);
  assert.equal(isStrictSemverIncrement('999999999999999999999998.0.0',
    '999999999999999999999999.0.0'), true);
  assert.equal(compareStrictSemverPrecedence('invalid', '1.0.0'), null);
});
