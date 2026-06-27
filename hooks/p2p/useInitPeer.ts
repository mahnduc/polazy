import { useEffect, useSyncExternalStore } from "react";
import { useUserStore } from "@/store/profileStore";
import { peerBus, PeerState } from "./p2pBus";

const SERVER_SNAPSHOT: PeerState = { peerId: null, isConnected: false };
const getServerSnapshot = () => SERVER_SNAPSHOT;

export function useInitPeer() {
  const { username, tag, isInitialized } = useUserStore();
  const state = useSyncExternalStore(peerBus.subscribe, peerBus.getSnapshot, getServerSnapshot);
  const rawPeerId = username && tag ? `${username}${tag}` : username || undefined;
  const generatedPeerId = rawPeerId ? rawPeerId.replace(/[^a-zA-Z0-9-_]/g, "-") : undefined;

  useEffect(() => {
    if (!isInitialized || !generatedPeerId) return;

    peerBus.init(generatedPeerId);
    
  }, [isInitialized, generatedPeerId]);

  return {
    peer: peerBus.getPeer(),
    state,
  };
}