"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Peer, { DataConnection } from "peerjs"
import { Send, User, Copy, Check, UserPlus, X, CheckCircle2 } from "lucide-react"

interface ChatMessage {
  sender: "me" | "peer"
  text: string
  timestamp: string
}

interface P2PPayload {
  text: string
}

export default function Chat() {
  const [peerId, setPeerId] = useState<string>("")
  const [remoteId, setRemoteId] = useState<string>("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState<string>("")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  // Trạng thái xử lý yêu cầu kết nối từ người khác
  const [incomingConn, setIncomingConn] = useState<DataConnection | null>(null)

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)

  useEffect(() => {
    const peer: Peer = new Peer()
    peerRef.current = peer

    peer.on("open", (id: string) => {
      setPeerId(id)
    })

    // Lắng nghe khi có người khác gửi yêu cầu kết nối đến bạn
    peer.on("connection", (connection: DataConnection) => {
      if (isConnected) {
        // Nếu đang trong cuộc trò chuyện khác, tự động từ chối
        connection.close()
        return
      }
      // Giữ kết nối ở trạng thái chờ và hiển thị UI yêu cầu chấp nhận
      setIncomingConn(connection)
    })

    return () => {
      peer.destroy()
    }
  }, [isConnected])

  // Hàm thiết lập lắng nghe sự kiện sau khi kết nối ĐÃ ĐƯỢC CHẤP NHẬN
  function setupConnectionListeners(connection: DataConnection) {
    connection.on("open", () => {
      setIsConnected(true)
      setIncomingConn(null) // Xóa trạng thái chờ
    })

    connection.on("data", (data: unknown) => {
      const payload = data as P2PPayload
      if (payload && typeof payload.text === "string") {
        setMessages((prev) => [
          ...prev,
          { sender: "peer", text: payload.text, timestamp: new Date().toLocaleTimeString() }
        ])
      }
    })

    connection.on("close", () => {
      setIsConnected(false)
      connRef.current = null
      setMessages([])
    })

    connection.on("error", (err: Error) => {
      console.error("Lỗi P2P:", err)
      setIsConnected(false)
    })
  }

  // Chủ động gửi yêu cầu kết nối tới người khác (Họ sẽ nhận được thông báo Chấp nhận)
  const handleConnect = (): void => {
    if (!peerRef.current || !remoteId.trim()) return
    const connection: DataConnection = peerRef.current.connect(remoteId.trim())
    connRef.current = connection
    setupConnectionListeners(connection)
  }

  // Đồng ý kết nối từ người khác gửi tới (Đã loại bỏ hoàn toàn kiểu 'any')
  const acceptConnection = (): void => {
    if (!incomingConn) return

    // Gán kết nối vào reference lưu trữ
    connRef.current = incomingConn

    // Thiết lập luồng lắng nghe dữ liệu cho kết nối này
    setupConnectionListeners(incomingConn)

    // PeerJS đối với DataConnection (Chat) không cần hàm .answer()
    // Chúng ta chỉ cần ép trạng thái hiển thị phòng chat lên true
    setIsConnected(true)
    setIncomingConn(null)
  }

  // Từ chối kết nối từ người khác
  const rejectConnection = (): void => {
    if (!incomingConn) return
    incomingConn.close()
    setIncomingConn(null)
  }

  // Ngắt kết nối hiện tại
  const disconnectChat = (): void => {
    if (connRef.current) {
      connRef.current.close()
    }
  }

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    if (!input.trim() || !connRef.current) return

    const messagePayload: P2PPayload = { text: input.trim() }
    connRef.current.send(messagePayload)

    setMessages((prev) => [
      ...prev,
      { sender: "me", text: input.trim(), timestamp: new Date().toLocaleTimeString() }
    ])
    setInput("")
  }

  const copyToClipboard = (): void => {
    if (!peerId) return
    navigator.clipboard.writeText(peerId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-screen w-screen bg-background font-sans antialiased overflow-hidden">

      <div className="flex-1 flex flex-col bg-card min-w-0">
        {/* Chat Header */}
        <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-muted/20 flex-shrink-0">
          {isConnected && (
            <Button variant="outline" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={disconnectChat}>
              Ngắt kết nối
            </Button>
          )}
        </div>

        {/* Khung chứa tin nhắn cuộn độc lập */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center my-20 p-6 border border-dashed rounded-xl bg-muted/10">
                <p className="text-sm font-medium mb-1">Chưa có cuộc trò chuyện nào</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Chia sẻ ID của bạn ở thanh cấu hình bên phải hoặc nhập ID của đối phương để bắt đầu truyền dữ liệu trực tiếp.
                </p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col max-w-[70%] ${msg.sender === "me" ? "ml-auto items-end" : "mr-auto items-start"}`}
              >
                <div className={`p-3.5 rounded-2xl border text-sm leading-relaxed shadow-sm ${msg.sender === "me"
                  ? "bg-primary text-primary-foreground border-transparent rounded-tr-none"
                  : "bg-muted/60 border-border/80 rounded-tl-none"
                  }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-muted-foreground/50 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Input gửi tin nhắn */}
        <div className="p-4 border-t border-border bg-background flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                placeholder={isConnected ? "Nhập nội dung tin nhắn bảo mật..." : "Hệ thống đang chờ kết nối P2P..."}
                value={input}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
                disabled={!isConnected}
                className="text-sm flex-1 h-10 shadow-sm"
              />
              <Button type="submit" size="icon" disabled={!isConnected || !input.trim()} className="h-10 w-10 shadow-sm">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* VÙNG CẤU HÌNH & XỬ LÝ CHẤP NHẬN (BÊN PHẢI - RỘNG 340px) */}
      <div className="w-85 border-l border-border bg-muted/20 p-5 flex flex-col gap-5 flex-shrink-0 justify-between">

        <div className="space-y-5">
          {/* Section 1: ID của bạn */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Identity</CardTitle>
              <CardDescription className="text-[11px]">Cung cấp mã này cho bạn bè để nhận cuộc gọi.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2 bg-background p-2 rounded-lg border shadow-inner">
                <span className="font-mono text-xs truncate flex-1 font-medium">{peerId || "Đang tạo mã..."}</span>
                {peerId && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-muted" onClick={copyToClipboard}>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Chủ động kết nối */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connect to Peer</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <Input
                placeholder="Nhập ID đối phương..."
                value={remoteId}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRemoteId(e.target.value)}
                disabled={isConnected || !!incomingConn}
                className="text-xs h-9"
              />
              <Button
                onClick={handleConnect}
                disabled={isConnected || !remoteId.trim() || !!incomingConn}
                className="w-full text-xs h-9 gap-1.5 shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" /> Kết nối đối tác
              </Button>
            </CardContent>
          </Card>

          {/* Section 3: Hộp thoại Xử lý Chấp nhận khi có kết nối đến */}
          {incomingConn && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-md animate-in fade-in zoom-in-95 duration-200">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <UserPlus className="h-4 w-4 animate-bounce" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Yêu cầu kết nối</CardTitle>
                </div>
                <CardDescription className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Một thiết bị khác đang yêu cầu thiết lập phòng chat P2P với bạn.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3">
                <div className="bg-background/80 dark:bg-zinc-900/60 p-2 rounded border border-emerald-500/20 font-mono text-[11px] truncate text-center font-semibold">
                  ID: {incomingConn.peer}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/10 gap-1" onClick={rejectConnection}>
                    <X className="h-3 w-3" /> Từ chối
                  </Button>
                  <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 shadow-sm" onClick={acceptConnection}>
                    <Check className="h-3 w-3" /> Chấp nhận
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Trạng thái hệ thống ở đáy Sidebar */}
        <div className="border-t border-border/60 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : incomingConn ? "bg-amber-500 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700"}`} />
            <span className="text-[11px] font-medium text-muted-foreground">
              {isConnected ? "Secure Connected" : incomingConn ? "Incoming Request..." : "Disconnection"}
            </span>
          </div>
          {isConnected && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </div>

      </div>

    </div>
  )
}