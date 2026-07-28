"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  FolderLock,
  UploadCloud,
  Users,
  MessageSquare,
  Bell,
  User,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "My Vault", href: "/dashboard/vault", icon: FolderLock },
  { name: "Upload", href: "/dashboard/upload", icon: UploadCloud },
  { name: "Friends", href: "/dashboard/friends", icon: Users },
  { name: "Chats", href: "/dashboard/chats", icon: MessageSquare },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Profile", href: "/dashboard/profile", icon: User },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-6 left-6 z-50 p-2 rounded-lg bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 text-white transition-transform hover:scale-105"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-72 bg-[#050505]/80 backdrop-blur-2xl border-r border-white/5
          transform transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo Area */}
        <div className="h-24 flex items-center px-8">
          <span className="text-white text-xl font-medium tracking-wide flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-black font-bold text-sm">S</span>
            </div>
            SnapVault
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Highlight active if path perfectly matches, or starts with it (for nested pages)
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5">
          <form action="/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium text-neutral-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
            >
              <LogOut size={18} />
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}