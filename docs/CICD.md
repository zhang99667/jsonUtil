# CI/CD 使用说明

本项目采用两层流水线：

- **CI**: 每次推送或 PR 运行前端类型检查、单元测试、生产构建，后端 Maven 测试/打包，以及 Docker 镜像构建校验。
- **CD**: 手动触发，通过 SSH/rsync 将源码同步到服务器，再在服务器上执行 Docker Compose 构建和发布。

## GitHub Actions

### CI

工作流文件：`.github/workflows/ci.yml`

关键检查：

- `frontend`: `npm ci`、`npm run typecheck`、`npm test`、`npm run corpus:scheme`、`npm run corpus:snapshot:check`、`npm run build`、`npm run check:preloads`、`npm run test:e2e`
  - `npm run corpus:scheme` 独立校验脱敏 response corpus，固定主 CMD Schema、Top 热点 Schema、占位符、扫描位置和质量指标
  - `npm run corpus:snapshot:check` 输出 corpus 质量快照，并在 expected 阈值不通过时让 CI 失败，方便直接定位样本质量变化
  - `Scheme corpus quality snapshot` 会写入 GitHub Step Summary，并上传 `scheme-corpus-quality-snapshot` artifact 供评审下载
- `backend`: `mvn -B test`、`mvn -B package -DskipTests`
- `docker`: `docker build ./backend`、`docker build ./frontend`、带测试环境变量执行 `docker compose config`

### CD

工作流文件：`.github/workflows/deploy.yml`

需要在 GitHub 仓库配置 Secret：

- `DEPLOY_SSH_KEY`: 服务器部署用户的私钥内容

手动触发参数：

- `host`: 服务器地址，默认 `39.97.237.248`
- `user`: SSH 用户，默认 `markz`
- `port`: SSH 端口，默认 `22`
- `app_dir`: 远程应用目录，默认 `/home/markz/apps/jsonUtil`
- `health_check_urls`: 远程健康检查 URL 列表，默认 `http://127.0.0.1 http://127.0.0.1/api/visitor/ping`

CD 不依赖远程 `git pull`，而是同步当前 workflow checkout 的源码到服务器，适合服务器没有 GitHub 凭据的场景。

## 本地 CI

在本机完整跑一遍关键检查：

```bash
bash scripts/ci/local-ci.sh
```

如果本机没有 Maven，脚本会尝试使用 `maven:3.9-eclipse-temurin-17` Docker 镜像运行后端检查。此时需要 Docker daemon 已启动。

## 本机直连服务器部署

当 GitHub push 或 GitHub Actions 不可用时，可以从本机通过 SSH 直连服务器部署：

```bash
SSH_HOST=39.97.237.248 \
SSH_USER=markz \
SSH_KEY=~/.ssh/id_ed25519 \
REMOTE_APP_DIR=/home/markz/apps/jsonUtil \
bash scripts/deploy/ssh-docker-compose-deploy.sh
```

该脚本会：

1. 检查本机与远程部署依赖
2. 创建远程应用目录
3. 通过 `rsync --delete` 同步源码，排除 `.git`、`.env`、`node_modules`、构建产物等目录
4. 在远程执行 `scripts/deploy/remote-docker-compose-deploy.sh`
5. 运行 `docker compose up -d --build --remove-orphans`
6. 执行健康检查

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
