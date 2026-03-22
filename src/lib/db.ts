import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * 迁移把列从 Int 改成 Decimal 等之后，Postgres 可能仍报
 * `cached plan must not change result type`（扩展查询里缓存的 generic plan 与新型不匹配）。
 * 在连接串上加 `pgbouncer=true` 会让 Prisma 走兼容路径，避免该问题（亦用于 PgBouncer 事务池）。
 *
 * - 开发环境：默认自动追加 `pgbouncer=true`，可用 `PRISMA_PGBOUNCER=0` 关闭。
 * - 生产环境：仅当 `PRISMA_PGBOUNCER=1` 时追加；直连 RDS 一般不必开。
 */
function databaseUrlForPrisma(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }
  if (raw.startsWith("prisma+")) {
    return raw;
  }

  const v = process.env.PRISMA_PGBOUNCER?.toLowerCase();
  const optOut = v === "0" || v === "false" || v === "off";
  const optIn = v === "1" || v === "true" || v === "on";
  const usePgbouncerFlag =
    process.env.NODE_ENV === "development" ? !optOut : optIn;

  if (!usePgbouncerFlag) {
    return raw;
  }

  try {
    const u = new URL(raw);
    if (u.searchParams.get("pgbouncer") === "true") {
      return raw;
    }
    u.searchParams.set("pgbouncer", "true");
    return u.toString();
  } catch {
    return raw;
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: { url: databaseUrlForPrisma() },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
