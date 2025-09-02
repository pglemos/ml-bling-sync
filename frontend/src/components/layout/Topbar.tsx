"use client";

import { Bell, UserCircle, Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export function Topbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar flex items-center justify-end px-6">
      <div className="flex items-center gap-4">
        <button onClick={toggleTheme} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
          <Bell className="h-6 w-6" />
        </button>
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-600"></div>
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200 cursor-pointer" onClick={logout} title="Sair">
          <UserCircle className="h-8 w-8 text-gray-500 dark:text-gray-400" />
          <div>
            <p className="text-sm font-medium">{user?.email || "Usuário"}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.roles.join(', ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}