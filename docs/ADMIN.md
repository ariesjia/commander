# 管理后台说明

## Admin 模型

已在 Prisma schema 中新增 `Admin` 模型：

```prisma
model Admin {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
}
```

## 创建初始 Admin

在本仓库执行 seed 时，设置环境变量即可创建/更新 Admin：

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=your-secure-password pnpm db:seed
```

- 若该邮箱已存在，会更新密码
- 若未设置 `ADMIN_EMAIL` / `ADMIN_PASSWORD`，seed 会跳过 Admin 创建

## 独立管理后台仓库

管理后台使用单独仓库时，可：

1. **共用数据库**：新仓库配置相同的 `DATABASE_URL`
2. **共用 Schema**：
   - 方案 A：复制 `prisma/schema.prisma` 到新仓库（需手动同步）
   - 方案 B：使用 git submodule 或 npm workspace 引用本仓库的 schema
3. **密码校验**：使用 `bcrypt.compare(password, admin.passwordHash)`，与 Parent 一致
4. **JWT**：可复用本仓库的 `createSessionToken` 逻辑，payload 中加 `role: "admin"` 以区分

## 密码哈希

与 Parent 一致，使用 `bcrypt`，`SALT_ROUNDS = 10`。
