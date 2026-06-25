import { useState, useEffect } from "react";
import { DataConnection } from "peerjs";
import { useInitPeer } from "@/hooks/useInitPeer";

export function usePeerChat() {
  const { peer, state: peerBusState } = useInitPeer();
  
  const peerId = peerBusState.peerId || ""; 
  
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);

  useEffect(() => {
    if (!peer) return;

    console.log("[usePeerChat]: Đang lắng nghe kết nối chat từ hệ thống Peer tập trung");

    const handleConnection = (c: DataConnection) => {
      setConnection(c);
      
      c.on("data", (data) => {
        setMessages((prev) => [...prev, { sender: "peer", text: String(data) }]);
      });
    };

    peer.on("connection", handleConnection);

    return () => {
      console.log("[usePeerChat]: Ngừng lắng nghe sự kiện chat");
      peer.off("connection", handleConnection);
    };
  }, [peer]);

  const connectToPeer = (remoteId: string) => {
    if (!peer || !remoteId) return;
    
    console.log(`[usePeerChat]: Đang chủ động kết nối tới ${remoteId}`);
    const c = peer.connect(remoteId);
    setConnection(c);
    
    c.on("data", (data) => {
      setMessages((prev) => [...prev, { sender: "peer", text: String(data) }]);
    });
  };

  const sendMessage = (text: string) => {
    if (connection) {
      connection.send(text);
      setMessages((prev) => [...prev, { sender: "me", text }]);
    }
  };

  return { 
    peerId, 
    connection, 
    messages, 
    connectToPeer, 
    sendMessage,
    isPeerConnected: peerBusState.isConnected
  };
}