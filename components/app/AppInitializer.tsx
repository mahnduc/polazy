"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/profileStore";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initializeUser = useUserStore((state) => state.initializeUser);
  const isInitialized = useUserStore((state) => state.isInitialized);

  useEffect(() => {
    initializeUser(router.push);
  }, [initializeUser, router.push]);

  if (!isInitialized) {
    return null; 
  }

  return <>{children}</>;
}