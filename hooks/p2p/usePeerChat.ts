import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { DataConnection } from "peerjs";
import { peerBus } from "@/hooks/p2p/p2pBus";
import { useUserStore } from "@/store/profileStore";

export interface PeerUserInfo {
  name: string;
  avatar?: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined; 
}

export interface ConnectionMetadata {
  senderInfo: PeerUserInfo;
}

interface ChatMessage {
  sender: "me" | "peer";
  text: string;
  timestamp: number;
}

// Cấu trúc gói tin hệ thống để trao đổi Profile thông qua Data Channel
interface SystemSignal {
  type: "__PROFILE_EXCHANGE__";
  profile: PeerUserInfo;
}

export function usePeerChat() {
  const peerBusState = useSyncExternalStore(peerBus.subscribe, peerBus.getSnapshot, () => ({
    peerId: null,
    isConnected: false,
  }));

  // Lấy dữ liệu user hiện tại từ Zustand Store làm profile gửi đi
  const nickname = useUserStore((state) => state.nickname);
  const avatarUrl = useUserStore((state) => state.avatarUrl);
  const username = useUserStore((state) => state.username);

  const peer = peerBus.getPeer();
  const peerId = peerBusState.peerId || ""; 
  
  const [connections, setConnections] = useState<Record<string, DataConnection>>({});
  // Quản lý riêng thông tin profile chuẩn của các peer đối phương
  const [peerProfiles, setPeerProfiles] = useState<Record<string, PeerUserInfo>>({});
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [pendingConnection, setPendingConnection] = useState<DataConnection | null>(null);
  const [pendingOutbounds, setPendingOutbounds] = useState<string[]>([]);
  const [messageMap, setMessageMap] = useState<Record<string, ChatMessage[]>>({});

  const setupConnectionListeners = useCallback((conn: DataConnection, isIncoming: boolean) => {
    const remotePeerId = conn.peer;

    const handleData = (data: unknown) => {
      const msgStr = String(data);

      // 1. Kiểm tra nếu là tín hiệu trao đổi Profile hệ thống (JSON mã hóa)
      if (msgStr.startsWith('{"type":"__PROFILE_EXCHANGE__"')) {
        try {
          const signal = JSON.parse(msgStr) as SystemSignal;
          setPeerProfiles((prev) => ({
            ...prev,
            [remotePeerId]: signal.profile
          }));
          return; // Chặn không đẩy tín hiệu hệ thống này vào box chat UI
        } catch (e) {
          console.error("Lỗi parse gói tin trao đổi profile:", e);
        }
      }

      // 2. Tín hiệu đồng bộ trạng thái kết nối cũ
      if (msgStr === "__CONNECTION_ACCEPTED__") {
        setPendingOutbounds((prev) => prev.filter((id) => id !== remotePeerId));
        setConnections((prev) => ({ ...prev, [remotePeerId]: conn }));
        setActiveRouteId(remotePeerId);
        return;
      }

      // 3. Tin nhắn thông thường
      setMessageMap((prev) => ({
        ...prev,
        [remotePeerId]: [
          ...(prev[remotePeerId] || []),
          { sender: "peer", text: msgStr, timestamp: Date.now() }
        ]
      }));
    };

    // Hàm gửi chéo thông tin cá nhân của mình sang cho bên kia ngay khi kết nối mở ra
    const sendMyProfile = () => {
      const myProfileSignal: SystemSignal = {
        type: "__PROFILE_EXCHANGE__",
        profile: {
          name: nickname || username || "Anonymous",
          avatar: avatarUrl || undefined,
          userId: peerId || undefined,
        }
      };
      conn.send(JSON.stringify(myProfileSignal));
    };

    if (conn.open) {
      conn.on("data", handleData);
      sendMyProfile(); // Gửi profile đi
      
      // Nếu là bên nhận, nếu metadata có sẵn của người gọi thì lưu trữ trước làm dữ liệu nền
      if (conn.metadata?.senderInfo) {
        setPeerProfiles((prev) => ({ ...prev, [remotePeerId]: conn.metadata.senderInfo }));
      }

      if (isIncoming) {
        setConnections((prev) => ({ ...prev, [remotePeerId]: conn }));
        setActiveRouteId(remotePeerId);
      }
    } else {
      conn.on("open", () => {
        conn.on("data", handleData);
        sendMyProfile(); // Gửi profile đi khi kênh hoàn toàn thông suốt
        
        if (conn.metadata?.senderInfo) {
          setPeerProfiles((prev) => ({ ...prev, [remotePeerId]: conn.metadata.senderInfo }));
        }

        if (isIncoming) {
          setConnections((prev) => ({ ...prev, [remotePeerId]: conn }));
          setActiveRouteId(remotePeerId);
        }
      });
    }

    conn.on("close", () => {
      setConnections((prev) => {
        const next = { ...prev };
        delete next[remotePeerId];
        return next;
      });
      setPeerProfiles((prev) => {
        const next = { ...prev };
        delete next[remotePeerId];
        return next;
      });
      setPendingOutbounds((prev) => prev.filter((id) => id !== remotePeerId));
      setActiveRouteId((current) => (current === remotePeerId ? null : current));
    });

    conn.on("error", (err) => {
      console.error(`[Connection Error with ${remotePeerId}]:`, err);
      setPendingOutbounds((prev) => prev.filter((id) => id !== remotePeerId));
      conn.close();
    });
  }, [nickname, username, avatarUrl, peerId]);

  // Lắng nghe yêu cầu kết nối đến
  useEffect(() => {
    if (!peer) return;

    const handleConnection = (c: DataConnection) => {
      if (connections[c.peer] || pendingConnection) return;
      setPendingConnection(c);
    };
    
    peer.on("connection", handleConnection);
    return () => {
      peer.off("connection", handleConnection);
    };
  }, [peer, connections, pendingConnection]);

  // Chấp nhận yêu cầu kết nối từ người khác
  const acceptConnection = () => {
    if (!pendingConnection) return;

    const c = pendingConnection;
    setPendingConnection(null);

    if (c.open) {
      c.send("__CONNECTION_ACCEPTED__");
      setupConnectionListeners(c, true);
    } else {
      c.on("open", () => {
        c.send("__CONNECTION_ACCEPTED__");
        setupConnectionListeners(c, true);
      });
    }
  };

  // Từ chối yêu cầu kết nối
  const rejectConnection = () => {
    if (!pendingConnection) return;
    pendingConnection.close();
    setPendingConnection(null);
  };

  // Chủ động gọi/kết nối tới một ID khác
  const connectToPeer = (remoteId: string) => {
    if (!peer || !remoteId || remoteId === peerId || connections[remoteId] || pendingOutbounds.includes(remoteId)) return;
    
    setPendingOutbounds((prev) => [...prev, remoteId]);
    
    const senderInfo: PeerUserInfo = {
      name: nickname || username || "Anonymous",
      avatar: avatarUrl || undefined,
      userId: peerId || undefined,
    }; 
    
    const c = peer.connect(remoteId, { metadata: { senderInfo } });
    
    setupConnectionListeners(c, false);
  };

  // Gửi tin nhắn chat thông thường
  const sendMessage = (text: string) => {
    if (!activeRouteId) return;
    const activeConn = connections[activeRouteId];

    if (activeConn && activeConn.open) {
      activeConn.send(text);
      setMessageMap((prev) => ({
        ...prev,
        [activeRouteId]: [
          ...(prev[activeRouteId] || []),
          { sender: "me", text, timestamp: Date.now() }
        ]
      }));
    }
  };

  const pendingRequester = (pendingConnection?.metadata as ConnectionMetadata | undefined)?.senderInfo;

  return { 
    peerId, 
    connections,
    peerProfiles, // Khách hàng xuất ra danh sách profile đã trao đổi chính xác
    activeRouteId,
    setActiveRouteId,
    activeMessages: activeRouteId ? (messageMap[activeRouteId] || []) : [],
    pendingConnection,
    pendingRequester,
    pendingOutbounds, 
    connectToPeer, 
    sendMessage,
    acceptConnection,
    rejectConnection,
    isPeerConnected: peerBusState.isConnected
  };
}