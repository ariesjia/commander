"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    router.replace(isLoggedIn ? "/parent" : "/login");
  }, [isLoggedIn, router]);

  return null;
}
