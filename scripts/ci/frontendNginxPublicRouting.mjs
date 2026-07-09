import fs from 'node:fs';
import path from 'node:path';

export const nginxRoutingConfigFile = 'frontend/nginx.conf';
export const publicFrontendHosts = ['jsonutils.markz.fun', 'markz.fun', 'www.markz.fun'];
export const externalFrontendRoutes = [
  { host: 'zhangjihao.markz.fun', root: '/usr/share/nginx/zhangjihao' },
];

const readNames = block => (block.match(/^\s*server_name\s+([^;]+);/m)?.[1] || '').trim().split(/\s+/).filter(Boolean);
const listensOn = (block, port) => new RegExp(`^\\s*listen\\s+${port}\\b`, 'm').test(block);
const routesToAdmin = block => block.includes('https://$host/admin.html') ||
  block.includes('return 301 /admin.html;') ||
  block.includes('try_files $uri $uri/ /admin.html;');
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
  const externalHttpsNames = unionNames(blocks.filter(block => listensOn(block, 443) &&
    externalFrontendRoutes.some(route => block.includes(route.root))));
  const jsonutilsHttpsNames = unionNames(blocks.filter(block => listensOn(block, 443) &&
    !externalFrontendRoutes.some(route => block.includes(route.root)) &&
    (routesToAdmin(block) || block.includes('try_files $uri $uri/ /index.html;'))));
  const adminHostFailures = hosts
    .filter(host => adminNames.has(host))
    .map(host => `${file}: 公开域名 ${host} 不能绑定到后台 server_name`);
  const externalHostFailures = externalFrontendRoutes.flatMap(({ host, root }) => [
    ...(!publicHttpNames.has(host) ? [`${file}: 外部域名 ${host} 未绑定到 HTTPS 跳转 server_name`] : []),
    ...(!externalHttpsNames.has(host) ? [`${file}: 外部域名 ${host} 未绑定到独立静态目录 ${root}`] : []),
    ...(jsonutilsHttpsNames.has(host) ? [`${file}: 外部域名 ${host} 不能绑定到 JSONUtils 主站或后台 server_name`] : []),
  ]);

  return [
    ...collectMissingHostFailures(file, hosts, publicHttpNames, '主站 HTTP 跳转 server_name'),
    ...collectMissingHostFailures(file, hosts, publicHttpsNames, '主站 HTTPS server_name'),
    ...adminHostFailures,
    ...externalHostFailures,
  ];
};
