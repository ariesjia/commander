# MotiMech 文档目录

本目录包含项目文档，按类型分类如下。

---

## 一、项目概览

| 文档 | 说明 |
|------|------|
| [PRD-机甲指挥官-学生游戏化激励系统.md](./PRD-机甲指挥官-学生游戏化激励系统.md) | 产品需求文档，含功能、架构、数值、MVP 规划等 |

---

## 二、开发指南

| 文档 | 说明 |
|------|------|
| [ADD_MECHA.md](./ADD_MECHA.md) | 新增机甲指南：图片规范、种子数据、人物设定、seed 流程 |

---

## 三、开发需求（Stories）

待开发功能的技术方案与落地设计，按编号存放在 [stories/](./stories/) 目录。

| 文档 | 说明 |
|------|------|
| [0001-mecha-squad-achievements](./stories/0001-mecha-squad-achievements.md) | 机甲小队成就系统：收集指定机甲组合解锁成就，展示联合技 |
| [stories/](./stories/) | 开发需求文档：`000x-<name>.md` 格式 |

---

## 四、机甲设定

| 文档 | 说明 |
|------|------|
| [MECHA_CHARACTERS.md](./MECHA_CHARACTERS.md) | 机甲人物设定：定位、特点、职责（简明版） |
| [MECHA_SQUAD_ACHIEVEMENTS.md](./MECHA_SQUAD_ACHIEVEMENTS.md) | 机甲小队成就设计：基于协同关系与人物特质的收集成就 |

---

## 五、机甲详细设计

每份文档包含：外观、能力、装备、战术、等级进化、协同关系等。

### 人形机甲

| 文档 | 机甲 | 定位 |
|------|------|------|
| [玄甲-Xuanjia-详细设计.md](./玄甲-Xuanjia-详细设计.md) | 玄甲 | 正面强攻型 |
| [星盾-StarShield-详细设计.md](./星盾-StarShield-详细设计.md) | 星盾 | 全能防御型 |
| [利刃-Razor-详细设计.md](./利刃-Razor-详细设计.md) | 利刃 | 极速突袭型 |
| [风驰-Swift-详细设计.md](./风驰-Swift-详细设计.md) | 风驰 | 机动侦查型 |
| [雷啸-Thunder-详细设计.md](./雷啸-Thunder-详细设计.md) | 雷啸 | 范围爆发型 |
| [磁暴-Magnet-详细设计.md](./磁暴-Magnet-详细设计.md) | 磁暴 | 磁场控制型 |
| [织网-NetWeaver-详细设计.md](./织网-NetWeaver-详细设计.md) | 织网 | 信息战/电子战型 |

### 载具机甲

| 文档 | 机甲 | 定位 |
|------|------|------|
| [空境-Aether-详细设计.md](./空境-Aether-详细设计.md) | 空境 | 空中全域载具 |
| [沧龙-Tidal-详细设计.md](./沧龙-Tidal-详细设计.md) | 沧龙 | 水陆两栖载具 |
| [镇岳-TitanFort-详细设计.md](./镇岳-TitanFort-详细设计.md) | 镇岳 | 陆地堡垒载具 |
| [方舟-Ark-详细设计.md](./方舟-Ark-详细设计.md) | 方舟 | 后勤补给型 |
| [济世-Medevac-详细设计.md](./济世-Medevac-详细设计.md) | 济世 | 医疗运输载具 |
| [蜂巢-Hive-详细设计.md](./蜂巢-Hive-详细设计.md) | 蜂巢 | 无人机航母载具 |
| [铁龙-IronDragon-详细设计.md](./铁龙-IronDragon-详细设计.md) | 铁龙 | 多节列车载具 |

### 仿生机甲

| 文档 | 机甲 | 定位 |
|------|------|------|
| [猎犬-Hound-详细设计.md](./猎犬-Hound-详细设计.md) | 猎犬 | 四足突击型 |
| [俯冲-Dive-详细设计.md](./俯冲-Dive-详细设计.md) | 俯冲 | 仿生猛禽突击型 |
| [缚网-Reticle-详细设计.md](./缚网-Reticle-详细设计.md) | 缚网 | 仿生蛛型渗透型 |
| [地渊-Tunnel-详细设计.md](./地渊-Tunnel-详细设计.md) | 地渊 | 地下隧道仿生机械兽 |
| [沙蝎-SandStalker-详细设计.md](./沙蝎-SandStalker-详细设计.md) | 沙蝎 | 沙漠/极地仿生机械兽 |

---

## 六、运维与部署

| 文档 | 说明 |
|------|------|
| [ADMIN.md](./ADMIN.md) | 管理后台说明：Admin 模型、创建方式、独立仓库对接 |
| [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) | Vercel 部署指南：数据库、环境变量、构建配置 |
| [PWA.md](./PWA.md) | PWA / Service Worker：预缓存 public、机甲与音效运行时缓存 |
