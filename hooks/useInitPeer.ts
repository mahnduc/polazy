// hooks/useInitPeer.ts
import { useEffect, useSyncExternalStore } from "react";
import Peer from "peerjs";
import { peerBus, PeerState } from "@/lib/p2p/p2pBus";
import { useUserStore } from "@/store/profileStore";

interface UseInitPeerResult {
  peer: Peer | null;
  state: PeerState;
}

const SERVER_SNAPSHOT: PeerState = {
  status: "disconnected",
  connections: [],
} as unknown as PeerState;

const getServerSnapshot = () => SERVER_SNAPSHOT;

export function useInitPeer(): UseInitPeerResult {
  const { username, tag, isInitialized } = useUserStore();
  const state = useSyncExternalStore(peerBus.subscribe, peerBus.getSnapshot, getServerSnapshot);

  const rawPeerId = username && tag ? `${username}${tag}` : username || undefined;

  const generatedPeerId = rawPeerId
    ? rawPeerId.replace(/[^a-zA-Z0-9-_]/g, "-")
    : undefined;

  useEffect(() => {
    if (!isInitialized || !username || !generatedPeerId) return;

    peerBus.init(generatedPeerId);

    return () => {
      peerBus.destroy();
    };
  }, [isInitialized, generatedPeerId, username]);

  let peer: Peer | null = null;
  try {
    peer = peerBus.getPeer();
  } catch (error) {
    peer = null;
  }

  return {
    peer,
    state,
  };
}