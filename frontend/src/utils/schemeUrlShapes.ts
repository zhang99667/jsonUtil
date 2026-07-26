import {
  normalizeJsonEscapedSlashes,
  normalizeJsonUnicodeAsciiEscapes,
} from './schemeEscapedPayloads';

const PROTOCOL_RELATIVE_URL_BASE = 'https:';
const BARE_HOST_URL_BASE = 'https://';
const HTTP_SCHEME_PROTOCOLS = new Set(['http:', 'https:']);

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

export interface SchemeUrlContext {
  normalizedSource: string;
  url: URL;
  isBareHost: boolean;
  isProtocolRelative: boolean;
}

export const createSchemeUrlContext = (urlString: string): SchemeUrlContext => {
  const normalizedSource = normalizeJsonUrlEscapes(urlString.trim());
  const isBareHost = isBareHostUrl(normalizedSource);
  const isProtocolRelative = isProtocolRelativeUrl(normalizedSource);
  // 原生 URL 不接受裸域名和协议相对地址；临时补齐 HTTPS，形态标记负责后续恢复。
  const url = new URL(
    isBareHost
      ? `${BARE_HOST_URL_BASE}${normalizedSource}`
      : isProtocolRelative
        ? `${PROTOCOL_RELATIVE_URL_BASE}${normalizedSource}`
        : normalizedSource,
  );

  return {
    normalizedSource,
    url,
    isBareHost,
    isProtocolRelative,
  };
};

export const isUrl = (value: string): boolean => {
  const normalized = normalizeJsonUrlEscapes(value.trim());
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.+/.test(normalized)
    || isProtocolRelativeUrl(normalized)
    || isBareHostUrl(normalized);
};

export const createUrl = (urlString: string): URL => createSchemeUrlContext(urlString).url;

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
