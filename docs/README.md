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
| [0002-student-battle-system](./stories/0002-student-battle-system.md) | 学生每日战斗：当日任务完成积分门槛、后端裁决、可配置胜率与奖励、流水入账 |
| [0003-student-item-inventory](./stories/0003-student-item-inventory.md) | 学生道具库：道具名称/介绍/图片 + 库存展示（盲盒与碎片为后续 story，本文仅设计预留） |
| [0004-mecha-skills](./stories/0004-mecha-skills.md) | 机甲里程碑技能：等级 2/5/7 解锁，`MechaSkill` 表（含类型枚举：攻击/防御/增益/治疗/控制/支援）、全机甲技能文案与 seed 同步策略 |
| [0005-battle-log-server-skills](./stories/0005-battle-log-server-skills.md) | 战斗演出日志后端化：按技能类型反馈（治疗/增益/防御/支援等）、数值与文案随机，胜率与奖励逻辑不变 |
| [0006-mecha-evolution-video](./stories/0006-mecha-evolution-video.md) | 机甲可选进化/展示视频：库表与 API 字段，学生端白底精致弹层内播放（适配白底素材） |
| [0007-student-daily-maintenance-math](./stories/0007-student-daily-maintenance-math.md) | 学生每日机甲维修（一年级口算）：维修叙事、出题器抽象、每日一次、无积分；家长可关开（默认开） |
| [0008-combat-power-system](./stories/0008-combat-power-system.md) | 战力值系统：战力 = **各已领养机甲** `MechaLevel.level` **求和**×系数 + 道具库存贡献（`Item.combatBonus`×数量） |
| [0009-student-driving-guide-hanzi](./stories/0009-student-driving-guide-hanzi.md) | 学生「驾驶指南」：每回 10 字、逐字拼音、整词手写；无语音；成功鼓励/失败提示；识别方案见 story |
| [0010-student-mecha-companion-chat](./stories/0010-student-mecha-companion-chat.md) | 学生与主机甲 AI 对话：录音输入、TTS 朗读回复、新建会话与历史、世界观+机甲档案系统提示词 |
| [0011-parent-driving-guide-custom-word-list](./stories/0011-parent-driving-guide-custom-word-list.md) | 家长端配置驾驶指南词语列表：按学生独立存储，未配置时用默认词库 |
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
