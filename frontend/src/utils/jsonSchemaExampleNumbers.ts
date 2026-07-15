export const getNumberValue = (
  schema: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = schema[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

export const getIntegerValue = (
  schema: Record<string, unknown>,
  key: string,
): number | undefined => {
  const value = getNumberValue(schema, key);
  return typeof value === 'number' ? Math.trunc(value) : undefined;
};

const isNumberExampleAllowed = (
  value: number,
  schema: Record<string, unknown>,
  integerOnly: boolean,
): boolean => {
  if (!Number.isFinite(value)) return false;
  if (integerOnly && !Number.isInteger(value)) return false;

  const minimum = getNumberValue(schema, 'minimum');
  if (typeof minimum === 'number' && value < minimum) return false;

  const exclusiveMinimum = getNumberValue(schema, 'exclusiveMinimum');
  if (typeof exclusiveMinimum === 'number' && value <= exclusiveMinimum) return false;

  const maximum = getNumberValue(schema, 'maximum');
  if (typeof maximum === 'number' && value > maximum) return false;

  const exclusiveMaximum = getNumberValue(schema, 'exclusiveMaximum');
  if (typeof exclusiveMaximum === 'number' && value >= exclusiveMaximum) return false;

  const multipleOf = getNumberValue(schema, 'multipleOf');
  if (typeof multipleOf === 'number' && multipleOf > 0) {
    const quotient = value / multipleOf;
    if (Math.abs(quotient - Math.round(quotient)) > Number.EPSILON * 100) return false;
  }

  return true;
};

export const generateNumberExample = (
  schema: Record<string, unknown>,
  integerOnly: boolean,
): number => {
  const minimum = getNumberValue(schema, 'minimum');
  const exclusiveMinimum = getNumberValue(schema, 'exclusiveMinimum');
  const maximum = getNumberValue(schema, 'maximum');
  const exclusiveMaximum = getNumberValue(schema, 'exclusiveMaximum');
  const multipleOf = getNumberValue(schema, 'multipleOf');

  let value = typeof minimum === 'number' ? minimum : 1;
  if (typeof exclusiveMinimum === 'number') value = exclusiveMinimum + (integerOnly ? 1 : 0.1);
  if (integerOnly) value = Math.ceil(value);

  if (typeof multipleOf === 'number' && multipleOf > 0) {
    value = Math.ceil(value / multipleOf) * multipleOf;
    if (integerOnly) value = Math.ceil(value);
  }

  if (typeof maximum === 'number' && value > maximum) value = integerOnly ? Math.floor(maximum) : maximum;
  if (typeof exclusiveMaximum === 'number' && value >= exclusiveMaximum) {
    value = integerOnly ? Math.floor(exclusiveMaximum - 1) : exclusiveMaximum - 0.1;
  }

  return integerOnly ? Math.trunc(value) : Number(value.toFixed(4));
};

export const getUniqueNumberExample = (
  value: number,
  schema: Record<string, unknown>,
  index: number,
  integerOnly: boolean,
): number | undefined => {
  const multipleOf = getNumberValue(schema, 'multipleOf');
  const step = typeof multipleOf === 'number' && multipleOf > 0
    ? multipleOf
    : integerOnly
      ? 1
      : 0.1;
  const candidates = [
    value + step * index,
    value + step * (index + 1),
    value - step * index,
  ].map(candidate => (integerOnly ? Math.trunc(candidate) : Number(candidate.toFixed(4))));

  return candidates.find(candidate => isNumberExampleAllowed(candidate, schema, integerOnly));
};
