import { listensOnPort, readNginxServerNames, routesToAdminEntrypoint, unionNginxServerNames } from './frontendNginxRoutingBlocks.mjs';

export const buildNginxRoutingClassifications = (blocks, externalRoutes) => {
  const publicHttpNames = unionNginxServerNames(blocks.filter(block =>
    listensOnPort(block, 80) && block.includes('https://$host$request_uri')));
  const publicHttpsNames = unionNginxServerNames(blocks.filter(block =>
    listensOnPort(block, 443) && block.includes('try_files $uri $uri/ /index.html;')));
  const adminNames = unionNginxServerNames(blocks.filter(routesToAdminEntrypoint));
  const externalHttpsBlocks = blocks.filter(block => listensOnPort(block, 443) &&
    externalRoutes.some(route => block.includes(route.root)));
  const externalHttpBlocks = blocks.filter(block => listensOnPort(block, 80) &&
    externalRoutes.some(route => readNginxServerNames(block).includes(route.host)));
  const externalHttpsNames = unionNginxServerNames(externalHttpsBlocks);
  const jsonutilsHttpsNames = unionNginxServerNames(blocks.filter(block => listensOnPort(block, 443) &&
    !externalRoutes.some(route => block.includes(route.root)) &&
    (routesToAdminEntrypoint(block) || block.includes('try_files $uri $uri/ /index.html;'))));

  return { publicHttpNames, publicHttpsNames, adminNames, externalHttpBlocks, externalHttpsBlocks, externalHttpsNames, jsonutilsHttpsNames };
};
