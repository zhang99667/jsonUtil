const bytesToBinaryString = (bytes: Uint8Array): string => {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return binary;
};

const binaryStringToBytes = (binary: string): Uint8Array => {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

export const normalizeBase64Input = (input: string): string | null => {
  const compact = input.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!compact || compact.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    return null;
  }
  const firstPaddingIndex = compact.indexOf('=');
  if (firstPaddingIndex !== -1 && /[^=]/.test(compact.slice(firstPaddingIndex))) {
    return null;
  }
  const paddingLength = (4 - (compact.length % 4)) % 4;
  return compact + '='.repeat(paddingLength);
};

export const isReadableDecodedText = (decoded: string): boolean => {
  if (!decoded.trim()) return false;
  const controlChars = decoded.match(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g);
  return !controlChars || controlChars.length / decoded.length < 0.05;
};

export const decodeNormalizedBase64 = (normalized: string): string | null => {
  try {
    const bytes = binaryStringToBytes(atob(normalized));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
};

export const decodeNormalizedBase64ReadablePrefix = (normalized: string): string | null => {
  try {
    const bytes = binaryStringToBytes(atob(normalized));
    const decoded = new TextDecoder('utf-8').decode(bytes);
    const stopIndex = decoded.search(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/);
    const readablePrefix = (stopIndex >= 0 ? decoded.slice(0, stopIndex) : decoded).trim();
    return readablePrefix || null;
  } catch {
    return null;
  }
};

export const base64Encode = (str: string): string => {
  try {
    const bytes = new TextEncoder().encode(str);
    return btoa(bytesToBinaryString(bytes));
  } catch {
    return str;
  }
};
