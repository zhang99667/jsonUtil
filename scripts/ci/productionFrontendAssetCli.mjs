const INSECURE_TLS_ENV_KEYS = [
  'FRONTEND_ASSET_VERIFY_INSECURE_TLS',
  'PUBLIC_FRONTEND_ASSET_VERIFY_INSECURE_TLS',
  'PUBLIC_VERIFY_INSECURE_TLS',
];

export const shouldAllowInsecureProductionAssetTls = (env = process.env) => (
  INSECURE_TLS_ENV_KEYS.some(key => env[key] === 'true')
);

export const writeProductionFrontendAssetAuditResult = (
  audit,
  { shouldPrintPaths, stdout = console.log, stderr = console.error } = {}
) => {
  if (shouldPrintPaths) stdout(audit.assetPaths.join(','));

  if (audit.failures.length > 0) {
    if (!shouldPrintPaths) stderr(`公网前端资源巡检失败: ${audit.baseUrl}`);
    audit.failures.forEach(failure => stderr(`- ${failure}`));
    return 1;
  }

  if (shouldPrintPaths) return 0;

  stdout(
    `公网前端资源巡检通过: ${audit.baseUrl}，页面 ${audit.pages.length} 个，` +
    `已扫描 JS ${audit.scannedJavascript.length} 个，CSS ${audit.scannedCss.length} 个，` +
    `静态资源 ${audit.assetPaths.length} 个。`
  );
  return 0;
};
