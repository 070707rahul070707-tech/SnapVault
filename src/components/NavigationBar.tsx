"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Vault, User, LayoutGrid } from "lucide-react"; // Using LayoutGrid for Vault

const navItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Chats", href: "/dashboard/chats", icon: MessageCircle },
  { name: "Vault", href: "/dashboard/vault", icon: LayoutGrid },
  { name: "Profile", href: "/dashboard/profile", icon: User },
];

export default function NavigationBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-sm">
      <nav className="flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-full border border-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative group flex flex-col items-center justify-center"
            >
              <div 
                className={`
                  p-2.5 rounded-full transition-all duration-300 
                  ${isActive 
                    ? "bg-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]" 
                    : "text-neutral-500 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
              </div>
              
              {/* Tiny glowing dot underneath the active icon */}
              {isActive && (
                <span className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}