import { create } from "zustand"

interface ProfileStore {
  name: string
  avatarUrl: string
  currentStyle: string
  isInitialized: boolean
  setUser: (name: string, avatarUrl: string, currentStyle: string) => void
  clearUser: () => void
  initializeUser: (routerPush: (url: string) => void) => Promise<void>
}

export const useUserStore = create<ProfileStore>((set) => ({
  name: "",
  avatarUrl: "",
  currentStyle: "adventurer",
  isInitialized: false,
  setUser: (name, avatarUrl, currentStyle) => set({ name, avatarUrl, currentStyle }),
  clearUser: () => set({ name: "", avatarUrl: "", currentStyle: "adventurer" }),
  
  initializeUser: async (routerPush) => {
    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle("info.json", { create: false });
      const file = await fileHandle.getFile();
      const text = await file.text();
      console.log(text)
      if (text) {
        const data = JSON.parse(text);
        set({
          name: data.name || "",
          avatarUrl: data.avatarUrl || "",
          currentStyle: data.currentStyle || "adventurer",
          isInitialized: true
        });
        return;
      }
      
      throw new Error("File rỗng");
    } catch (error) {
      set({ isInitialized: true });
      routerPush("/intro");
    }
  }
}))