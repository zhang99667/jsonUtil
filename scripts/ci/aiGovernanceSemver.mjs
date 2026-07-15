const SEMVER_PATTERN = /^([0-9]+)\.([0-9]+)\.([0-9]+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const isCanonicalNumeric = value => /^(?:0|[1-9][0-9]*)$/.test(value);

export const parseStrictSemver = (value) => {
  if (typeof value !== 'string') return null;
  const match = SEMVER_PATTERN.exec(value);
  if (!match || !match.slice(1, 4).every(isCanonicalNumeric)) return null;
  const prerelease = match[4]?.split('.') ?? null;
  if (prerelease?.some(item => /^[0-9]+$/.test(item) && !isCanonicalNumeric(item))) return null;
  return Object.freeze({
    core: Object.freeze(match.slice(1, 4).map(BigInt)),
    prerelease: prerelease && Object.freeze(prerelease),
  });
};

export const isStrictSemver = value => parseStrictSemver(value) !== null;

const comparePrerelease = (left, right) => {
  if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (left[index] === undefined || right[index] === undefined) return left[index] === undefined ? -1 : 1;
    if (left[index] === right[index]) continue;
    const leftNumeric = /^[0-9]+$/.test(left[index]);
    const rightNumeric = /^[0-9]+$/.test(right[index]);
    if (leftNumeric && rightNumeric) return BigInt(left[index]) > BigInt(right[index]) ? 1 : -1;
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return left[index] > right[index] ? 1 : -1;
  }
  return 0;
};

export const compareStrictSemverPrecedence = (leftValue, rightValue) => {
  const left = parseStrictSemver(leftValue), right = parseStrictSemver(rightValue);
  if (!left || !right) return null;
  for (let index = 0; index < left.core.length; index += 1) {
    if (left.core[index] !== right.core[index]) return left.core[index] > right.core[index] ? 1 : -1;
  }
  return comparePrerelease(left.prerelease, right.prerelease);
};

export const isStrictSemverIncrement = (previous, candidate) => {
  const comparison = compareStrictSemverPrecedence(candidate, previous);
  return comparison !== null && comparison > 0;
};
