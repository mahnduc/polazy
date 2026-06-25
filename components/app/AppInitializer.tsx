"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/profileStore";
import { useLogs } from "@/hooks/useLogs";
import { useInitPeer } from "@/hooks/useInitPeer";

export function AppInitializer({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logger } = useLogs(); 
  
  const { peer } = useInitPeer();

  const initializeUser = useUserStore((state) => state.initializeUser);
  const isInitialized = useUserStore((state) => state.isInitialized);
  const username = useUserStore((state) => state.username);
  
  const didInitialize = useRef(false);

  // Effect 1: Khởi tạo Chào mừng (Chạy ngay khi vào app)
  useEffect(() => {
    if (isInitialized || didInitialize.current) return;

    didInitialize.current = true;
    logger.info("Chào mừng đến với prismora!");
    initializeUser(router.push);
  }, [isInitialized, initializeUser, router, logger]);

  // Effect 2: Log Peer (Sẽ tự động bắt được biến `peer` ngay khi nó chuyển từ null -> có giá trị)
  useEffect(() => {
    if (isInitialized && peer) {
      logger.info(`Peer đã được khởi tạo thành công! Id của bạn là: ${peer.id}`);
    }
  }, [isInitialized, peer, logger]);

  // Effect 3: Điều hướng Intro
  useEffect(() => {
    if (isInitialized) {
      if (username && pathname === "/intro") {
        router.replace("/");
      }
    }
  }, [isInitialized, username, pathname, router]);

  if (!isInitialized) {
    return null; 
  }

  if (username && pathname === "/intro") {
    return null;
  }

  return <>{children}</>;
}