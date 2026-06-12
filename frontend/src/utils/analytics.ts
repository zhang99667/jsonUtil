const GA_PLACEHOLDER_IDS = new Set([
  '',
  'G-PLACEHOLDER',
  'G-XXXXXXXXXX',
]);

export const normalizeGoogleAnalyticsId = (value?: string): string => {
  return (value || '').trim().toUpperCase();
};

export const shouldEnableGoogleAnalytics = (measurementId?: string): boolean => {
  const normalizedId = normalizeGoogleAnalyticsId(measurementId);
  return /^G-[A-Z0-9]+$/.test(normalizedId) && !GA_PLACEHOLDER_IDS.has(normalizedId);
};

export const initGoogleAnalytics = (measurementId?: string): void => {
  const normalizedId = normalizeGoogleAnalyticsId(measurementId);
  if (!shouldEnableGoogleAnalytics(normalizedId)) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  if (!document.querySelector(`script[data-ga-measurement-id="${normalizedId}"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(normalizedId)}`;
    script.dataset.gaMeasurementId = normalizedId;
    document.head.appendChild(script);
  }

  window.gtag('js', new Date());
  window.gtag('config', normalizedId);
};
