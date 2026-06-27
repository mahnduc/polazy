"use client"

import { useUserStore } from "@/store/profileStore";
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { User } from "lucide-react";
import AvatarBlockUI from "./AvatarBlockUI";

export default function Topbar() {
  const name = useUserStore((state) => state.nickname)
  const avatarUrl = useUserStore((state) => state.avatarUrl)
  const router = useRouter()

  return (
    <header className="h-14 border-b border-border bg-card px-4 flex items-center justify-between flex-shrink-0 z-50">
      <div
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity duration-200"
        onClick={() => router.push("/")}
      >
        <span className="font-extrabold tracking-wider text-sm uppercase text-primary">
          Prismora
        </span>
      </div>

      <AvatarBlockUI />
    </header>
  )
}