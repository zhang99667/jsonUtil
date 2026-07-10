import fs from 'node:fs';
import path from 'node:path';
import { collectExternalFrontendRouteFailures } from './frontendNginxExternalRouteFailures.mjs';
import { buildNginxRoutingClassifications } from './frontendNginxRoutingClassifications.mjs';
import { extractNginxServerBlocks } from './frontendNginxRoutingBlocks.mjs';

export { extractNginxServerBlocks } from './frontendNginxRoutingBlocks.mjs';

export const nginxRoutingConfigFile = 'frontend/nginx.conf';
export const publicFrontendHosts = ['jsonutils.markz.fun', 'markz.fun', 'www.markz.fun'];
export const localHealthHosts = ['localhost', '127.0.0.1'];
export const externalFrontendRoutes = [{ host: 'zhangjihao.markz.fun', root: '/usr/share/nginx/zhangjihao' }];

const collectMissingHostFailures = (file, hosts, names, label) => (
  hosts
    .filter(host => !names.has(host))
    .map(host => `${file}: 公开域名 ${host} 未绑定到${label}`)
);

export const collectNginxPublicRoutingFailures = (
  rootDir,
  hosts = publicFrontendHosts,
  file = nginxRoutingConfigFile
) => {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return [`${file}: 缺少配置文件`];

  const blocks = extractNginxServerBlocks(fs.readFileSync(filePath, 'utf8'));
  const {
    publicHttpNames,
    publicHttpsNames,
    adminNames,
    externalHttpBlocks,
    externalHttpsBlocks,
    externalHttpsNames,
    jsonutilsHttpsNames,
  } = buildNginxRoutingClassifications(blocks, externalFrontendRoutes);
  const adminHostFailures = hosts
    .filter(host => adminNames.has(host))
    .map(host => `${file}: 公开域名 ${host} 不能绑定到后台 server_name`);
  const localHealthFailures = localHealthHosts
    .filter(host => !publicHttpsNames.has(host))
    .map(host => `${file}: 本机健康检查域名 ${host} 未绑定到主站 HTTPS server_name`);
  const externalHostFailures = collectExternalFrontendRouteFailures({
    file,
    routes: externalFrontendRoutes,
    publicHttpNames,
    externalHttpBlocks,
    externalHttpsNames,
    externalHttpsBlocks,
    jsonutilsHttpsNames,
  });

  return [
    ...collectMissingHostFailures(file, hosts, publicHttpNames, '主站 HTTP 跳转 server_name'),
    ...collectMissingHostFailures(file, hosts, publicHttpsNames, '主站 HTTPS server_name'),
    ...adminHostFailures,
    ...localHealthFailures,
    ...externalHostFailures,
  ];
};
