"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, KeyRound, LogOut, Check, BookOpen, Wrench, Swords, Car, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, updateNickname, updatePin, logout } = useAuth();
  const {
    showPinyin,
    updateShowPinyin,
    maintenanceMath,
    updateMaintenanceMathEnabled,
    dailyBattleMinTaskPoints,
    updateDailyBattleMinTaskPoints,
    drivingGuide,
    updateDrivingGuideEnabled,
    mechaChat,
    updateMechaChatEnabled,
  } = useData();
  const router = useRouter();

  const [nickname, setNickname] = useState(user?.childNickname ?? "");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [savedNickname, setSavedNickname] = useState(false);
  const [savedPin, setSavedPin] = useState(false);
  const [pinyinOn, setPinyinOn] = useState(showPinyin);
  const [savingPinyin, setSavingPinyin] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingDrivingGuide, setSavingDrivingGuide] = useState(false);
  const [savingMechaChat, setSavingMechaChat] = useState(false);
  const [battleMinPtsDraft, setBattleMinPtsDraft] = useState(dailyBattleMinTaskPoints);
  const [savingBattleMin, setSavingBattleMin] = useState(false);
  const [savedBattleMin, setSavedBattleMin] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);
  const [savingPin, setSavingPin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [drivingGuideWordsText, setDrivingGuideWordsText] = useState("");
  const [loadingDrivingGuideWords, setLoadingDrivingGuideWords] = useState(true);
  const [savingDrivingGuideWords, setSavingDrivingGuideWords] = useState(false);
  const [drivingGuideWordsError, setDrivingGuideWordsError] = useState<string | null>(null);
  const [savedDrivingGuideWords, setSavedDrivingGuideWords] = useState(false);

  useEffect(() => {
    setNickname(user?.childNickname ?? "");
  }, [user?.childNickname]);

  useEffect(() => {
    setPinyinOn(showPinyin);
  }, [showPinyin]);

  useEffect(() => {
    setBattleMinPtsDraft(dailyBattleMinTaskPoints);
  }, [dailyBattleMinTaskPoints]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingDrivingGuideWords(true);
      setDrivingGuideWordsError(null);
      try {
        const data = await api.get<{ words: string[]; usingDefault: boolean }>(
          "/api/parent/student/driving-guide-words",
        );
        if (cancelled) return;
        setDrivingGuideWordsText(data.words.length ? data.words.join("\n") : "");
      } catch {
        if (!cancelled) setDrivingGuideWordsError("词表加载失败");
      } finally {
        if (!cancelled) setLoadingDrivingGuideWords(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    setSavingNickname(true);
    try {
      await updateNickname(nickname.trim());
      setSavedNickname(true);
      setTimeout(() => setSavedNickname(false), 2000);
    } catch {
      // ignore
    } finally {
      setSavingNickname(false);
    }
  };

  const handlePinInput = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);
    if (val && idx < 3) {
      document.getElementById(`settings-pin-${idx + 1}`)?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      document.getElementById(`settings-pin-${idx - 1}`)?.focus();
    }
  };

  const handleTogglePinyin = async () => {
    const next = !pinyinOn;
    setSavingPinyin(true);
    try {
      await updateShowPinyin(next);
      setPinyinOn(next);
    } catch {
      // ignore
    } finally {
      setSavingPinyin(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setSavingMaintenance(true);
    try {
      await updateMaintenanceMathEnabled(!maintenanceMath.enabled);
    } catch {
      // ignore
    } finally {
      setSavingMaintenance(false);
    }
  };

  const handleToggleDrivingGuide = async () => {
    setSavingDrivingGuide(true);
    try {
      await updateDrivingGuideEnabled(!drivingGuide.enabled);
    } catch {
      // ignore
    } finally {
      setSavingDrivingGuide(false);
    }
  };

  const handleSaveDrivingGuideWords = async () => {
    setSavingDrivingGuideWords(true);
    setDrivingGuideWordsError(null);
    setSavedDrivingGuideWords(false);
    try {
      const data = await api.put<{ words: string[]; usingDefault: boolean }>(
        "/api/parent/student/driving-guide-words",
        { text: drivingGuideWordsText },
      );
      setDrivingGuideWordsText(data.words.length ? data.words.join("\n") : "");
      setSavedDrivingGuideWords(true);
      setTimeout(() => setSavedDrivingGuideWords(false), 2000);
    } catch (e) {
      setDrivingGuideWordsError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSavingDrivingGuideWords(false);
    }
  };

  const handleToggleMechaChat = async () => {
    setSavingMechaChat(true);
    try {
      await updateMechaChatEnabled(!mechaChat.enabled);
    } catch {
      // ignore
    } finally {
      setSavingMechaChat(false);
    }
  };

  const handleSaveBattleMinPts = async () => {
    const n = Math.max(0, Math.min(10, Math.round(Number(battleMinPtsDraft))));
    setSavingBattleMin(true);
    try {
      await updateDailyBattleMinTaskPoints(n);
      setBattleMinPtsDraft(n);
      setSavedBattleMin(true);
      setTimeout(() => setSavedBattleMin(false), 2000);
    } catch {
      // ignore
    } finally {
      setSavingBattleMin(false);
    }
  };

  const handleSavePin = async () => {
    const pinStr = pin.join("");
    if (pinStr.length !== 4) return;
    setSavingPin(true);
    try {
      await updatePin(pinStr);
      setSavedPin(true);
      setPin(["", "", "", ""]);
      setTimeout(() => setSavedPin(false), 2000);
    } catch {
      // ignore
    } finally {
      setSavingPin(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-6">
      <h1 className="text-xl font-semibold text-p-text">设置</h1>

      {/* Nickname */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">孩子昵称</h2>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="孩子的称呼"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveNickname} size="md" loading={savingNickname}>
            {savedNickname ? <Check size={16} /> : "保存"}
          </Button>
        </div>
      </div>

      {/* 注音 */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">是否注音</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          开启后，学生端的奖励列表和任务列表会在文字上方显示拼音
        </p>
        <button
          type="button"
          onClick={handleTogglePinyin}
          disabled={savingPinyin}
          className={`flex items-center justify-between w-full rounded-lg border-2 px-4 py-3 transition-colors cursor-pointer ${
            pinyinOn ? "border-p-accent bg-p-accent/5" : "border-p-border bg-white hover:bg-gray-50"
          }`}
        >
          <span className="text-sm font-medium text-p-text">{pinyinOn ? "已开启" : "已关闭"}</span>
          <div
            className={`relative h-6 w-11 rounded-full transition-colors ${
              pinyinOn ? "bg-p-accent" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                pinyinOn ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 机甲维修（口算） */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Wrench size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">机甲维修</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          开启后，孩子可在学生端进行每日「维修工单」小游戏（一年级口算练习），不产生积分。关闭后入口隐藏。
        </p>
        <button
          type="button"
          onClick={handleToggleMaintenance}
          disabled={savingMaintenance}
          className={`flex items-center justify-between w-full rounded-lg border-2 px-4 py-3 transition-colors cursor-pointer ${
            maintenanceMath.enabled ? "border-p-accent bg-p-accent/5" : "border-p-border bg-white hover:bg-gray-50"
          }`}
        >
          <span className="text-sm font-medium text-p-text">{maintenanceMath.enabled ? "已开启" : "已关闭"}</span>
          <div
            className={`relative h-6 w-11 rounded-full transition-colors ${
              maintenanceMath.enabled ? "bg-p-accent" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                maintenanceMath.enabled ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 驾驶指南（识字手写） */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Car size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">驾驶指南</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          开启后，孩子可在学生端进行每日识字手写练习（看拼音写词语），不产生积分。关闭后入口隐藏。
        </p>
        <button
          type="button"
          onClick={handleToggleDrivingGuide}
          disabled={savingDrivingGuide}
          className={`flex items-center justify-between w-full rounded-lg border-2 px-4 py-3 transition-colors cursor-pointer ${
            drivingGuide.enabled ? "border-p-accent bg-p-accent/5" : "border-p-border bg-white hover:bg-gray-50"
          }`}
        >
          <span className="text-sm font-medium text-p-text">{drivingGuide.enabled ? "已开启" : "已关闭"}</span>
          <div
            className={`relative h-6 w-11 rounded-full transition-colors ${
              drivingGuide.enabled ? "bg-p-accent" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                drivingGuide.enabled ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>
        <div className="mt-5 pt-5 border-t border-p-border">
          <p className="text-sm text-p-text-secondary mb-2">
            自定义词语池（可选）：每行或逗号分隔<strong className="text-p-text font-medium">两字中文词</strong>
            ，至少 5 个不重复。留空并保存则使用系统默认词库。关闭上方开关时仍可编辑，孩子端仅在开启时可练习。
          </p>
          <textarea
            value={drivingGuideWordsText}
            onChange={(e) => setDrivingGuideWordsText(e.target.value)}
            disabled={loadingDrivingGuideWords || savingDrivingGuideWords}
            placeholder={"例如：\n讲话\n土地\n故乡"}
            rows={6}
            className="w-full rounded-lg border-2 border-p-border bg-white px-3 py-2 text-sm text-p-text placeholder:text-p-text-secondary/60 focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent/20 disabled:opacity-60"
          />
          {drivingGuideWordsError ? (
            <p className="text-sm text-red-600 mt-2">{drivingGuideWordsError}</p>
          ) : null}
          <div className="flex gap-3 mt-3 items-center flex-wrap">
            <Button
              onClick={handleSaveDrivingGuideWords}
              size="md"
              loading={savingDrivingGuideWords}
              disabled={loadingDrivingGuideWords}
            >
              {savedDrivingGuideWords ? <Check size={16} /> : "保存词表"}
            </Button>
            {loadingDrivingGuideWords ? (
              <span className="text-sm text-p-text-secondary">加载中…</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* 机甲对话 */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">机甲对话</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          开启后，孩子可与当前主机甲进行语音/文字对话（AI 陪伴与鼓励），会产生大模型与语音转写费用。关闭后学生端入口隐藏。
        </p>
        <button
          type="button"
          onClick={handleToggleMechaChat}
          disabled={savingMechaChat}
          className={`flex items-center justify-between w-full rounded-lg border-2 px-4 py-3 transition-colors cursor-pointer ${
            mechaChat.enabled ? "border-p-accent bg-p-accent/5" : "border-p-border bg-white hover:bg-gray-50"
          }`}
        >
          <span className="text-sm font-medium text-p-text">{mechaChat.enabled ? "已开启" : "已关闭"}</span>
          <div
            className={`relative h-6 w-11 rounded-full transition-colors ${
              mechaChat.enabled ? "bg-p-accent" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                mechaChat.enabled ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>
      </div>

      {/* 每日战斗门槛 */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Swords size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">每日战斗门槛</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          孩子当天通过任务获得的积分（家长确认任务后的加分）累计需达到该值，学生端才可发起每日战斗。
          <span className="font-medium text-p-text"> 填 0 表示不要求任务积分，随时可战。</span>
          可设 0～10 分。
        </p>
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="number"
            min={0}
            max={10}
            step={1}
            value={battleMinPtsDraft}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                setBattleMinPtsDraft(0);
                return;
              }
              const v = parseInt(raw, 10);
              if (Number.isNaN(v)) return;
              setBattleMinPtsDraft(Math.max(0, Math.min(10, v)));
            }}
            className="h-11 w-24 rounded-lg border-2 border-p-border bg-white px-3 text-center text-base font-semibold text-p-text transition-colors focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent/20"
          />
          <span className="text-sm text-p-text-secondary">分</span>
          <Button onClick={handleSaveBattleMinPts} size="md" loading={savingBattleMin}>
            {savedBattleMin ? <Check size={16} /> : "保存"}
          </Button>
        </div>
      </div>

      {/* 基准分 */}
      {/* <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Coins size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">基准分</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          选择 0.1 分时，任务加分步进更细，所有积分显示按比例缩小；选择 10 分时按比例放大。任务分、奖励价、学生余额与流水等均支持小数存储。
        </p>
        <div className="flex gap-2">
          {([0.1, 1, 10] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={async () => {
                if (baseScore === v) return;
                setSavingBaseScore(true);
                try {
                  await updateBaseScore(v);
                } finally {
                  setSavingBaseScore(false);
                }
              }}
              disabled={savingBaseScore}
              className={`flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                baseScore === v
                  ? "border-p-accent bg-p-accent/10 text-p-accent"
                  : "border-p-border bg-white hover:bg-gray-50 text-p-text"
              }`}
            >
              {v} 分
            </button>
          ))}
        </div>
      </div> */}

      {/* PIN */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={18} className="text-p-accent" />
          <h2 className="text-base font-medium text-p-text">修改PIN码</h2>
        </div>
        <p className="text-sm text-p-text-secondary mb-4">
          PIN码用于从学生模式切回家长模式
        </p>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {pin.map((v, i) => (
              <input
                key={i}
                id={`settings-pin-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={v}
                onChange={(e) => handlePinInput(i, e.target.value)}
                onKeyDown={(e) => handlePinKeyDown(i, e)}
                className="h-12 w-12 rounded-lg border-2 border-p-border bg-white text-center text-xl font-bold text-p-text transition-colors focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent/20"
              />
            ))}
          </div>
          <Button onClick={handleSavePin} disabled={pin.join("").length !== 4} loading={savingPin}>
            {savedPin ? <Check size={16} /> : "更新"}
          </Button>
        </div>
      </div>

      {/* Logout */}
      <Button variant="danger" onClick={handleLogout} className="w-full" loading={loggingOut}>
        <LogOut size={16} className="mr-2" />
        退出登录
      </Button>
    </div>
  );
}
