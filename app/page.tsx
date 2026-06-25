"use client"

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
import Topbar from "@/components/common/Topbar"
import { LogList } from "@/components/app/LogList"

export default function Page() {

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground overflow-hidden font-sans antialiased">
      <Topbar />
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
                  <LogList />
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