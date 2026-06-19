# CI/CD 使用说明

本项目采用两层流水线：

- **CI**: 每次推送或 PR 运行前端类型检查、Lint、依赖安全审计、单元测试、解析质量与性能门禁、生产构建，后端 Maven 测试/打包，以及 Docker 镜像构建校验。
- **CD**: 手动触发，通过 SSH/rsync 将源码同步到服务器，再在服务器上执行 Docker Compose 构建和发布。

## GitHub Actions

### CI

工作流文件：`.github/workflows/ci.yml`

关键检查：

- `frontend`: `npm ci`、`npm run typecheck`、`npm run lint`、`npm run audit:security`、`npm test`、`npm run corpus:scheme`、`npm run corpus:snapshot:check`、`npm run corpus:snapshot:diff -- --before fixtures/scheme-corpus/corpus-quality.baseline.snapshot.json --after <current-snapshot.json> --strict`、`npm run perf:scheme -- --iterations 3 --strict`、`npm run perf:jsonpath -- --iterations 3 --strict`、`npm run build`、`npm run check:preloads`、`npm run perf:e2e`、`npm run test:e2e`
  - `npm run lint` 使用 ESLint flat config 执行错误级静态门禁；需要查看历史 warning 时可运行 `npm run lint:report`
  - `npm run audit:security` 使用 npm audit 拦截 moderate 及以上依赖漏洞；低危漏洞可在依赖治理批次中评估，不阻塞普通功能迭代
  - `npm run corpus:scheme` 独立校验脱敏 response corpus，当前覆盖激励广告、落地页与电话拨打三类样本，固定主 CMD Schema、Top 热点 Schema、占位符、扫描位置和质量指标
  - `npm run corpus:snapshot:check` 输出 corpus 质量快照，并在 expected 阈值不通过、cmdHandler ignored extra 路径数量超过基线、必需 CMD Schema/运行时占位符/扫描位置缺失、样本缺失 expected snapshot、缺失 cmdHandler expected 或 cmdHandler 关键子集不对齐时让 CI 失败；ignored extra 超限会在 strict 日志中带出路径样例，方便直接定位样本质量变化
  - `Scheme corpus quality snapshot` 会把覆盖率、资源/CMD 热点、必需项失败、cmdHandler 对齐结果和 ignored extra 路径样例写入 GitHub Step Summary，并上传 `scheme-corpus-quality-snapshot` artifact 供评审下载
  - `npm run perf:scheme -- --iterations 3 --strict` 会通过复制真实 `data.video` 条目构造 50KB / 250KB 脱敏 response，校验核心解析耗时、展开记录、CMD 结构、CMD 字段、资源字段、待检查和跳过数量，并上传 `scheme-performance-budget` artifact
  - `npm run perf:jsonpath -- --iterations 3 --strict` 会复用脱敏 response 和大量命中列表，校验 JSONPath 大查询耗时、命中数、高亮范围和结果上限保护，并上传 `jsonpath-performance-budget` artifact
  - `npm run perf:e2e` 会通过独立 Playwright performance 配置校验浏览器 Worker 端到端响应，覆盖 JSONPath 取消、Scheme 取消、连续大 response 解析和已加载面板关闭态大输入切换，并上传 `browser-worker-performance-budget` artifact
  - `Scheme corpus quality trend` 会用 `frontend/fixtures/scheme-corpus/corpus-quality.baseline.snapshot.json` 对比本次生成的快照，strict 模式会把 requiredChecks 必需项失败数量增加、cmdHandler ignored extra 路径数量上升等变化视为解析质量退化，并在摘要中展示 ignored extra 路径新增/消失样例；当前 CI 还通过 `--resource-type-drop video=20`、`--resource-type-rise lottie=20` 把视频占比骤降或 Lottie 占比异常上升纳入门禁，并上传 `scheme-corpus-quality-trend` artifact
- `backend`: `mvn -B test`、`node scripts/ci/check-backend-api-matrix.mjs`、`mvn -B package -DskipTests`
- `docker`: `docker build ./backend`、`docker build ./frontend`、带测试环境变量执行 `docker compose config`

#### 质量趋势基线更新

当解析逻辑或 corpus 样本发生预期变化时，先运行 `npm run corpus:snapshot:diff -- --before fixtures/scheme-corpus/corpus-quality.baseline.snapshot.json --after <new-snapshot.json> --strict --resource-type-drop video=20 --resource-type-rise lottie=20` 查看趋势。只有在变化能解释为解析覆盖提升、样本脱敏更新或业务素材结构预期变化时，才运行 `npm run corpus:snapshot:baseline` 更新 `corpus-quality.baseline.snapshot.json`。

