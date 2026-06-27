"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, MessageSquare } from "lucide-react"

interface ChatMessage {
  sender: "me" | "peer";
  text: string;
  timestamp: number;
}

interface PeerUserInfo {
  name: string;
  avatar?: string;
  [key: string]: string | number | boolean | undefined;
}

interface ChatBoardUIProps {
  activeRouteId: string | null;
  activeMessages: ChatMessage[];
  sendMessage: (text: string) => void;
  isConnected: boolean;
  peerProfiles: Record<string, PeerUserInfo>;
}

export default function ChatBoardUI({
  activeRouteId,
  activeMessages,
  sendMessage,
  isConnected,
  peerProfiles,
}: ChatBoardUIProps) {
  const [inputMessage, setInputMessage] = useState<string>("")
  const scrollRef = useRef<HTMLDivElement>(null)

  // Lấy thông tin đối phương hiện tại dựa vào activeRouteId
  const currentPeerInfo = activeRouteId ? peerProfiles[activeRouteId] : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeMessages])

  const handleSend = () => {
    if (!inputMessage.trim()) return
    sendMessage(inputMessage.trim())
    setInputMessage("")
  }

  // Trạng thái trống: Chưa chọn phòng chat
  if (!activeRouteId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-neutral-950/20">
        <div className="h-12 w-12 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-600 mb-4 bg-neutral-900">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-sm font-medium text-neutral-200">
          Tìm kiếm bạn bè
        </h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-sm">
          {isConnected
            ? "Chọn một phòng chat đang hoạt động ở thanh bên trái để bắt đầu trao đổi dữ liệu."
            : "Kết nối với bạn bè bằng các kênh trò chuyện song song."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-900/10">
      
      {/* 1. TOPBAR: Hiển thị avatar và tên đối phương */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {currentPeerInfo?.avatar ? (
            <div className="relative h-9 w-9 shrink-0">
              <Image
                src={currentPeerInfo.avatar}
                alt="Partner Avatar"
                fill
                unoptimized
                sizes="36px"
                className="rounded-full object-cover border border-neutral-800"
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-semibold text-neutral-400 shrink-0">
              {currentPeerInfo?.name?.charAt(0) || "P"}
            </div>
          )}
          
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-neutral-100 truncate">
              {currentPeerInfo?.name || "Người dùng ẩn danh"}
            </span>
            <span className="text-[10px] font-mono text-neutral-500 truncate">
              ID: {activeRouteId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-800/40 border border-neutral-800/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)] animate-pulse" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {activeMessages.map((msg, index) => {
            const isMe = msg.sender === "me";
            
            return (
              <div
                key={index}
                className={`flex w-full gap-2.5 items-end ${isMe ? "justify-end" : "justify-start"}`}
              >
                {!isMe && (
                  currentPeerInfo?.avatar ? (
                    <div className="relative h-7 w-7 shrink-0 mb-0.5">
                      <Image
                        src={currentPeerInfo.avatar}
                        alt="Peer Chat Avatar"
                        fill
                        unoptimized
                        sizes="28px"
                        className="rounded-full object-cover border border-neutral-800"
                      />
                    </div>
                  ) : (
                    <div className="h-7 w-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-400 shrink-0 mb-0.5">
                      {currentPeerInfo?.name?.charAt(0) || "P"}
                    </div>
                  )
                )}

                <div
                  className={`max-w-[65%] px-3 py-2 rounded-xl text-sm break-words border shadow-sm transition-colors ${
                    isMe
                      ? "bg-neutral-100 border-neutral-200 text-neutral-900 rounded-br-none font-medium"
                      : "bg-neutral-800/90 border-neutral-800 text-neutral-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-neutral-800 bg-neutral-900/50 backdrop-blur-md flex gap-2">
        <Input
          placeholder={`Nhập tin nhắn gửi tới ${currentPeerInfo?.name || "bạn bè"}...`}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 h-10 bg-neutral-950/40 border-neutral-800 focus-visible:ring-neutral-700 text-neutral-200 placeholder:text-neutral-600"
        />
        <Button 
          size="icon" 
          className="h-10 w-10 shrink-0 bg-neutral-50 text-neutral-900 hover:bg-neutral-200" 
          onClick={handleSend}
        >
          <Send size={14} />
        </Button>
      </div>
    </div>
  )
}