export const HAR_SOURCE_LABEL_PREFIX = 'HAR ';

export const trimSourceLabel = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  return trimmed || undefined;
};

export const formatHarSourceLabel = (label: string): string => (
  label.startsWith(HAR_SOURCE_LABEL_PREFIX) ? label : `${HAR_SOURCE_LABEL_PREFIX}${label}`
);

export const isHarSourceLabel = (label?: string): boolean => (
  Boolean(label?.startsWith(HAR_SOURCE_LABEL_PREFIX))
);

export const getSourceLabelKindText = (label?: string): string => (
  isHarSourceLabel(label) ? '接口上下文' : '业务字段'
);

export const getSourceLabelDisplayValue = (label?: string): string => {
  if (!label) return '';
  return isHarSourceLabel(label) ? label.slice(HAR_SOURCE_LABEL_PREFIX.length) : label;
};

export const formatSourceLabelText = (label?: string): string => {
  const displayValue = getSourceLabelDisplayValue(label);
  if (!displayValue) return '';

  return `${getSourceLabelKindText(label)}: ${displayValue}`;
};
