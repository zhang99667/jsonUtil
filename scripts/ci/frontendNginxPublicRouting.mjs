import fs from 'node:fs';
import path from 'node:path';

export const nginxRoutingConfigFile = 'frontend/nginx.conf';
export const publicFrontendHosts = ['jsonutils.markz.fun', 'markz.fun', 'www.markz.fun'];
export const localHealthHosts = ['localhost', '127.0.0.1'];
export const externalFrontendRoutes = [{ host: 'zhangjihao.markz.fun', root: '/usr/share/nginx/zhangjihao' }];

const readNames = block => (block.match(/^\s*server_name\s+([^;]+);/m)?.[1] || '').trim().split(/\s+/).filter(Boolean);
const listensOn = (block, port) => new RegExp(`^\\s*listen\\s+${port}\\b`, 'm').test(block);
const routesToAdmin = block => block.includes('https://$host/admin.html') ||
  block.includes('return 301 /admin.html;') ||
  block.includes('try_files $uri $uri/ /admin.html;');
const hasAll = (block, snippets) => snippets.every(snippet => block.includes(snippet));
const redirectsHtmlEntrypoint = block => /^\s*return\s+30[1278]\s+\/(?:admin|index)\.html;/m.test(block);
const protectsExternalAdminEntrypoint = block => hasAll(block, [
  'location = /admin.html', 'try_files /admin.html /index.html =404;', 'Clear-Site-Data "\\"cache\\""',
]) && !redirectsHtmlEntrypoint(block);
const protectsExternalRootEntrypoint = block => hasAll(block, ['location = /', 'try_files /index.html =404;']);
const unionNames = blocks => new Set(blocks.flatMap(readNames));

export const extractNginxServerBlocks = (content) => {
  const blocks = [];
  const serverMatcher = /server\s*\{/g;
  let match;
  while ((match = serverMatcher.exec(content)) !== null) {
    let depth = 0;
    const start = match.index;
    const braceStart = content.indexOf('{', match.index);
    for (let index = braceStart; index < content.length; index += 1) {
      if (content[index] === '{') depth += 1;
      if (content[index] === '}') depth -= 1;
      if (depth === 0) {
        blocks.push(content.slice(start, index + 1));
        serverMatcher.lastIndex = index + 1;
        break;
      }
    }
  }
  return blocks;
};

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
  const publicHttpNames = unionNames(blocks.filter(block => listensOn(block, 80) && block.includes('https://$host$request_uri')));
  const publicHttpsNames = unionNames(blocks.filter(block => listensOn(block, 443) && block.includes('try_files $uri $uri/ /index.html;')));
  const adminNames = unionNames(blocks.filter(routesToAdmin));
  const externalHttpsBlocks = blocks.filter(block => listensOn(block, 443) &&
    externalFrontendRoutes.some(route => block.includes(route.root)));
  const externalHttpsNames = unionNames(externalHttpsBlocks);
  const jsonutilsHttpsNames = unionNames(blocks.filter(block => listensOn(block, 443) &&
    !externalFrontendRoutes.some(route => block.includes(route.root)) &&
    (routesToAdmin(block) || block.includes('try_files $uri $uri/ /index.html;'))));
  const adminHostFailures = hosts
    .filter(host => adminNames.has(host))
    .map(host => `${file}: 公开域名 ${host} 不能绑定到后台 server_name`);
  const localHealthFailures = localHealthHosts
    .filter(host => !publicHttpsNames.has(host))
    .map(host => `${file}: 本机健康检查域名 ${host} 未绑定到主站 HTTPS server_name`);
  const externalHostFailures = externalFrontendRoutes.flatMap(({ host, root }) => [
    ...(!publicHttpNames.has(host) ? [`${file}: 外部域名 ${host} 未绑定到 HTTPS 跳转 server_name`] : []),
    ...(!externalHttpsNames.has(host) ? [`${file}: 外部域名 ${host} 未绑定到独立静态目录 ${root}`] : []),
    ...(!externalHttpsBlocks.some(block => readNames(block).includes(host) &&
      block.includes(root) && protectsExternalRootEntrypoint(block))
      ? [`${file}: 外部域名 ${host} 必须显式保护根路径，避免目录入口回退到后台或缓存旧入口`]
      : []),
    ...(!externalHttpsBlocks.some(block => readNames(block).includes(host) &&
      block.includes(root) && protectsExternalAdminEntrypoint(block))
      ? [`${file}: 外部域名 ${host} 必须直接服务 /admin.html 或本域 /index.html，避免后台入口跳转污染业务域名`]
      : []),
    ...(jsonutilsHttpsNames.has(host) ? [`${file}: 外部域名 ${host} 不能绑定到 JSONUtils 主站或后台 server_name`] : []),
  ]);

  return [
    ...collectMissingHostFailures(file, hosts, publicHttpNames, '主站 HTTP 跳转 server_name'),
    ...collectMissingHostFailures(file, hosts, publicHttpsNames, '主站 HTTPS server_name'),
    ...adminHostFailures,
    ...localHealthFailures,
    ...externalHostFailures,
  ];
};
