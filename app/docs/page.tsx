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

const DOCS_LIST = [
  { id: "app-info.md", title: "Thông tin chung" },
  { id: "features.md", title: "Tính năng" },
  { id: "map-in-app.md", title: "Bản đồ thế giới" },
];

export default function DocsPage() {
  const router = useRouter();
  const { name, avatarUrl, initializeUser } = useUserStore();
  const [selectedFile, setSelectedFile] = useState<string>(DOCS_LIST[0].id);
  const [content, setContent] = useState<string>("");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  useEffect(() => {
    initializeUser((url) => console.log("Redirect to", url));
  }, [initializeUser]);

  useEffect(() => {
    fetch(`${basePath}/docs/${selectedFile}`)
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error("Error fetching doc:", err));
  }, [selectedFile, basePath]);

  return (
    <div className="flex h-screen gap-6 p-6 bg-background">
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
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{name?.slice(0, 2).toUpperCase() || "US"}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold truncate">{name || "User"}</span>
            <span className="text-xs text-muted-foreground">System Design</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {DOCS_LIST.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedFile(doc.id)}
                className={`block w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedFile === doc.id ? "bg-muted font-medium" : "hover:bg-muted/50"
                }`}
              >
                {doc.title}
              </button>
            ))}
          </div>
        </ScrollArea>
      </aside>

      <main className="flex-1 overflow-y-auto px-8 py-2">
        <article className="prose prose-slate dark:prose-invert max-w-4xl mx-auto">
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