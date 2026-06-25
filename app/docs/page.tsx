"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/profileStore";

const DOCS_SECTION = [
  { id: "app-info.md", title: "Thông tin chung" },
  { id: "features.md", title: "Tính năng" },
  { id: "decentralized-infrastructure.md", title: "Hạ tầng phi tập trung" },
];

const API_SECTION = [
  { id: "log-bus.md", title: "LogBus" },
];

export default function DocsPage() {
  const router = useRouter();
  const { nickname, avatarUrl } = useUserStore();
  const [selectedFile, setSelectedFile] = useState<string>(DOCS_SECTION[0].id);
  const [content, setContent] = useState<string>("");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    fetch(`${basePath}/docs/${selectedFile}`)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Error fetching doc:", err));
  }, [selectedFile, basePath]);

  return (
    <div className="flex h-screen gap-6 p-6 bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <Button
          variant="ghost"
          className="justify-start gap-2 -ml-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <div className="flex items-center gap-3 p-2">
          <Avatar className="h-12 w-12 border">
            <AvatarImage src={avatarUrl} alt={nickname} />
            <AvatarFallback>{nickname?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold truncate">{nickname || "User"}</span>
            <span className="text-xs text-muted-foreground">System Design</span>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-1">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 px-3">
                Tài liệu tổng quan
              </h4>
              <div className="space-y-0.5">
                {DOCS_SECTION.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedFile(doc.id)}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs ${selectedFile === doc.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                  >
                    {doc.title}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 px-3">
                API References
              </h4>
              <div className="space-y-0.5">
                {API_SECTION.map((api) => (
                  <button
                    key={api.id}
                    onClick={() => setSelectedFile(api.id)}
                    className={`block w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs ${selectedFile === api.id
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                  >
                    {api.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-2 bg-slate-950">
        <article className="
          prose prose-invert max-w-4xl mx-auto
          text-slate-400
          prose-headings:text-slate-100
          prose-code:text-emerald-400 
          prose-code:bg-slate-800/50
          prose-code:px-1.5 
          prose-code:py-0.5 
          prose-code:rounded-md
          prose-strong:text-slate-200
        ">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>
    </div>
  );
}