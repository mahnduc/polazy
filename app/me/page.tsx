"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, Download, Trash2, Shield, HardDrive, User, LayoutGrid, ToggleLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useUserStore } from "@/store/profileStore"

const OPFS_FILE_NAME = "info.json"

export default function Profile() {
  const router = useRouter()
  const name = useUserStore((state) => state.name)
  const avatarUrl = useUserStore((state) => state.avatarUrl)
  const currentStyle = useUserStore((state) => state.currentStyle)
  const clearUserStore = useUserStore((state) => state.clearUser)

  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!name) {
      router.replace("/intro")
    }
  }, [name, router])

  const handleExportBackup = async () => {
    setIsExporting(true)
    try {
      const root = await navigator.storage.getDirectory()
      const fileHandle = await root.getFileHandle(OPFS_FILE_NAME)
      const file = await fileHandle.getFile()
      const text = await file.text()

      const blob = new Blob([text], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `prismora-backup-${name.toLowerCase().replace(/\s+/g, "-")}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Xuất file cấu hình danh tính sao lưu thành công!")
    } catch (err) {
      toast.error("Không tìm thấy dữ liệu cấu hình hợp lệ để xuất.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleClearIdentity = async () => {
    const confirmDelete = window.confirm("Bạn có chắc chắn muốn xóa danh tính này không? Hành động này sẽ hủy toàn bộ tệp cấu hình cục bộ.")
    if (!confirmDelete) return

    setIsDeleting(true)
    try {
      const root = await navigator.storage.getDirectory()
      await root.removeEntry(OPFS_FILE_NAME)
      
      clearUserStore()
      toast.success("Đã xóa hoàn toàn danh tính cục bộ thành công.")
      router.replace("/intro")
    } catch (err) {
      toast.error("Lỗi hệ thống: Không thể xóa tệp cấu hình sandbox.")
    } finally {
      setIsDeleting(false)
    }
  }

  if (!name) return null

  return (
    <div className="flex min-h-screen w-full flex-col bg-background text-foreground font-sans antialiased">
      {/* Header điều hướng */}
      <header className="h-14 border-b border-border bg-card px-4 flex items-center gap-4 flex-shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 rounded-md"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs font-mono tracking-wider uppercase text-muted-foreground">/root/nodes/identity</span>
      </header>

      {/* Vùng nội dung chia hai cột */}
      <div className="flex-1 max-w-4xl w-full mx-auto grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 p-6 md:p-12 items-start">
        
        {/* CỘT TRÁI: Chỉ bọc Container cho Avatar và Tên */}
        <div className="rounded-xl border bg-card p-6 flex flex-col items-center text-center space-y-4 shadow-sm">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-primary/20 bg-background flex items-center justify-center shadow-inner">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          
          <div className="space-y-1.5 w-full">
            <h2 className="text-lg font-bold tracking-tight text-foreground truncate px-1">{name}</h2>
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium font-mono bg-muted border text-muted-foreground uppercase">
              {currentStyle || "Custom"} Style
            </span>
          </div>
        </div>

        {/* CỘT PHẢI: Thông tin chi tiết (Thả tự do không bọc Card tổng) */}
        <div className="space-y-8 pt-2">
          {/* Section 1: Thông tin hệ thống */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2 select-none">
              <Shield className="h-3.5 w-3.5 text-primary" /> Cấu trúc phân vùng bảo mật
            </h4>
            <Separator className="bg-border/60" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-xs font-mono pt-1">
              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Phương thức lưu trữ</span>
                <span className="text-foreground flex items-center gap-1.5 font-medium">
                  <HardDrive className="h-3.5 w-3.5 text-muted-foreground" /> Node OPFS Sandbox
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Trạng thái tệp cấu hình</span>
                <span className="text-emerald-500 font-bold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> info.json (Mounted)
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Phạm vi định danh</span>
                <span className="text-foreground font-medium">Isolated Client-Side</span>
              </div>

              <div className="space-y-1">
                <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">Định tuyến Node ID</span>
                <span className="text-muted-foreground/80">prismora_node_01::local</span>
              </div>
            </div>
          </div>

          {/* Section 2: Hành động quản trị */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2 select-none">
              <ToggleLeft className="h-3.5 w-3.5 text-primary" /> Thiết lập nâng cao
            </h4>
            <Separator className="bg-border/60" />
            
            <div className="flex flex-wrap gap-3 pt-1">
              <Button
                variant="outline"
                className="text-xs gap-2 h-9 px-4 rounded-lg bg-card hover:bg-muted"
                onClick={handleExportBackup}
                disabled={isExporting || isDeleting}
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                {isExporting ? "Đang trích xuất..." : "Sao lưu cấu hình JSON"}
              </Button>

              <Button
                variant="destructive"
                className="text-xs gap-2 h-9 px-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-all"
                onClick={handleClearIdentity}
                disabled={isExporting || isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {isDeleting ? "Đang gỡ bỏ..." : "Xóa danh tính cục bộ"}
              </Button>
            </div>
            
            <p className="text-[10px] text-muted-foreground/60 font-mono leading-relaxed max-w-md pt-2">
              * Hệ thống Prismora hoạt động hoàn toàn ở môi trường local. Việc xóa danh tính sẽ xóa sạch bộ nhớ Sandbox của trình duyệt và không thể khôi phục trừ khi bạn có file sao lưu JSON.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}