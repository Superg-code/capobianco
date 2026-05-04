"use client";

import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

type HeaderProps = {
  name: string;
  role: "admin" | "salesperson";
  zona?: string | null;
};

export default function Header({ name, role, zona }: HeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200 h-14 px-6 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-brand rounded-full w-8 h-8 flex items-center justify-center">
            <User className="w-4 h-4 text-text" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-text leading-tight">{name}</p>
            <p className="text-xs text-text-muted">
              {role === "admin" ? "Amministratore" : `Venditore${zona ? ` · ${zona}` : ""}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-2 p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Esci"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
