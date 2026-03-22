-- 积分相关字段改为小数（PostgreSQL DECIMAL）

ALTER TABLE "Student"
  ALTER COLUMN "totalPoints" TYPE DECIMAL(16, 8) USING "totalPoints"::decimal,
  ALTER COLUMN "balance" TYPE DECIMAL(16, 8) USING "balance"::decimal,
  ALTER COLUMN "frozenPoints" TYPE DECIMAL(16, 8) USING "frozenPoints"::decimal;

ALTER TABLE "StudentMecha"
  ALTER COLUMN "points" TYPE DECIMAL(16, 8) USING "points"::decimal;

ALTER TABLE "Task"
  ALTER COLUMN "maxPoints" TYPE DECIMAL(16, 8) USING "maxPoints"::decimal,
  ALTER COLUMN "penaltyPoints" TYPE DECIMAL(16, 8) USING "penaltyPoints"::decimal;

ALTER TABLE "Reward"
  ALTER COLUMN "points" TYPE DECIMAL(16, 8) USING "points"::decimal;

ALTER TABLE "Exchange"
  ALTER COLUMN "pointsCost" TYPE DECIMAL(16, 8) USING "pointsCost"::decimal;

ALTER TABLE "PointsLog"
  ALTER COLUMN "amount" TYPE DECIMAL(16, 8) USING "amount"::decimal;

ALTER TABLE "TaskLog"
  ALTER COLUMN "pointsAwarded" TYPE DECIMAL(16, 8) USING "pointsAwarded"::decimal;

ALTER TABLE "MechaLevel"
  ALTER COLUMN "threshold" TYPE DECIMAL(16, 8) USING "threshold"::decimal;
