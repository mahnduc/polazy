"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dices, Loader2, Save, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useLogs } from "@/hooks/useLogs";
import { UserInfo } from "@/types/user-info.type";

const DICEBEAR_STYLES = [
  { id: "thumbs", name: "Thumbs"},
  { id: "shapes", name: "Shapes"},
  { id: "adventurer", name: "Adventurer" },
  { id: "lorelei", name: "Lorelei" },
  { id: "micah", name: "Micah" },
];

export default function EditAvatarDialog() {
  const { logger } = useLogs();
  const [currentInfo, setCurrentInfo] = useState<UserInfo | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>("thumbs");
  const [currentSeed, setCurrentSeed] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function readFromOPFS() {
      try {
        const root = await navigator.storage.getDirectory();
        const fileHandle = await root.getFileHandle("info.json", { create: true });
        const file = await fileHandle.getFile();
        const text = await file.text();

        if (text) {
          const data = JSON.parse(text) as UserInfo;
          setCurrentInfo(data);
          setSelectedStyle(data.currentStyle || "adventurer");
          const urlObj = data.avatarUrl ? new URL(data.avatarUrl) : null;
          setCurrentSeed(urlObj?.searchParams.get("seed") || data.username);
        } else {
          const initialData: UserInfo = {
            username: "manhduc14",
            tag: "#1409",
            nickname: "Mạnh Đức",
            avatarUrl: "",
            currentStyle: ""
          };
          setCurrentInfo(initialData);
          setCurrentSeed(initialData.username);
        }
      } catch (error) {
        console.error("Lỗi đọc file từ OPFS:", error);
      } finally {
        setIsInitializing(false);
      }
    }
    readFromOPFS();
  }, []);

  const handleRandomize = () => {
    const randomString = Math.random().toString(36).substring(2, 10);
    setCurrentSeed(randomString);
  };

  const handleSaveAvatar = async () => {
    if (!currentInfo) return;

    setLoading(true);
    const newAvatarUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${currentSeed}`;

    const updatedInfo: UserInfo = {
      ...currentInfo,
      avatarUrl: newAvatarUrl,
      currentStyle: selectedStyle
    };

    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle("info.json", { create: true });

      const fileHandleExtended = fileHandle as FileSystemFileHandle;
      const writable = await fileHandleExtended.createWritable();
      await writable.write(JSON.stringify(updatedInfo, null, 2));
      await writable.close();

      window.location.reload();
    } catch (error) {
      console.error("Lỗi ghi file vào OPFS:", error);
      setLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!currentInfo) return;

    setLoading(true);

    const updatedInfo: UserInfo = {
      ...currentInfo,
      avatarUrl: "",
      currentStyle: ""
    };

    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle("info.json", { create: true });

      const fileHandleExtended = fileHandle as FileSystemFileHandle;
      const writable = await fileHandleExtended.createWritable();
      await writable.write(JSON.stringify(updatedInfo, null, 2));
      await writable.close();

      logger.info("Bạn đã cập nhật ảnh đại diện");
      window.location.reload();
    } catch (error) {
      console.error("Lỗi xóa file trong OPFS:", error);
      setLoading(false);
    }
  };

  if (isInitializing) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const previewUrl = `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${currentSeed}`;
  const hasExistingAvatar = !!currentInfo?.avatarUrl;

  return (
    <>
      <div className="flex flex-col items-center w-full -mt-2 -mx-2 px-0 pb-4">
        <div className="relative w-full aspect-square border-b border-muted shadow-sm group">
          <Avatar className="h-full w-full rounded-none">
            <AvatarImage
              src={previewUrl}
              alt="Avatar Preview"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <AvatarFallback className="rounded-none bg-muted text-5xl uppercase font-bold text-muted-foreground">
              {currentInfo?.nickname.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="w-full px-4 flex flex-col gap-2 mt-3">
          <div className="w-full">
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Chọn phong cách" />
              </SelectTrigger>
              <SelectContent>
                {DICEBEAR_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleRandomize}
              className="flex-1 h-9"
              title="Đổi ảnh ngẫu nhiên"
              disabled={loading}
            >
              <Dices className="h-4 w-4 mr-2 text-primary" />
              Ngẫu nhiên
            </Button>

            <Button
              variant="destructive"
              onClick={handleDeleteAvatar}
              className="flex-shrink-0 px-3 h-9"
              title="Xóa Avatar hiện tại"
              disabled={loading || !hasExistingAvatar}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-t border-muted my-1" />

          <div className="flex items-center gap-2 w-full">
            <Button variant="ghost" disabled={loading} className="flex-1 h-9">
              Hủy
            </Button>

            <Button onClick={handleSaveAvatar} disabled={loading} className="flex-[2] h-9">
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}