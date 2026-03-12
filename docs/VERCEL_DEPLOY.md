# Vercel 部署指南

## 1. 准备数据库

项目使用 PostgreSQL。推荐使用：

- **Vercel Postgres**：在 Vercel 控制台创建，与 Vercel 集成最好
- **Neon**：https://neon.tech ，免费额度充足
- **Supabase**：https://supabase.com

创建数据库后，获取连接字符串，格式类似：
```
postgresql://user:password@host:5432/database?sslmode=require
```

## 2. 在 Vercel 创建项目

1. 登录 [Vercel](https://vercel.com)
2. 点击 **Add New** → **Project**
3. 选择 **Import Git Repository**，连接 GitHub 并选择 `ariesjia/commander`
4. 保持默认配置（Framework Preset: Next.js）

## 3. 配置环境变量

在项目 **Settings** → **Environment Variables** 中添加：

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `DATABASE_URL` | PostgreSQL 连接字符串（必填） | `postgresql://user:pass@host/db?sslmode=require` |
| `SESSION_SECRET` | 会话加密密钥，至少 32 字符（必填） | 运行 `openssl rand -base64 32` 生成 |

**生成 SESSION_SECRET：**
```bash
openssl rand -base64 32
```

## 4. 初始化数据库

在首次部署前，本地执行一次 schema 同步和种子数据：

```bash
# 使用生产环境 DATABASE_URL
DATABASE_URL="你的生产数据库连接串" pnpm db:push
DATABASE_URL="你的生产数据库连接串" pnpm db:seed
```

或使用 Vercel 的数据库（如 Vercel Postgres）创建后，在 Vercel 控制台复制 `POSTGRES_URL`，本地执行：

```bash
pnpm db:push
pnpm db:seed
```

## 5. 部署

1. 点击 **Deploy** 开始部署
2. 部署完成后，访问 Vercel 提供的域名（如 `xxx.vercel.app`）

## 6. 可选：自定义域名

在 **Settings** → **Domains** 中添加你的域名，按提示配置 DNS。

## 7. 使用 Vercel Postgres（可选）

若在 Vercel 项目 **Storage** 中创建 Postgres 数据库，Vercel 会注入 `POSTGRES_URL`。在环境变量中新增 `DATABASE_URL`，值设为与 `POSTGRES_URL` 相同即可。

## 常见问题

**构建失败：Prisma Client 未生成**
- 已修改 `build` 脚本为 `prisma generate && next build`，构建时会自动生成

**数据库连接失败**
- 检查 `DATABASE_URL` 是否正确
- 云数据库需开启外网访问，并确认 IP 白名单（Neon/Supabase 通常默认允许）

**Cookie 在 HTTPS 下不生效**
- 代码中已根据 `NODE_ENV === "production"` 设置 `secure: true`
