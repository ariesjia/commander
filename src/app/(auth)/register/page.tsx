"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, KeyRound, User } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    setError("");
    setStep(2);
  };

  const handlePinInput = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const next = [...pin];
    next[idx] = val;
    setPin(next);

    if (val && idx < 3) {
      const nextInput = document.getElementById(`pin-${idx + 1}`);
      nextInput?.focus();
    }
  };

  const handlePinKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[idx] && idx > 0) {
      const prevInput = document.getElementById(`pin-${idx - 1}`);
      prevInput?.focus();
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const pinStr = pin.join("");
    if (pinStr.length !== 4) {
      setError("请输入完整的4位PIN码");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("请输入孩子的昵称");
      return;
    }
    try {
      const ok = await register(email, password, pin.join(""), nickname.trim());
      if (ok) {
        window.location.href = "/parent";
        return;
      } else {
        setError("注册失败，请重试");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    }
  };

  const stepIcons = [Shield, KeyRound, User];
  const stepTitles = ["创建账号", "设置PIN码", "孩子昵称"];
  const stepDescs = [
    "输入邮箱和密码",
    "这个密码用来防止孩子进入管理界面",
    "学生模式下显示的称呼",
  ];

  const StepIcon = stepIcons[step - 1];

  return (
    <div className="rounded-xl bg-p-card p-8 shadow-sm border border-p-border">
      {/* Step indicator */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                s <= step
                  ? "bg-p-accent text-white"
                  : "bg-gray-100 text-p-text-secondary"
              }`}
            >
              {s}
            </div>
            {s < 3 && (
              <div
                className={`h-0.5 w-8 rounded transition-colors ${
                  s < step ? "bg-p-accent" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col items-center gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-p-accent/10">
          <StepIcon className="h-6 w-6 text-p-accent" />
        </div>
        <h1 className="text-xl font-semibold text-p-text">{stepTitles[step - 1]}</h1>
        <p className="text-sm text-p-text-secondary">{stepDescs[step - 1]}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 1 && (
            <form onSubmit={handleStep1} className="flex flex-col gap-4">
              <Input
                label="邮箱"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
              />
              <Input
                label="密码"
                type="password"
                placeholder="至少6位"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
              />
              {error && <p className="text-sm text-p-danger">{error}</p>}
              <Button type="submit" className="mt-2 w-full">
                下一步
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="flex flex-col gap-6">
              <div className="flex justify-center gap-3">
                {pin.map((v, i) => (
                  <input
                    key={i}
                    id={`pin-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    onChange={(e) => handlePinInput(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    className="h-14 w-14 rounded-xl border-2 border-p-border bg-white text-center text-2xl font-bold text-p-text transition-colors focus:border-p-accent focus:outline-none focus:ring-2 focus:ring-p-accent/20"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              {error && <p className="text-center text-sm text-p-danger">{error}</p>}
              <div className="flex gap-3">
                <Button variant="secondary" type="button" onClick={() => setStep(1)} className="flex-1">
                  上一步
                </Button>
                <Button type="submit" className="flex-1">
                  下一步
                </Button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="flex flex-col gap-4">
              <Input
                label="孩子昵称"
                placeholder="例如：小明"
                value={nickname}
                onChange={(e) => { setNickname(e.target.value); setError(""); }}
                autoFocus
              />
              {error && <p className="text-sm text-p-danger">{error}</p>}
              <div className="flex gap-3 mt-2">
                <Button variant="secondary" type="button" onClick={() => setStep(2)} className="flex-1">
                  上一步
                </Button>
                <Button type="submit" className="flex-1">
                  完成注册
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-sm text-p-text-secondary">
        已有账号？{" "}
        <Link href="/login" className="font-medium text-p-accent hover:underline">
          返回登录
        </Link>
      </p>
    </div>
  );
}
