import { useState } from "react";
import { Settings, Trash2, AlertTriangle, CheckCircle, X, LucideIcon, LayoutDashboard, Bot, Settings2, Plus, Command } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

type TabType = "system" | "menu" | "agent";

interface NavigationItem {
  id: TabType;
  title: string;
  icon: LucideIcon;
  rotateOnHover?: boolean;
}

export default function ControlPanel() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("menu");
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "confirm" | "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: "",
  });

  const NAVIGATION_TABS: NavigationItem[] = [
    { id: "menu", title: "Dung lượng bộ nhớ", icon: LayoutDashboard },
    { id: "agent", title: "Trợ lý cá nhân", icon: Bot },
    { id: "system", title: "Cài đặt hệ thống", icon: Settings, rotateOnHover: false },
  ];

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const triggerOpfsClear = () => {
    setModalState({
      isOpen: true,
      type: "confirm",
      title: "Xác nhận xóa dữ liệu",
      message: "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu lưu trữ cục bộ (OPFS)? Hành động này không thể hoàn tác.",
    });
  };

  const handleClearOpfs = async () => {
    try {
      closeModal();
      const root = await navigator.storage.getDirectory();
      for await (const name of root.keys()) {
        await root.removeEntry(name, { recursive: true });
      }

      setModalState({
        isOpen: true,
        type: "success",
        title: "Thành công",
        message: "Đã xóa sạch toàn bộ dữ liệu trong không gian OPFS.",
      });
    } catch (error) {
      console.error(error);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Lỗi hệ thống",
        message: "Không thể xóa dữ liệu. Vui lòng thử lại sau.",
      });
    }
  };

  const handleModalConfirm = () => {
    if (modalState.type === "confirm") {
      handleClearOpfs();
    } else if (modalState.type === "success") {
      closeModal();
      window.location.reload();
    } else {
      closeModal();
    }
  };

  return (
    <>
      <div className="p-4 flex flex-row items-start w-full gap-4 max-w-4xl rounded-xl bg-background text-foreground select-none">
        <div className="flex flex-col items-center justify-top gap-3 pt-0.5 border-r border-border/40 pr-1.5">
          {NAVIGATION_TABS.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setActiveTab(tab.id)}
                title={tab.title}
                className={`h-9 w-9 rounded-md transition-all group border ${isActive
                    ? "border-border"
                    : "border-transparent hover:border-border"
                  }`}
              >
                <IconComponent
                  className={`h-5 w-5 transition-transform duration-300 ${tab.rotateOnHover
                      ? isActive
                        ? "rotate-45"
                        : "group-hover:rotate-45"
                      : ""
                    }`}
                />
              </Button>
            );
          })}
        </div>

        <div className="flex-1 max-w-md bg-background text-foreground font-sans">
          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  System Settings
                </h3>
                <p className="text-xs text-muted-foreground">
                  Quản lý cấu hình và xem thông tin tài nguyên hệ thống hiện tại.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Lưu trữ cục bộ
                </h4>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium leading-none">Dọn dẹp dữ liệu lưu trữ</p>
                      <p className="text-xs text-muted-foreground">
                        Xóa toàn bộ file, chỉ mục và tài liệu đã lưu trong kho lưu trữ cục bộ.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={triggerOpfsClear}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Thông tin thêm
                </h4>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm hover:border-primary/50 transition-colors">
                  <button
                    onClick={() => router.push("/docs")}
                    className="w-full p-4 text-left space-y-0.5"
                  >
                    <p className="text-sm font-medium leading-none">Tài liệu thiết kế phần mềm</p>
                    <p className="text-xs text-muted-foreground">
                      Thông tin chi tiết về kiến trúc và tổ chức mã nguồn.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "menu" && (
            <div className="animate-fade-in w-full">
              <div className="space-y-1 text-left">
                <h3 className="text-sm font-semibold tracking-tight uppercase text-foreground">
                  Danh sách tính năng
                </h3>
                <p className="text-xs text-muted-foreground">
                  Khám phá các không gian tương tác và kết nối trên hệ thống.
                </p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                <button
                  onClick={()  => router.push("/chat")}
                  className="w-full flex items-center justify-between rounded-lg border border-border bg-card text-card-foreground p-3 font-medium shadow-sm hover:bg-muted hover:border-border/80 transition-all duration-200 text-left group"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">
                      Trò chuyện & Kết nối với mọi người
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Tham gia phòng chat trực tuyến, gửi tin nhắn thời gian thực và mở rộng mạng lưới liên kết.
                    </div>
                  </div>
                  <div className="h-7 w-7 rounded-md flex items-center justify-center border border-border bg-background group-hover:bg-card transition-all text-muted-foreground group-hover:text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-square"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === "agent" && (
            <div className="animate-in fade-in duration-500 w-full space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground uppercase">
                    Quản lý Agent cá nhân
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Cấu hình và tùy chỉnh các trợ lý AI của riêng bạn.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs"
                  onClick={() => router.push("/map")}
                >
                  <Command className="h-3.5 w-3.5" /> Quản lý
                </Button>
              </div>

              <Separator />

              <div className="grid gap-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Coding Assistant</p>
                        <p className="text-xs text-muted-foreground">Model: GPT-4o-mini | Mode: Expert</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar/Status */}
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>Hiệu suất</span>
                      <span>Active</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div className="h-1.5 w-[85%] rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-background p-6 shadow-lg animate-scale-in">
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-full flex-shrink-0 ${modalState.type === "confirm" || modalState.type === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-500/10 text-emerald-500"
                }`}>
                {modalState.type === "confirm" && <AlertTriangle className="h-5 w-5" />}
                {modalState.type === "error" && <AlertTriangle className="h-5 w-5" />}
                {modalState.type === "success" && <CheckCircle className="h-5 w-5" />}
              </div>

              <div className="flex-1 space-y-1 text-left">
                <h3 className="text-base font-semibold leading-6 text-foreground">
                  {modalState.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {modalState.message}
                </p>
              </div>

              <button
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              {modalState.type === "confirm" && (
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium border border-border bg-background hover:bg-muted text-foreground rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                onClick={handleModalConfirm}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${modalState.type === "confirm" || modalState.type === "error"
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-emerald-600 hover:bg-emerald-500"
                  }`}
              >
                {modalState.type === "confirm" ? "Xác nhận xóa" : "Đóng"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}