如果 diff 出现覆盖率下降、CMD/资源热点消失、requiredChecks 失败、cmdHandler ignored extra 上升，或视频/Lottie 占比漂移无法由样本变化解释，应优先回退实现或修复解析逻辑，不应直接更新 baseline。

### CD

工作流文件：`.github/workflows/deploy.yml`

需要在 GitHub 仓库配置 Secret：

- `DEPLOY_SSH_KEY`: 服务器部署用户的私钥内容

手动触发参数：

- `host`: 服务器地址，默认 `39.97.237.248`
- `user`: SSH 用户，默认 `markz`
- `port`: SSH 端口，默认 `22`
- `app_dir`: 远程应用目录，默认 `/home/markz/apps/jsonUtil`
- `deploy_mode`: 发布模式，`full` 为远端全量 Docker Compose 构建，`prebuilt-frontend` 为 Actions 预构建前端并只替换远端前端服务
- `health_check_urls`: 远程健康检查 URL 列表，默认 `http://127.0.0.1 http://127.0.0.1/api/visitor/ping`

CD 不依赖远程 `git pull`，而是同步当前 workflow checkout 的源码到服务器，适合服务器没有 GitHub 凭据的场景。

当 `deploy_mode=prebuilt-frontend` 时，工作流会先在 GitHub runner 中执行 `npm ci`、`npm run build` 和 `npm run check:preloads`，同步 `frontend/dist` 后在远端使用 `Dockerfile.prebuilt` 只重建 `app-frontend`。该模式适合只更新前端静态资源、远端 Node/npm 网络不稳定，或希望避免后端与数据库无意义重启的场景。

## 本地 CI

在本机完整跑一遍关键检查：

```bash
bash scripts/ci/local-ci.sh
```

如果本机没有 Maven，脚本会尝试使用 `maven:3.9-eclipse-temurin-17` Docker 镜像运行后端检查。此时需要 Docker daemon 已启动。

如果本机安装了多个 JDK，且没有显式设置 `JAVA_HOME`，macOS 下脚本会优先选择 `/usr/libexec/java_home -v 17`，避免 Maven 误用过新的 JDK 触发 Mockito / Byte Buddy mock 兼容问题。

本地 CI 的 `docker compose config` 会使用仅用于配置校验的假环境变量填充 `POSTGRES_PASSWORD`、`SPRING_DATASOURCE_PASSWORD` 和 `JWT_SECRET`，因此不依赖本机存在生产 `.env` 文件。

本地 CI 还会运行 `node scripts/ci/check-backend-api-matrix.mjs`，扫描后端 Controller 并校验所有 API 都已写入 [后端 API 权限矩阵](BACKEND-API-MATRIX.md)，避免新增接口绕过权限文档评审。

## 本机直连服务器部署

当 GitHub push 或 GitHub Actions 不可用时，可以从本机通过 SSH 直连服务器部署：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
SSH_SERVER_ALIVE_INTERVAL=15 \
SSH_SERVER_ALIVE_COUNT_MAX=10 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-docker-compose-deploy.sh
```

该脚本会：

1. 检查本机与远程部署依赖
2. 创建远程应用目录
3. 使用 SSH keepalive 参数保持长时间 Docker build 期间的连接
4. 通过 `rsync --delete` 同步源码，排除 `.git`、`.env`、`node_modules`、`artifacts`、`outputs`、`.vite`、`test-results`、构建产物等目录
5. 在远程执行 `scripts/deploy/remote-docker-compose-deploy.sh`
6. 运行 `docker compose up -d --build --remove-orphans`
7. 执行健康检查，跟随 HTTP/HTTPS 跳转后最终要求返回 `200`

`SSH_SERVER_ALIVE_INTERVAL` 与 `SSH_SERVER_ALIVE_COUNT_MAX` 默认分别为 `15` 和 `10`。如果远端构建阶段长时间无输出导致 SSH 断开，可按网络环境调大这两个值。

前端 Docker 构建会复制 `frontend/.npmrc` 到依赖安装层，`npm ci --include=optional` 默认启用多次 fetch 重试和较长网络超时，用于降低 registry 临时断连、`ECONNRESET` 或平台 optional 包下载失败导致的发布中断。

如果只需要替换前端，或远端 Node/npm/Docker Hub 网络不稳定，可以使用本机预构建前端快速部署：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
SSH_SERVER_ALIVE_INTERVAL=15 \
SSH_SERVER_ALIVE_COUNT_MAX=10 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-prebuilt-frontend-deploy.sh
```

该脚本会先在本机执行 `npm run build` 和 `npm run check:preloads`，再同步 `frontend/dist`，并在远端使用 `Dockerfile.prebuilt` 只重建 `app-frontend`。后端和数据库不会因为前端静态资源更新而被重启。

