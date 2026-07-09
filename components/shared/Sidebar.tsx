"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, TrendingDown, CreditCard, RefreshCw, TrendingUp, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/novo", label: "Novo", icon: Plus },
  { href: "/despesas", label: "Despesas", icon: TrendingDown },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/recorrentes", label: "Recorrentes", icon: RefreshCw },
  { href: "/investimentos", label: "Investimentos", icon: TrendingUp },
  { href: "/ir", label: "IR", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 bg-white border-thin border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-600 text-primary">Esquilo</h1>
      </div>

      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors text-sm",
                    isActive
                      ? "bg-primary-light text-primary font-500"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-thin border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
