-- 已有 MechaSkill 行但缺少 kind 时，`prisma db push` 无法直接添加 NOT NULL 列。
-- 本迁移：保证枚举存在 → 按需添加可空 kind → 按 slug 回填 → NOT NULL → kind 索引。

DO $$ BEGIN
  CREATE TYPE "MechaSkillKind" AS ENUM ('ATTACK', 'DEFENSE', 'BUFF', 'HEAL', 'CONTROL', 'SUPPORT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'MechaSkill' AND column_name = 'kind'
  ) THEN
    ALTER TABLE "MechaSkill" ADD COLUMN "kind" "MechaSkillKind";
  END IF;
END $$;

UPDATE "MechaSkill" SET "kind" = (
  CASE "slug"
    WHEN 'xuanjia-rift-charge' THEN 'ATTACK'
    WHEN 'xuanjia-fort-barrage' THEN 'ATTACK'
    WHEN 'xuanjia-final-cleave' THEN 'ATTACK'
    WHEN 'star-shield-star-ring' THEN 'DEFENSE'
    WHEN 'star-shield-dawn-reflect' THEN 'DEFENSE'
    WHEN 'star-shield-absolute-dome' THEN 'DEFENSE'
    WHEN 'razor-zig-slash' THEN 'ATTACK'
    WHEN 'razor-thunder-lunge' THEN 'ATTACK'
    WHEN 'razor-final-verdict' THEN 'ATTACK'
    WHEN 'swift-wind-mark' THEN 'SUPPORT'
    WHEN 'swift-feint-pull' THEN 'CONTROL'
    WHEN 'swift-full-map' THEN 'BUFF'
    WHEN 'thunder-arc-sweep' THEN 'CONTROL'
    WHEN 'thunder-storm-zone' THEN 'ATTACK'
    WHEN 'thunder-judgment-bolt' THEN 'ATTACK'
    WHEN 'magnet-dipole-pull' THEN 'CONTROL'
    WHEN 'magnet-maelstrom' THEN 'CONTROL'
    WHEN 'magnet-collapse' THEN 'CONTROL'
    WHEN 'aether-drop-supply' THEN 'SUPPORT'
    WHEN 'aether-formation-shift' THEN 'BUFF'
    WHEN 'aether-sky-corridor' THEN 'SUPPORT'
    WHEN 'tidal-torpedo-snipe' THEN 'ATTACK'
    WHEN 'tidal-abyss-barrage' THEN 'ATTACK'
    WHEN 'tidal-devour-tide' THEN 'ATTACK'
    WHEN 'titan-fort-anchor-spike' THEN 'DEFENSE'
    WHEN 'titan-fort-bastion-salvo' THEN 'ATTACK'
    WHEN 'titan-fort-immovable' THEN 'DEFENSE'
    WHEN 'tunnel-drill-burst' THEN 'SUPPORT'
    WHEN 'tunnel-ambush-surge' THEN 'ATTACK'
    WHEN 'tunnel-deep-network' THEN 'SUPPORT'
    WHEN 'ark-emergency-drop' THEN 'SUPPORT'
    WHEN 'ark-perpetual-beacon' THEN 'BUFF'
    WHEN 'ark-covenant' THEN 'SUPPORT'
    WHEN 'medecac-life-pulse' THEN 'HEAL'
    WHEN 'medecac-swarm-aid' THEN 'HEAL'
    WHEN 'medecac-evac-corridor' THEN 'SUPPORT'
    WHEN 'iron-dragon-battery-volley' THEN 'ATTACK'
    WHEN 'iron-dragon-line-blockade' THEN 'ATTACK'
    WHEN 'iron-dragon-terminal-blitz' THEN 'ATTACK'
    WHEN 'hound-lock-bite' THEN 'CONTROL'
    WHEN 'hound-rabid-rush' THEN 'ATTACK'
    WHEN 'hound-alpha-mark' THEN 'BUFF'
    WHEN 'dive-ap-dart' THEN 'ATTACK'
    WHEN 'dive-sweep-bomb' THEN 'ATTACK'
    WHEN 'dive-sky-strike' THEN 'ATTACK'
    ELSE 'ATTACK'
  END
)::"MechaSkillKind"
WHERE "kind" IS NULL;

ALTER TABLE "MechaSkill" ALTER COLUMN "kind" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "MechaSkill_kind_idx" ON "MechaSkill"("kind");
