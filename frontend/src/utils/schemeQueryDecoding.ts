export type IsDecodableQueryValue = (value: string) => boolean;

export const urlDecode = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export const decodeQueryComponent = (str: string): string => (
  urlDecode(str.replace(/\+/g, ' '))
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