本机 SSH 部署完成后会默认执行公网部署验证，检查 `PUBLIC_BASE_URL/version.json` 的版本是否等于当前 `frontend/package.json`，并确认 `PUBLIC_BASE_URL/api/visitor/ping` 返回 `pong`。默认 `PUBLIC_BASE_URL=https://$SSH_HOST`，可用 `PUBLIC_VERIFY_ENABLED=false` 跳过，或单独运行：

```bash
PUBLIC_BASE_URL=https://39.97.237.248 \
bash scripts/deploy/verify-public-deploy.sh
```

如果远端根盘已满，优先清理 Docker 未使用镜像或构建缓存，不要删除 `db-data`、`upload-data` 等业务 volume；同步脚本默认不会再上传本机测试输出和临时产物。

远端部署会在 `docker compose up` 前检查应用目录所在磁盘水位，默认已使用 `90%` 时打印告警和 `docker system df` 摘要，达到 `95%` 时停止部署。可通过 `DEPLOY_DISK_WARN_USED_PERCENT`、`DEPLOY_DISK_MAX_USED_PERCENT` 调整阈值，或临时设置 `DEPLOY_DISK_CHECK_ENABLED=false` 跳过检查。

也可以单独运行只读磁盘健康检查，提前查看磁盘水位、Docker 空间摘要、运行容器、应用目录占用和安全清理建议：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-disk-health.sh
```

该脚本默认不执行清理动作；如果希望在巡检或 CI 中把水位告警转成非零退出码，可设置 `DISK_HEALTH_STRICT=true`。

当磁盘健康检查提示 Docker 有可回收空间时，可先用 Docker 清理脚本 dry-run 查看计划动作：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-docker-prune.sh
```

确认只清理已停止容器、未使用构建缓存和未被容器引用的镜像后，再显式执行：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
REMOTE_DOCKER_PRUNE_APPLY=true \
REMOTE_DOCKER_PRUNE_CONFIRM=prune-docker-unused \
bash scripts/deploy/ssh-docker-prune.sh
```

该脚本不会执行 `docker volume prune`，避免误删 `db-data`、`upload-data` 等业务 volume。

同步脚本会读取 `scripts/deploy/rsync-excludes.txt`，统一排除 `.DS_Store`、`.vscode`、`.idea`、`.cursor`、`.comate`、`.cursorrules`、`AGENTS.md`、`CLAUDE.md` 等非运行时开发文件。本机部署和 GitHub Actions 共用同一份清单；磁盘健康检查会列出远端历史残留，并只输出人工确认后的清理建议，不会自动删除。

远端历史残留可以用独立脚本清理；脚本默认 dry-run，只列候选项，不删除文件：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-prune-dev-artifacts.sh
```

确认候选项都是非运行时文件后，再显式执行：

```bash
REMOTE_CLEAN_APPLY=true \
REMOTE_CLEAN_CONFIRM=prune-dev-artifacts \
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-prune-dev-artifacts.sh
```

健康检查不会把 Nginx `301/302` 当作成功；`/api/visitor/ping` 必须跟随后端转发后返回 `200`，否则脚本会继续等待或失败。

## 远程服务器要求

服务器需要具备：

- Docker
- Docker Compose v2 或 `docker-compose`
- curl
- rsync
- 可写的应用目录
- 如果使用当前 `docker-compose.yml` 的 HTTPS 配置，需要证书目录存在：`/www/server/panel/vhost/cert/39.97.237.248`

生产 `docker-compose.yml` 只暴露前端 Nginx 的 `80/443`，后端 `8080` 与数据库 `5432` 仅在 Docker 网络内访问。需要本地调试端口时使用 `docker-compose.local.yml`。

首次部署前必须在远程应用目录创建 `.env`，否则发布脚本会直接失败：

```bash
mkdir -p /home/markz/apps/jsonUtil
cd /home/markz/apps/jsonUtil
cp deploy.env.example .env
vim .env
```

至少需要替换：

- `POSTGRES_PASSWORD`
- `SPRING_DATASOURCE_PASSWORD`
- `JWT_SECRET`

如果上述值仍以 `change-me` 开头，发布脚本会拒绝继续执行。

如果首次部署需要自动创建管理员，可以临时配置：

- `ADMIN_BOOTSTRAP_ENABLED=true`
- `ADMIN_BOOTSTRAP_USERNAME`
- `ADMIN_BOOTSTRAP_PASSWORD`
- `ADMIN_BOOTSTRAP_EMAIL`

管理员创建完成后，建议将 `ADMIN_BOOTSTRAP_ENABLED` 改回 `false`，避免后续误操作。

后续同步会保留远程 `.env` / `.env.*`，避免覆盖生产密钥。

## 回滚建议

当前 Docker Compose 发布以重新构建镜像为主。建议后续增加镜像 tag 和 registry 发布后，再做基于镜像版本的快速回滚。
