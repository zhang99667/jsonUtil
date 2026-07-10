import fs from 'node:fs';
import path from 'node:path';

export const readExistingFile = (rootDir, file) => {
  const filePath = path.join(rootDir, file);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
};

const majorFromVersion = value => String(value ?? '').match(/\d+/)?.[0] ?? null;
const npmMajor = (content, packageName) => {
  const pkg = JSON.parse(content);
  return majorFromVersion(pkg.dependencies?.[packageName] ?? pkg.devDependencies?.[packageName]);
};
const springBootMajor = content => majorFromVersion(content.match(/<artifactId>spring-boot-starter-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/)?.[1]);
const javaMajor = content => majorFromVersion(content.match(/<java\.version>([^<]+)<\/java\.version>/)?.[1]);

export const sourceMajor = (content, fact) => ({
  javaMajor: () => javaMajor(content),
  npm: () => npmMajor(content, fact.packageName),
  springBootMajor: () => springBootMajor(content),
})[fact.sourceKind]?.() ?? null;

export const packageLockMajor = (rootDir, packageName) => {
  const content = readExistingFile(rootDir, 'frontend/package-lock.json');
  return content && majorFromVersion(JSON.parse(content).packages?.[`node_modules/${packageName}`]?.version);
};
