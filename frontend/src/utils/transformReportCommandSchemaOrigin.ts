export const getCommandSchemaOrigin = (schema: string): string => {
  const trimmed = schema.trim().replace(/\\\//g, '/');
  const protocolRelativeMatch = trimmed.match(/^\/\/([^/?#\s]+)/);
  if (protocolRelativeMatch) return `//${protocolRelativeMatch[1]}`;

  const absoluteMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)\/\/([^/?#\s]+)/);
  if (absoluteMatch) return `${absoluteMatch[1]}//${absoluteMatch[2]}`;

  const protocolMatch = trimmed.match(/^([A-Za-z][A-Za-z0-9+.-]*:)/);
  return protocolMatch ? protocolMatch[1] : trimmed;
};
