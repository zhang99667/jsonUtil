const PROTOCOL_RELATIVE_URL_BASE = 'https:';
const BARE_HOST_URL_BASE = 'https://';
const HTTP_SCHEME_PROTOCOLS = new Set(['http:', 'https:']);

const normalizeJsonEscapedSlashes = (source: string): string => (
  source.replace(/\\\//g, '/')
);

const normalizeJsonUnicodeAsciiEscapes = (source: string): string => (
  source.replace(/\\u00([2-7][0-9a-f])/gi, (match, hex: string) => {
    const code = Number.parseInt(hex, 16);
    return code >= 0x20 && code <= 0x7e ? String.fromCharCode(code) : match;
  })
);

export const normalizeJsonUrlEscapes = (source: string): string => (
  normalizeJsonUnicodeAsciiEscapes(normalizeJsonEscapedSlashes(source))
);

const isDomainLikeHost = (host: string): boolean => {
  const hostWithoutPort = host.toLowerCase().replace(/:\d+$/, '');
  if (hostWithoutPort === 'localhost') return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostWithoutPort)) return true;

  const labels = hostWithoutPort.split('.');
  const topLevelDomain = labels[labels.length - 1] || '';
  return labels.length >= 2 && /^[a-z]{2,}$/.test(topLevelDomain);
};

export const isProtocolRelativeUrl = (value: string): boolean => {
  const match = value.trim().match(/^\/\/([^/?#\s]+)(?:[/?#].*)?$/);
  if (!match) return false;

  const host = match[1];
  return /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host) && isDomainLikeHost(host);
};

export const isBareHostUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) || trimmed.startsWith('//')) return false;

  const match = trimmed.match(/^([^/?#\s]+)([/?#].*)$/);
  if (!match) return false;

  const host = match[1];
  return /^[A-Za-z0-9.-]+(?::\d+)?$/.test(host) && isDomainLikeHost(host);
};

export const createUrl = (urlString: string): URL => {
  const trimmed = normalizeJsonUrlEscapes(urlString.trim());
  if (isBareHostUrl(trimmed)) {
    return new URL(`${BARE_HOST_URL_BASE}${trimmed}`);
  }
  return new URL(isProtocolRelativeUrl(trimmed) ? `${PROTOCOL_RELATIVE_URL_BASE}${trimmed}` : trimmed);
};

export const stringifyUrlForOriginalShape = (url: URL, originalUrl: string): string => {
  const serialized = url.toString();
  if (isBareHostUrl(originalUrl)) {
    return serialized.slice(BARE_HOST_URL_BASE.length);
  }

  return isProtocolRelativeUrl(originalUrl)
    ? serialized.slice(PROTOCOL_RELATIVE_URL_BASE.length)
    : serialized;
};

export const isHttpSchemeProtocol = (protocol: string): boolean => (
  HTTP_SCHEME_PROTOCOLS.has(protocol.toLowerCase())
);
