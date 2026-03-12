"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const { login, isLoggedIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (isLoggedIn) {
    router.replace("/parent");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }
    try {
      const ok = await login(email, password);
      if (ok) {
        window.location.href = "/parent";
        return;
      } else {
        setError("邮箱或密码错误");
      }
    } catch {
      setError("登录失败，请重试");
    }
  };

  return (
    <div className="rounded-xl bg-p-card p-8 shadow-sm border border-p-border">
      <div className="mb-6 flex flex-col items-center gap-2">
        <h1 className="text-xl font-semibold text-p-text">MotiMech</h1>
        <p className="text-sm text-p-text-secondary">登录家长账号</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="输入密码"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
        />
        {error && <p className="text-sm text-p-danger">{error}</p>}
        <Button type="submit" className="mt-2 w-full">
          登录
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-p-text-secondary">
        还没有账号？{" "}
        <Link href="/register" className="font-medium text-p-accent hover:underline">
          立即注册
        </Link>
      </p>
    </div>
  );
}
