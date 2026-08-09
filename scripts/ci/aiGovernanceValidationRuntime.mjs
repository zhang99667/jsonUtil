// 为 validation 命令生成闭合环境，并以固定无 shell 边界启动。

import { spawnSync } from 'node:child_process';
import os from 'node:os';

import {
  assertJsonutilsValidationPlatformSupported,
  validationRuntimeFailure,
} from './aiGovernanceValidationRuntimePrimitives.mjs';

export const buildJsonutilsValidationCommandEnvironment = ({ descriptor, runtime, safePath }) => {
  assertJsonutilsValidationPlatformSupported();
  const profiles = new Set([
    'jsonutils-validation-node-v1',
    'jsonutils-validation-compose-config-v1',
  ]);
  if (!profiles.has(descriptor.envProfile)) {
    throw validationRuntimeFailure('VALIDATION_ENV_PROFILE_INVALID');
  }
  const clean = {
    PATH: safePath,
    HOME: runtime.home,
    CODEX_HOME: runtime.codex,
    DOCKER_CONFIG: runtime.docker,
    TMPDIR: runtime.tmp,
    CI: '1',
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: os.devNull,
    GIT_NO_LAZY_FETCH: '1',
    GIT_NO_REPLACE_OBJECTS: '1',
    GIT_OPTIONAL_LOCKS: '0',
    LANG: 'C',
    LC_ALL: 'C',
  };
  if (descriptor.envProfile === 'jsonutils-validation-compose-config-v1') {
    Object.assign(clean, {
      COMPOSE_DISABLE_ENV_FILE: '1',
      POSTGRES_PASSWORD: 'ci-postgres-password',
      SPRING_DATASOURCE_PASSWORD: 'ci-postgres-password',
      JWT_SECRET: 'ci-jwt-secret-for-compose-validation',
    });
  }
  return clean;
};

export const spawnJsonutilsValidationCommand = ({ rootBinding, descriptor, binding, env }) => {
  assertJsonutilsValidationPlatformSupported();
  return spawnSync(binding.realPath, descriptor.argv, {
    cwd: rootBinding.realPath,
    env,
    shell: false,
    stdio: 'ignore',
    timeout: descriptor.timeout,
    killSignal: 'SIGKILL',
  });
};
