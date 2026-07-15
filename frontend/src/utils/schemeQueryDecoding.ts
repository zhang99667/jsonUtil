export type IsDecodableQueryValue = (value: string) => boolean;

export const tryDecodeURIComponent = (value: string): string | null => {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
};

export const urlDecode = (str: string): string => {
  return tryDecodeURIComponent(str) ?? str;
};

export const decodeQueryComponent = (str: string): string => (
  urlDecode(str.replace(/\+/g, ' '))
);

export const decodeQueryComponentOrOriginal = (str: string): string => (
  tryDecodeURIComponent(str.replace(/\+/g, ' ')) ?? str
);

export const decodeQueryValueComponent = (
  str: string,
  isDecodableValue: IsDecodableQueryValue
): string => {
  const formDecoded = decodeQueryComponent(str);
  if (!str.includes('+')) return formDecoded;

  const plusPreserved = urlDecode(str);
  if (plusPreserved === formDecoded) return formDecoded;

  return isDecodableValue(plusPreserved) && !isDecodableValue(formDecoded)
    ? plusPreserved
    : formDecoded;
};
