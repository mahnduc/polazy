"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@/store/profileStore";
import { useLogs } from "@/hooks/log/useLogs";
import { useInitPeer } from "@/hooks/p2p/useInitPeer";

export function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logger } = useLogs();

  const initializeUser = useUserStore((state) => state.initializeUser);
  const isInitialized = useUserStore((state) => state.isInitialized);

  const { peer } = useInitPeer();

  const didInitialize = useRef(false);

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    logger.info("Chào mừng đến với Prismora!");
    initializeUser();
  }, [initializeUser, logger]);

  useEffect(() => {
    if (!isInitialized || !peer) return;

    logger.info(
      `Peer đã được khởi tạo thành công! Id của bạn là: ${peer.id}`
    );
  }, [isInitialized, peer, logger]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Đang khởi động Prismora...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}