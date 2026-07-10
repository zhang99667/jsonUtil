import {
  protectsExternalAdminEntrypoint,
  protectsExternalHttpAdminEntrypoint,
  protectsExternalRootEntrypoint,
  readNginxServerNames,
} from './frontendNginxRoutingBlocks.mjs';

export const collectExternalFrontendRouteFailures = ({
  file,
  routes,
  publicHttpNames,
  externalHttpBlocks,
  externalHttpsNames,
  externalHttpsBlocks,
  jsonutilsHttpsNames,
}) => routes.flatMap(({ host, root }) => [
  ...(!publicHttpNames.has(host) ? [`${file}: 外部域名 ${host} 未绑定到 HTTPS 跳转 server_name`] : []),
  ...(!externalHttpsNames.has(host) ? [`${file}: 外部域名 ${host} 未绑定到独立静态目录 ${root}`] : []),
  ...(!externalHttpsBlocks.some(block => readNginxServerNames(block).includes(host) &&
    block.includes(root) && protectsExternalRootEntrypoint(block))
    ? [`${file}: 外部域名 ${host} 必须显式保护根路径，避免目录入口回退到后台或缓存旧入口`]
    : []),
  ...(!externalHttpsBlocks.some(block => readNginxServerNames(block).includes(host) &&
    block.includes(root) && protectsExternalAdminEntrypoint(block))
    ? [`${file}: 外部域名 ${host} 必须用本域 /index.html 承接 /admin.html，清缓存后用一次性裸域 query 绕过旧 301 并归位`]
    : []),
  ...(!externalHttpBlocks.some(block => readNginxServerNames(block).includes(host) &&
    protectsExternalHttpAdminEntrypoint(block))
    ? [`${file}: 外部域名 ${host} 的 HTTP /admin.html 必须跳到 HTTPS 裸域，避免继续强化后台历史路径`]
    : []),
  ...(jsonutilsHttpsNames.has(host) ? [`${file}: 外部域名 ${host} 不能绑定到 JSONUtils 主站或后台 server_name`] : []),
]);
