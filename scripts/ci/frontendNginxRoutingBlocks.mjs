export const readNginxServerNames = block => (block.match(/^\s*server_name\s+([^;]+);/m)?.[1] || '').trim().split(/\s+/).filter(Boolean);

export const listensOnPort = (block, port) => new RegExp(`^\\s*listen\\s+${port}\\b`, 'm').test(block);

export const routesToAdminEntrypoint = block => [
  'https://$host/admin.html', 'return 301 /admin.html;', 'try_files $uri $uri/ /admin.html;',
].some(snippet => block.includes(snippet));

const hasAll = (block, snippets) => snippets.every(snippet => block.includes(snippet));
const redirectsHtmlEntrypoint = block => /^\s*return\s+30[1278]\s+\/(?:admin|index)\.html;/m.test(block);
const readRootLocation = block => block.match(/location\s*=\s*\/\s*\{[\s\S]*?\n\s*\}/)?.[0] || '';
const readAdminHtmlLocation = block => block.match(/location\s*=\s*\/admin\.html\s*\{[\s\S]*?\n\s*\}/)?.[0] || '';

export const protectsExternalAdminEntrypoint = (block) => {
  const adminLocation = readAdminHtmlLocation(block);
  const snippets = ['location = /admin.html', 'try_files /index.html =404;', 'Clear-Site-Data "\\"cache\\""',
    'history.replaceState(null,document.title,"/")', 'location.replace("/?__jsonutils_route_recovered=1")'];
  return hasAll(adminLocation, snippets) && !redirectsHtmlEntrypoint(adminLocation);
};

export const protectsExternalHttpAdminEntrypoint = (block) => {
  const adminLocation = readAdminHtmlLocation(block);
  const snippets = ['Cache-Control "no-cache, no-store, must-revalidate"', 'return 301 https://$host/;'];
  return hasAll(adminLocation, snippets) && !adminLocation.includes('https://$host$request_uri');
};

export const protectsExternalRootEntrypoint = (block) => {
  const rootLocation = readRootLocation(block);
  const snippets = ['location = /', 'try_files /index.html =404;', 'Clear-Site-Data "\\"cache\\""',
    '__jsonutils_route_recovered=1', 'history.replaceState(null,document.title,"/")'];
  return hasAll(rootLocation, snippets);
};

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
export const unionNginxServerNames = blocks => new Set(blocks.flatMap(readNginxServerNames));
