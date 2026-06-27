"use client"

import ChatBoardUI from "@/components/chat/ChatBoardUI"
import ChatSidebarUI from "@/components/chat/ChatSidebarUI"
import { usePeerChat } from "@/hooks/p2p/usePeerChat"

export default function FullChatUI() {
  const { 
    peerId, 
    connectToPeer, 
    pendingConnection, 
    pendingRequester, 
    pendingOutbounds,
    acceptConnection, 
    rejectConnection,
    connections,
    peerProfiles, // Lấy bảng profiles đã được đồng bộ chéo từ hook
    activeRouteId,
    setActiveRouteId,
    activeMessages,
    sendMessage
  } = usePeerChat()

  return (
    <div className="flex h-screen w-full bg-neutral-50 dark:bg-neutral-950 p-4 gap-4 transition-colors select-none">
      
      {/* Khối hiển thị nội dung cuộc trò chuyện */}
      <div className="flex-1 flex flex-col border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900/40 overflow-hidden shadow-sm">
        <ChatBoardUI
          activeRouteId={activeRouteId}
          activeMessages={activeMessages}
          sendMessage={sendMessage}
          isConnected={Object.keys(connections).length > 0}
          peerProfiles={peerProfiles} // BỔ SUNG: Truyền dữ liệu danh tính sang BoardUI để hiển thị Avatar/Tên
        />
      </div>

      {/* Khối Sidebar danh sách kết nối */}
      <ChatSidebarUI
        peerId={peerId}
        connections={connections}
        peerProfiles={peerProfiles} // Đưa dữ liệu danh tính vào Sidebar
        activeRouteId={activeRouteId}
        setActiveRouteId={setActiveRouteId}
        pendingConnection={pendingConnection}
        pendingRequester={pendingRequester}
        pendingOutbounds={pendingOutbounds}
        connectToPeer={connectToPeer}
        acceptConnection={acceptConnection}
        rejectConnection={rejectConnection}
      />

    </div>
  )
}