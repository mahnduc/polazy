"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Folder, File, Loader2, Trash2 } from "lucide-react"
import JsonViewer from "@uiw/react-json-view"
import { darkTheme } from "@uiw/react-json-view/dark"
import { toast } from "sonner"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FileSystemNode {
  name: string
  kind: "file" | "directory"
  handle: FileSystemHandle
  children?: FileSystemNode[]
}

interface NodeItemProps {
  node: FileSystemNode
  parentHandle: FileSystemDirectoryHandle | null
  onView: (node: FileSystemNode) => void
  onDelete: (
    node: FileSystemNode,
    parent: FileSystemDirectoryHandle | null
  ) => void
}

export function LocalResources() {
  const [nodes, setNodes] = useState<FileSystemNode[]>([])
  const [loading, setLoading] = useState(true)
  const [jsonData, setJsonData] = useState<object | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<{
    node: FileSystemNode
    parentHandle: FileSystemDirectoryHandle | null
  } | null>(null)

  const scanOPFS = useCallback(
    async (dirHandle: FileSystemDirectoryHandle): Promise<FileSystemNode[]> => {
      const items: FileSystemNode[] = []
      for await (const entry of dirHandle.values()) {
        const node: FileSystemNode = {
          name: entry.name,
          kind: entry.kind,
          handle: entry,
        }
        if (entry.kind === "directory") {
          node.children = await scanOPFS(entry as FileSystemDirectoryHandle)
        }
        items.push(node)
      }
      return items
    },
    []
  )

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const root = await navigator.storage.getDirectory()
      const data = await scanOPFS(root)
      setNodes(data)
    } catch {
      toast.error("Không thể tải cấu trúc thư mục")
    } finally {
      setLoading(false)
    }
  }, [scanOPFS])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const root = await navigator.storage.getDirectory()
        const data = await scanOPFS(root)
        if (mounted) setNodes(data)
      } catch {
        toast.error("Không thể tải cấu trúc thư mục")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [scanOPFS])

  const handleView = async (node: FileSystemNode) => {
    if (node.kind === "file" && node.name.toLowerCase().endsWith(".json")) {
      try {
        const file = await (node.handle as FileSystemFileHandle).getFile()
        const text = await file.text()
        setJsonData(JSON.parse(text))
      } catch {
        toast.error("Không thể đọc file JSON")
      }
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const parent = deleteTarget.parentHandle || (await navigator.storage.getDirectory())
      await parent.removeEntry(deleteTarget.node.name, { recursive: true })
      toast.success(`Đã xóa ${deleteTarget.node.name}`)
      setJsonData(null)
      await refresh()
    } catch {
      toast.error("Không thể xóa file/thư mục")
    }
    setDeleteTarget(null)
  }

  if (loading) return <Loader2 className="h-5 w-5 mx-auto mt-4 animate-spin text-muted-foreground" />

  return (
    <div className="absolute inset-0 flex overflow-hidden">
      
      <ScrollArea className="w-1/3 min-w-55 max-w-[320px] border-r border-border h-full">
        <div className="space-y-1 p-4 pr-3 select-none">
          {nodes.map((node) => (
            <NodeItem
              key={node.name}
              node={node}
              parentHandle={null}
              onView={handleView}
              onDelete={(node, parent) => setDeleteTarget({ node, parentHandle: parent })}
            />
          ))}
        </div>
      </ScrollArea>

      <ScrollArea className="flex-1 h-full">
        <div className="p-4 pl-5">
          {jsonData ? (
            <div className="w-full">
              <div style={darkTheme as React.CSSProperties} className="w-full text-xs">
                <JsonViewer 
                  value={jsonData} 
                  style={{ background: "transparent", padding: 0 }}
                  displayDataTypes={false}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-[calc(100vh-120px)] w-full items-center justify-center text-xs text-muted-foreground/80 select-none">
              Chọn một file để xem nội dung
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm font-semibold tracking-tight">Bạn chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              {`Hành động này sẽ xóa vĩnh viễn "${deleteTarget?.node.name}" khỏi hệ thống lưu trữ.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs h-8">
              Xóa dữ liệu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function NodeItem({ node, parentHandle, onView, onDelete }: NodeItemProps) {
  const isJson = node.kind === "file" && node.name.toLowerCase().endsWith(".json")

  return (
    <div>
      <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 cursor-default">
        {node.kind === "directory" ? (
          <Folder className="h-3.5 w-3.5 text-blue-500/90 shrink-0" />
        ) : (
          <File className="h-3.5 w-3.5 text-muted-foreground/80 shrink-0" />
        )}

        <span
          className={`flex-1 truncate text-xs tracking-tight ${
            isJson ? "cursor-pointer hover:text-primary transition-colors" : "text-foreground/70"
          }`}
          onClick={() => isJson && onView(node)}
        >
          {node.name}
        </span>

        <div className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
          <Trash2
            className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded hover:bg-background border border-transparent hover:border-border"
            onClick={() => onDelete(node, parentHandle)}
          />
        </div>
      </div>

      {node.children?.map((child) => (
        <div className="ml-3.5 border-l border-border/40 pl-2.5" key={child.name}>
          <NodeItem
            node={child}
            parentHandle={node.handle as FileSystemDirectoryHandle}
            onView={onView}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}