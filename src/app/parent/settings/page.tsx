"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { User, KeyRound, LogOut, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, updateNickname, updatePin, logout } = useAuth();
  const router = useRouter();

  const [nickname, setNickname] = useState(user?.childNickname ?? "");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [savedNickname, setSavedNickname] = useState(false);
  const [savedPin, setSavedPin] = useState(false);

  const handleSaveNickname = async () => {
    if (!nickname.trim()) return;
    try {
      await updateNickname(nickname.trim());
      setSavedNickname(true);
      setTimeout(() => setSavedNickname(false), 2000);
    } catch {
      // ignore
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

  const handleSavePin = async () => {
    const pinStr = pin.join("");
    if (pinStr.length !== 4) return;
    try {
      await updatePin(pinStr);
      setSavedPin(true);
      setPin(["", "", "", ""]);
      setTimeout(() => setSavedPin(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex flex-col gap-6">
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
          <Button onClick={handleSaveNickname} size="md">
            {savedNickname ? <Check size={16} /> : "保存"}
          </Button>
        </div>
      </div>

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
          <Button onClick={handleSavePin} disabled={pin.join("").length !== 4}>
            {savedPin ? <Check size={16} /> : "更新"}
          </Button>
        </div>
      </div>

      {/* Account info */}
      <div className="rounded-xl border border-p-border bg-p-card p-5">
        <h2 className="text-base font-medium text-p-text mb-3">账号信息</h2>
        <p className="text-sm text-p-text-secondary">
          邮箱: {user?.email ?? "—"}
        </p>
      </div>

      {/* Logout */}
      <Button variant="danger" onClick={handleLogout} className="w-full">
        <LogOut size={16} className="mr-2" />
        退出登录
      </Button>
    </div>
  );
}
