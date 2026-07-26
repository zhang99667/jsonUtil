import { createSchemeUrlContext, type SchemeUrlContext } from './schemeUrlShapes';

export const getUrlResourceSchemaFromContext = (
  context: SchemeUrlContext,
): string | undefined => {
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(context.normalizedSource)) return undefined;

  return `${context.url.protocol}//${context.url.host}${context.url.pathname}`;
};

export const getUrlResourceSchemaFromUrl = (value: string): string | undefined => {
  try {
    return getUrlResourceSchemaFromContext(createSchemeUrlContext(value));
  } catch {
    return undefined;
  }
};
