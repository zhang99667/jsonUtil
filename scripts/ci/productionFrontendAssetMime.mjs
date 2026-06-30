const JAVASCRIPT_MIME_TYPES = new Set([
  'application/ecmascript',
  'application/javascript',
  'application/x-javascript',
  'text/ecmascript',
  'text/javascript',
]);

const CSS_MIME_TYPES = new Set(['text/css']);

const getExpectedContentType = (url) => {
  const pathname = new URL(url).pathname;
  if (/\.js$/i.test(pathname)) return { label: 'JavaScript', mimeTypes: JAVASCRIPT_MIME_TYPES };
  if (/\.css$/i.test(pathname)) return { label: 'CSS', mimeTypes: CSS_MIME_TYPES };
  return null;
};

export const validateProductionAssetContentType = (url, response) => {
  const expected = getExpectedContentType(url);
  if (!expected) return true;

  const contentType = response.headers.get('content-type');
  if (!contentType) return false;

  const mimeType = contentType.split(';')[0].trim().toLowerCase();
  if (expected.mimeTypes.has(mimeType)) return true;
  throw new Error(`${url} Content-Type ${contentType} 不是 ${expected.label}`);
};
