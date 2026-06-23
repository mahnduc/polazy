"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Terminal,
  Database
} from "lucide-react"
import { LocalResources } from "@/components/app/LocalResources"
import ControlPanel from "@/components/app/ControlPanel"
import { useUserStore } from "@/store/profileStore"

export default function Page() {
  const name = useUserStore((state) => state.name)
  const avatarUrl = useUserStore((state) => state.avatarUrl)

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground overflow-hidden font-sans antialiased">
      <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between flex-shrink-0 z-50">
        <div className="flex items-center gap-2.5">
          <span className="font-extrabold tracking-wider text-sm uppercase text-primary">
            Prismora
          </span>
        </div>

        <Link href="/me" className="group">
          <div className="flex items-center gap-2 p-1 pr-3 rounded-full bg-muted/40 border border-border/50 hover:bg-muted hover:border-border transition-all duration-200 cursor-pointer">
            <div className="h-7 w-7 rounded-full border border-border/80 bg-background overflow-hidden flex items-center justify-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name || "User Avatar"}
                  width={28}
                  height={28}
                  unoptimized
                  className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
              )}
            </div>

            {name && (
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors select-none">
                {name}
              </span>
            )}
          </div>
        </Link>
      </header>
      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={95} minSize={40}>
          <Tabs defaultValue="logs" className="w-full h-full flex flex-col bg-card">

            <div className="flex h-12 items-center justify-between px-4 bg-card flex-shrink-0">
              <TabsList className="h-9 bg-muted/40 p-1 gap-1 rounded-lg border border-border/40">
                <TabsTrigger
                  value="logs"
                  className="text-xs gap-2 h-7 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm bg-transparent text-muted-foreground hover:text-foreground transition-all"
                >
                  <Terminal className="h-3.5 w-3.5" /> Trung tâm kiểm soát
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="text-xs gap-2 h-7 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm bg-transparent text-muted-foreground hover:text-foreground transition-all"
                >
                  <Database className="h-3.5 w-3.5" /> Trung tâm dữ liệu
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 bg-card">
              <TabsContent value="logs" className="m-0 h-full w-full border-none outline-none">
                <ScrollArea className="h-full w-full p-4 pt-2 font-mono text-xs text-muted-foreground">
                  <div className="flex justify-between items-center pb-2 mb-3 sticky top-0 bg-card z-10">
                    <span className="text-[10px] font-bold tracking-wider text-muted-foreground/70">STDOUT STREAM</span>
                  </div>
                  <div className="space-y-1.5">
                    <p><span className="text-muted-foreground/50 font-sans">[17:30:01]</span> <span className="text-emerald-600 font-bold">SYS/INIT</span> Ready.</p>
                    <p><span className="text-muted-foreground/50 font-sans">[17:30:05]</span> <span className="text-emerald-600 font-bold">DB/CONN</span> OPFS storage mounted successfully.</p>
                    <p><span className="text-muted-foreground/50 font-sans">[17:31:12]</span> <span className="text-amber-600 font-bold">PROC/WARN</span> Thread high load detected.</p>
                    <p><span className="text-muted-foreground/50 font-sans">[17:32:18]</span> <span className="text-emerald-600 font-bold">IPC/SYNC</span> Awaiting branch composition triggers...</p>
                    <p className="text-primary animate-pulse font-bold">_</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="resources" className="m-0 h-full w-full border-none outline-none">
                <ScrollArea className="h-full w-full p-4 pt-2">
                  <LocalResources />
                </ScrollArea>
              </TabsContent>
            </div>

          </Tabs>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={5} minSize={5} className="max-w-[57px] min-w-[57px]">
          <div className="h-full flex flex-col bg-background">
            <ScrollArea className="h-full w-full">
              <ControlPanel />
            </ScrollArea>
          </div>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  )
}