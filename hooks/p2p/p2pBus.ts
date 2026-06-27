import Peer from "peerjs";

export interface PeerState {
  peerId: string | null;
  isConnected: boolean;
}

type PeerListener = (state: PeerState) => void;

class PeerBus {
  private peer: Peer | null = null;
  private listeners: Set<PeerListener> = new Set();
  private state: PeerState = { peerId: null, isConnected: false };
  private reconnectTimer: NodeJS.Timeout | null = null;

  init = (id: string): Peer => {
    // Nếu peer đã được tạo với đúng ID cũ và còn sống, trả về ngay
    if (this.peer && this.peer.id === id && !this.peer.destroyed) {
      return this.peer;
    }
    // Nếu ID thay đổi hoặc instance lỗi, hủy instance cũ chủ động
    if (this.peer) {
      this.cleanup();
    }

    // Thêm cấu hình ping để giữ kết nối socket luôn sống trên Browser
    this.peer = new Peer(id, {
      debug: 1, // 1: Chỉ log lỗi, 2: log cảnh báo, 3: log toàn bộ log của PeerJS
    });

    this.setupEventListeners();
    return this.peer;
  };

  getPeer = (): Peer | null => this.peer;
  getSnapshot = (): PeerState => this.state;

  subscribe = (listener: PeerListener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private updateState(nextState: Partial<PeerState>) {
    this.state = { ...this.state, ...nextState };
    this.listeners.forEach((l) => l(this.state));
  }

  private cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  private setupEventListeners() {
    if (!this.peer) return;

    this.peer.on("open", (id) => {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.updateState({ peerId: id, isConnected: true });
    });

    // Xử lý khi bị ngắt kết nối đột ngột với Signaling Server (Mạng yếu/Server ngắt)
    this.peer.on("disconnected", () => {
      this.updateState({ isConnected: false });
      
      // Thử kết nối lại tự động sau 3 giây nếu peer chưa bị hủy hoàn toàn
      if (this.peer && !this.peer.destroyed) {
        console.warn("[PeerBus]: Mất kết nối tới server báo hiệu. Đang tiến hành Reconnect...");
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.peer?.reconnect();
        }, 3000);
      }
    });

    this.peer.on("close", () => {
      this.cleanup();
      this.updateState({ peerId: null, isConnected: false });
    });

    this.peer.on("error", (err) => {
      console.error("[PeerBus Error]:", err);
      
      // Nếu gặp lỗi mạng không thể bắt tay (ví dụ peer đích không tồn tại hoặc ngắt socket)
      if (err.type === "network" || err.type === "server-error") {
        if (this.peer && !this.peer.disconnected && !this.peer.destroyed) {
          // Chủ động dứt khoát ngắt socket cũ ra để ép luồng chạy lại vào sự kiện 'disconnected' phía trên
          this.peer.disconnect(); 
        }
      }
    });
  }
}

export const peerBus = new PeerBus();