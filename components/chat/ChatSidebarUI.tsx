"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Copy, Search, Check, X, Loader2 } from "lucide-react"
import AvatarBlockUI from "@/components/common/AvatarBlockUI"
import { DataConnection } from "peerjs"
import Image from "next/image"

interface PeerUserInfo {
  name: string;
  avatar?: string;
  [key: string]: string | number | boolean | undefined;
}

interface ChatSidebarUIProps {
  peerId: string;
  connections: Record<string, DataConnection>;
  activeRouteId: string | null;
  setActiveRouteId: (id: string | null) => void;
  pendingConnection: DataConnection | null;
  pendingRequester: PeerUserInfo | undefined;
  pendingOutbounds: string[];
  connectToPeer: (remoteId: string) => void;
  acceptConnection: () => void;
  rejectConnection: () => void;
  peerProfiles: Record<string, PeerUserInfo>;
}

export default function ChatSidebarUI({
  peerId,
  connections,
  activeRouteId,
  setActiveRouteId,
  pendingConnection,
  pendingRequester,
  pendingOutbounds,
  connectToPeer,
  acceptConnection,
  rejectConnection,
  peerProfiles,
}: ChatSidebarUIProps) {
  const [remoteId, setRemoteId] = useState<string>("")

  const handleConnect = () => {
    if (!remoteId.trim()) return
    connectToPeer(remoteId.trim())
    setRemoteId("")
  }

  const activeConnections = Object.entries(connections).filter(
    ([_, conn]) => conn.open
  );

  return (
    <div className="w-80 h-full flex flex-col shrink-0">
      <Card className="border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-full flex flex-col shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-4 flex flex-col gap-5 h-full overflow-y-auto">

          {/* KHỐI 1: Định danh cá nhân */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              ID của bạn
            </label>
            <div className="flex items-center gap-2">
              <AvatarBlockUI />
              <Input
                readOnly
                value={peerId || "Đang khởi tạo..."}
                className="font-mono text-xs h-9 bg-neutral-50/50 dark:bg-neutral-950/50 select-all text-neutral-600 dark:text-neutral-400"
              />
              <Button
                variant="outline"
                size="icon"
                disabled={!peerId}
                className="h-9 w-9 shrink-0 border-neutral-200 dark:border-neutral-800"
                onClick={() => navigator.clipboard.writeText(peerId)}
              >
                <Copy size={14} className="text-neutral-500" />
              </Button>
            </div>
          </div>

          <div className="border-t border-neutral-100 dark:border-neutral-800/60" />

          {/* KHỐI 2: Yêu cầu kết nối đến */}
          {pendingConnection && (
            <>
              <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Yêu cầu kết nối mới
                </label>

                <div className="p-3 border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    {pendingRequester?.avatar ? (
                      <img
                        src={pendingRequester.avatar}
                        alt="Avatar"
                        className="h-8 w-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xs font-semibold text-amber-700 dark:text-amber-300 shrink-0">
                        {pendingRequester?.name?.charAt(0) || "P"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {pendingRequester?.name || "Người dùng ẩn danh"}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono truncate">
                        ID: {pendingConnection.peer}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full">
                    <Button
                      size="sm"
                      onClick={acceptConnection}
                      className="flex-1 h-8 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 gap-1"
                    >
                      <Check size={13} /> Nhận
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={rejectConnection}
                      className="flex-1 h-8 text-xs border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 gap-1"
                    >
                      <X size={13} /> Từ chối
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-800/60" />
            </>
          )}

          {/* KHỐI 3: Form nhập kết nối */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              Kết nối với bạn bè
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nhập id bạn bè..."
                value={remoteId}
                onChange={(e) => setRemoteId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
                className="flex-1 h-9"
              />
              <Button
                className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 shrink-0"
                onClick={handleConnect}
              >
                <Search size={15} />
              </Button>
            </div>
          </div>

          {/* Đang chờ phản hồi kết nối đi */}
          {pendingOutbounds.length > 0 && (
            <>
              <div className="border-t border-neutral-100 dark:border-neutral-800/60" />
              <div className="space-y-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-blue-500 dark:text-blue-400 flex items-center gap-1.5">
                  Đang chờ kết nối...
                </label>
                <div className="flex flex-col gap-1.5">
                  {pendingOutbounds.map((id) => (
                    <div
                      key={id}
                      className="p-2.5 border border-dashed border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10 rounded-xl flex items-center justify-between dynamic-fade-in"
                    >
                      <span className="text-xs font-mono text-neutral-500 truncate mr-2 flex-1">
                        {id}
                      </span>
                      <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="border-t border-neutral-100 dark:border-neutral-800/60" />

          {/* KHỐI 4: Danh sách bạn bè đã hoạt động */}
          <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500 flex items-center justify-between">
              <span>Bạn bè đang hoạt động ({activeConnections.length})</span>
            </label>

            {activeConnections.length > 0 ? (
              <ScrollArea className="flex-1 -mx-1 pr-1">
                <div className="flex flex-col gap-1">
                  {activeConnections.map(([connectedPeerId]) => {
                    const isActive = connectedPeerId === activeRouteId;

                    // Đọc chính xác profile đối phương qua bảng định danh được đồng bộ
                    const peerInfo = peerProfiles[connectedPeerId];

                    return (
                      <button
                        key={connectedPeerId}
                        onClick={() => setActiveRouteId(connectedPeerId)}
                        className={`group p-2.5 w-full text-left rounded-lg flex items-center gap-3 transition-colors outline-none text-sm ${isActive
                            ? "bg-neutral-800 text-neutral-50 font-medium shadow-sm border border-neutral-700/50"
                            : "bg-transparent text-neutral-400 hover:bg-neutral-800/40 hover:text-neutral-200"
                          }`}
                      >
                        {/* Hiển thị avatar của đối phương */}
                        {peerInfo?.avatar ? (
                          <div className="relative h-8 w-8 shrink-0">
                            <Image
                              src={peerInfo.avatar}
                              alt="Peer Avatar"
                              fill
                              unoptimized
                              sizes="32px"
                              className={`rounded-full object-cover border transition-colors ${isActive
                                  ? "border-neutral-600"
                                  : "border-neutral-800"
                                }`}
                            />
                          </div>
                        ) : (
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 border transition-colors ${isActive
                              ? "bg-neutral-700 text-neutral-100 border-neutral-600"
                              : "bg-neutral-800 text-neutral-500 border-neutral-700"
                            }`}>
                            {peerInfo?.name?.charAt(0) || "P"}
                          </div>
                        )}

                        {/* Hiển thị Tên chuẩn của đối phương và ID phụ đề bên dưới */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          <span className={`font-medium truncate transition-colors ${isActive ? "text-neutral-50" : "text-neutral-200 group-hover:text-neutral-100"}`}>
                            {peerInfo?.name || "Người dùng ẩn danh"}
                          </span>
                          <span className={`text-[10px] font-mono truncate transition-colors ${isActive
                              ? "text-neutral-400"
                              : "text-neutral-500 group-hover:text-neutral-400"
                            }`}>
                            {connectedPeerId}
                          </span>
                        </div>

                        {/* Đèn báo trạng thái hoạt động */}
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${isActive
                            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                            : "bg-emerald-500/70 group-hover:bg-emerald-400 group-hover:scale-110"
                          }`} />
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex flex-col items-center justify-center p-4 text-center">
                <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                  Chưa có kênh kết nối nào hoạt động.
                </p>
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  )
}