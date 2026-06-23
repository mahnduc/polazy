"use client"

import { ComponentType, ChangeEvent, FormEvent, useRef, useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Shuffle, Upload, User as UserIcon, Sparkles, CheckCircle2, LogIn, Smile, Flame, Fingerprint, SmilePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useUserStore } from "@/store/profileStore"

interface StyleItem {
  id: string
  name: string
  desc: string
  icon: ComponentType<{ className?: string }>
}

interface RestoredDataType {
  name: string
  avatarUrl: string
  currentStyle: string
  [key: string]: unknown
}

export const AVATAR_STYLES: StyleItem[] = [
  { id: 'lorelei', name: 'Lorelei', icon: Flame, desc: 'Nhân vật phiêu lưu' },
  { id: 'identicon', name: 'Mesh Hash', icon: Fingerprint, desc: 'Mã hóa hình khối' },
  { id: 'thumbs', name: 'Blob Thumbs', icon: Smile, desc: 'Hình nhân bong bóng' },
  { id: 'fun-emoji', name: 'Fun Emoji', icon: SmilePlus, desc: 'Biểu cảm khối vuông' },
]

const OPFS_FILE_NAME = "info.json"

function generateSecureSeed(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0].toString(36);
  }
  return Math.random().toString(36).substring(7);
}

export default function Intro() {
  const setUserStore = useUserStore((state) => state.setUser)
  const isInitialized = useUserStore((state) => state.isInitialized)
  const storedName = useUserStore((state) => state.name)
  const router = useRouter()
  
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [username, setUsername] = useState("")
  const [currentStyle, setCurrentStyle] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [restoredData, setRestoredData] = useState<RestoredDataType | null>(null)

  useEffect(() => {
    if (isInitialized && storedName) {
      router.replace("/")
    }
  }, [isInitialized, storedName, router])

  const saveToOPFS = async (name: string, url: string, style: string) => {
    try {
      const root = await navigator.storage.getDirectory()
      const fileHandle = await root.getFileHandle(OPFS_FILE_NAME, { create: true })
      const writable = await fileHandle.createWritable()
      const data = JSON.stringify({ name: name, avatarUrl: url, currentStyle: style })
      await writable.write(data)
      await writable.close()
    } catch (e) {
      console.error("Lỗi ghi dữ liệu vào cấu trúc lưu trữ OPFS:", e)
    }
  }

  const handleStyleChange = (styleId: string) => {
    setCurrentStyle(styleId)
    const randomSeed = generateSecureSeed()
    setAvatarUrl(`https://api.dicebear.com/7.x/${styleId}/svg?seed=${randomSeed}`)
  }

  const generateRandomSeed = () => {
    const targetStyle = currentStyle || AVATAR_STYLES[0].id
    if (!currentStyle) {
      setCurrentStyle(targetStyle)
    }
    const randomSeed = generateSecureSeed()
    setAvatarUrl(`https://api.dicebear.com/7.x/${targetStyle}/svg?seed=${randomSeed}`)
  }

  const handleUploadBackup = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const parsedData: RestoredDataType = {
          name: json.name || json.username || "",
          avatarUrl: json.avatarUrl || "",
          currentStyle: json.currentStyle || ""
        }
        setRestoredData(parsedData)
        setUsername(parsedData.name)
        setCurrentStyle(parsedData.currentStyle)
        setAvatarUrl(parsedData.avatarUrl)
        
        toast.info("Đọc file JSON thành công! Hãy kiểm tra kỹ lại thông tin trước khi xác nhận.")
      } catch (err) {
        toast.error("Cấu trúc file sao lưu JSON không hợp lệ.")
      }
    }
    reader.readAsText(file)
  }

  const handleCancelRestore = () => {
    setRestoredData(null)
    setUsername("")
    setCurrentStyle("")
    setAvatarUrl("")
    toast("Đã hủy bỏ trạng thái khôi phục dữ liệu.")
  }

  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast.error("Vui lòng nhập Tên hiển thị.")
      return
    }

    if (!avatarUrl) {
      toast.error("Vui lòng chọn phong cách định danh hoặc bấm Ngẫu nhiên để sinh Avatar.")
      return
    }

    setIsSubmitting(true)
    
    try {
      setUserStore(username, avatarUrl, currentStyle)
      await saveToOPFS(username, avatarUrl, currentStyle)
      
      if (restoredData) {
        toast.success("Đã khôi phục dữ liệu danh tính thành công!")
      } else {
        toast.success("Khởi tạo danh tính thành công!")
      }

      router.push("/")
      
    } catch (err) {
      toast.error("Hệ thống gặp lỗi: Không thể lưu trữ thông tin cấu hình.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isInitialized && storedName) {
    return null
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 antialiased">
      <div className="w-full max-w-2xl rounded-lg border bg-card p-6 shadow-sm">
        <input 
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleUploadBackup}
          className="hidden"
          disabled={isSubmitting}
        />

        <form onSubmit={handleSubmitForm} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            <div className="flex flex-col space-y-4">
              <div className="relative w-full aspect-square overflow-hidden rounded-none border bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      unoptimized
                      className="object-cover object-center transition-all duration-300"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-4 space-y-2">
                    <UserIcon className="h-16 w-16 stroke-[1.25]" />
                    <span className="text-xs text-center">Chưa có avatar</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateRandomSeed}
                  disabled={isSubmitting || restoredData !== null}
                  className="flex items-center justify-center gap-2"
                >
                  <Shuffle className="h-4 w-4 text-muted-foreground" />
                  <span>Ngẫu nhiên</span>
                </Button>

                {restoredData ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleCancelRestore}
                    disabled={isSubmitting}
                  >
                    Hủy nhập
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span>Khôi phục</span>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Tên hiển thị</span>
                </Label>
                <Input
                  id="username"
                  type="text"
                  maxLength={25}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên của bạn..."
                  disabled={isSubmitting || restoredData !== null}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span>Phong cách định danh</span>
                </Label>

                <div className="grid grid-cols-2 gap-2">
                  {AVATAR_STYLES?.map((style) => {
                    const StyleIcon = style.icon
                    const isSelected = currentStyle === style.id
                    return (
                      <Button
                        key={style.id}
                        type="button"
                        variant="outline"
                        onClick={() => !isSubmitting && !restoredData && handleStyleChange(style.id)}
                        disabled={isSubmitting || restoredData !== null}
                        className={`flex h-20 flex-col items-start justify-between p-3 text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <div className="flex w-full items-center justify-between">
                          <StyleIcon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
                        </div>
                        <div className="space-y-0.5 w-full">
                          <div className="text-sm font-medium leading-none">
                            {style.name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate w-full">
                            {style.desc}
                          </div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {restoredData ? (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full gap-2 mt-auto"
                >
                  <LogIn className="h-4 w-4" />
                  {isSubmitting ? (
                    <span>Đang khôi phục...</span>
                  ) : (
                    <span>Xác nhận đăng nhập</span>
                  )}
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-auto"
                >
                  {isSubmitting ? (
                    <span>Đang khởi tạo...</span>
                  ) : (
                    <span>Khởi tạo</span>
                  )}
                </Button>
              )}

            </div>
          </div>
        </form>
      </div>
    </div>
  )
}