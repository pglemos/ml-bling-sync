"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  GitBranch,
  Undo2,
  BookOpen,
  Box,
  Wallet,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/returns", label: "Devoluções", icon: Undo2 },
  { href: "/integrations", label: "Integrações", icon: GitBranch },
  { href: "/financial", label: "Financeiro", icon: Wallet, permission: "financial" },
  { href: "/catalog", label: "Catálogo", icon: BookOpen },
  { href: "/kits", label: "Kits", icon: Box },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();

  return (
    <aside className="sidebar w-64">
      <div className="h-16 flex items-center justify-center text-2xl font-bold text-primary-600 dark:text-primary-400 border-b border-gray-200 dark:border-gray-700">
        MarketSync
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors",
                pathname.startsWith(item.href)
                  ? "bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}