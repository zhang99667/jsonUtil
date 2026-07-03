import fs from 'node:fs';
import path from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;

export const writeStaticRetentionFixture = (tempDir, now = Date.now()) => {
  const sourceDir = path.join(tempDir, 'source');
  const targetDir = path.join(tempDir, 'target');
  fs.mkdirSync(path.join(sourceDir, 'assets'), { recursive: true });
  fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });

  fs.writeFileSync(path.join(sourceDir, 'index.html'), '<html>current</html>');
  fs.writeFileSync(path.join(sourceDir, 'assets/current-hash.js'), 'current();');
  fs.writeFileSync(path.join(targetDir, 'assets/recent-old-hash.js'), 'recentOld();');
  fs.writeFileSync(path.join(targetDir, 'assets/expired-old-hash.js'), 'expiredOld();');

  fs.utimesSync(
    path.join(targetDir, 'assets/recent-old-hash.js'),
    new Date(now - 5 * DAY_MS),
    new Date(now - 5 * DAY_MS)
  );
  fs.utimesSync(
    path.join(targetDir, 'assets/expired-old-hash.js'),
    new Date(now - 20 * DAY_MS),
    new Date(now - 20 * DAY_MS)
  );

  return { sourceDir, targetDir };
};
