import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./driverTourLoader.ts', import.meta.url), 'utf8');

describe('driverTourLoader', () => {
  it('先加载 Driver 默认样式，再加载本地覆盖样式', () => {
    const driverCssIndex = source.indexOf("import('driver.js/dist/driver.css')");
    const overrideCssIndex = source.indexOf("import('../styles/driverTourOverrides.css')");
    const driverJsIndex = source.indexOf("const module = await import('driver.js')");

    expect(driverCssIndex).toBeGreaterThanOrEqual(0);
    expect(overrideCssIndex).toBeGreaterThan(driverCssIndex);
    expect(driverJsIndex).toBeGreaterThan(overrideCssIndex);
  });
});
