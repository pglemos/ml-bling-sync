import { Button } from "@/components/shared/button";
import { ThemeSwitcher } from "@/components/shared/theme-switcher";
import { Bell, Search } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="glass-effect border-b border-surface sticky top-0 z-40 animate-fade-in">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="animate-slide-in-left">
            <h1 className="text-3xl font-bold gradient-text">{title}</h1>
            <p className="text-muted mt-1 font-medium animate-fade-in" style={{animationDelay: '0.1s'}}>{description}</p>
          </div>
          <div className="flex items-center space-x-4 animate-slide-in-right">
            <ThemeSwitcher />
            <button className="relative p-3 text-muted-foreground hover:text-foreground transition-all duration-300 bg-card rounded-xl shadow-sm hover:shadow-md border btn-animate focus-ring">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-card animate-pulse"></span>
            </button>
            <Button className="px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 btn-animate bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 focus-ring">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0 0h6m-6 0h-6" />
              </svg>
              <span>Sincronizar Agora</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
