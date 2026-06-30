import { validateProductionAssetContentType } from './productionFrontendAssetMime.mjs';

const REQUEST_TIMEOUT_MS = Number(process.env.FRONTEND_ASSET_VERIFY_TIMEOUT_MS || 10_000);

const withTimeout = async (url, request) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await request(controller.signal);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`请求超时: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};

export const fetchProductionAssetText = async (url) => withTimeout(url, async (signal) => {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error(`${url} 返回 ${response.status}`);
  return response.text();
});

export const checkProductionAsset = async (url) => withTimeout(url, async (signal) => {
  const response = await fetch(url, { method: 'HEAD', cache: 'no-store', signal });
  if (!response.ok) throw new Error(`${url} 返回 ${response.status}`);
  if (validateProductionAssetContentType(url, response)) return;

  const fallbackResponse = await fetch(url, { cache: 'no-store', signal });
  if (!fallbackResponse.ok) throw new Error(`${url} 返回 ${fallbackResponse.status}`);
  if (!validateProductionAssetContentType(url, fallbackResponse)) throw new Error(`${url} 缺少 Content-Type`);
});
