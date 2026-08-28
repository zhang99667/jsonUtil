import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export const SEATBELT_TEST_SYSTEM_ENV = Object.freeze({
  PATH: '/usr/bin:/bin:/usr/sbin:/sbin', LANG: 'C', LC_ALL: 'C',
});

const OUTER_SANDBOX_DENIAL = 'sandbox-exec: sandbox_apply: Operation not permitted\n';
const CODEX_CANDIDATES = Object.freeze([
  '/Applications/ChatGPT.app/Contents/Resources/codex',
  '/Applications/Codex.app/Contents/Resources/codex',
]);

export const isOuterSandboxUnavailable = result => result.status === 71 && !result.error
  && result.signal === null && result.stdout === '' && result.stderr === OUTER_SANDBOX_DENIAL;

export const requireSeatbeltRuntime = (t) => {
  const result = spawnSync('/usr/bin/sandbox-exec',
    ['-p', '(version 1)\n(allow default)', '/usr/bin/true'],
    { encoding: 'utf8', env: SEATBELT_TEST_SYSTEM_ENV, timeout: 2_000 });
  if (isOuterSandboxUnavailable(result)) { t.skip('当前执行环境禁止嵌套 Seatbelt'); return false; }
  if (result.status !== 0) throw new Error('Seatbelt host capability probe failed');
  return true;
};

export const codexCandidate = () => CODEX_CANDIDATES.find((candidate) => {
  try {
    if (fs.realpathSync(candidate) !== candidate || !fs.statSync(candidate).isFile()) return false;
    return spawnSync('/usr/bin/codesign', ['--verify', '--strict', '--verbose=4', candidate], {
      env: SEATBELT_TEST_SYSTEM_ENV, stdio: 'ignore', timeout: 2_000,
    }).status === 0;
  } catch { return false; }
});
