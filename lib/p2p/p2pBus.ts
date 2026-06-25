import Peer from "peerjs";

export interface PeerState {
  peerId: string | null;
  isConnected: boolean;
  isDestroyed: boolean;
}

type PeerListener = (state: PeerState) => void;

class PeerBus {
  private peer: Peer | null = null;
  private listeners: Set<PeerListener> = new Set();
  private state: PeerState = {
    peerId: null,
    isConnected: false,
    isDestroyed: false,
  };

  init = (id?: string): Peer => {
    if (this.peer && !this.state.isDestroyed) {
      return this.peer;
    }

    this.updateState({ isDestroyed: false });

    if (id) {
      this.peer = new Peer(id);
    } else {
      this.peer = new Peer();
    }

    this.setupEventListeners();
    return this.peer;
  };

  getPeer = (): Peer => {
    if (!this.peer) {
      throw new Error("[PeerBus]: Peer chưa được khởi tạo. Hãy gọi .init() trước.");
    }
    return this.peer;
  };

  getSnapshot = (): PeerState => {
    return this.state;
  };

  subscribe = (listener: PeerListener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  destroy = () => {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
      this.updateState({
        peerId: null,
        isConnected: false,
        isDestroyed: true,
      });
    }
  };

  /**
   * Hàm helper cập nhật trạng thái immutable và notify các listener.
   */
  private updateState(nextState: Partial<PeerState>) {
    this.state = {
      ...this.state,
      ...nextState,
    };
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private setupEventListeners() {
    if (!this.peer) return;

    this.peer.on("open", (id) => {
      this.updateState({
        peerId: id,
        isConnected: true,
      });
    });

    this.peer.on("disconnected", () => {
      this.updateState({
        isConnected: false,
      });
    });

    this.peer.on("close", () => {
      this.peer = null;
      this.updateState({
        peerId: null,
        isConnected: false,
        isDestroyed: true,
      });
    });

    this.peer.on("error", (err) => {
      console.error("[PeerBus Error]:", err);
    });
  }
}

export const peerBus = new PeerBus();