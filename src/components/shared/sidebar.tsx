"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface shadow-2xl border-r border-surface animate-slide-in-left">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-20 px-6 border-b border-surface">
          <div className="flex items-center space-x-3 animate-fade-in">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text">SyncPro</span>
              <p className="text-xs text-muted font-medium">Integração Inteligente</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 animate-fade-in" style={{animationDelay: '0.1s'}}>
          {children}
        </nav>
        
        {/* User Profile */}
        <div className="p-6 border-t border-surface animate-fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-surface hover:bg-primary/5 transition-all duration-300 cursor-pointer card-hover">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300">
              <span className="text-primary-foreground font-bold text-sm">JS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-primary">João Silva</p>
              <p className="text-xs text-muted">Plano Premium</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted transition-transform duration-300 hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  badge?: string | number;
  badgeVariant?: "default" | "success" | "warning";
  page?: string;
  currentPage?: string;
}

export function SidebarItem({ 
  href, 
  icon, 
  children, 
  badge, 
  badgeVariant = "default",
  page,
  currentPage
}: SidebarItemProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = page === currentPage || pathname?.startsWith(href);
  
  // Prefetch the route on component mount for instant navigation
  useEffect(() => {
    router.prefetch(href);
  }, [router, href]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Use router.push for instant navigation
    router.push(href);
  };
  
  const badgeClasses = {
    default: "bg-indigo-100 text-indigo-600",
    success: "bg-green-100 text-green-600",
    warning: "bg-yellow-100 text-yellow-600"
  };

  return (
    <Link 
      href={href}
      onClick={handleClick}
      className={cn(
        "sidebar-item flex items-center px-4 py-3 text-sm font-medium rounded-xl",
        isActive 
          ? "active text-primary-foreground" 
          : "text-muted hover:text-primary hover:bg-primary/5"
      )}
      data-page={page}
    >
      <div className="w-5 h-5 mr-4">{icon}</div>
      {children}
      {badge && (
        <span className={cn(
          "ml-auto text-xs px-2 py-1 rounded-full",
          badgeClasses[badgeVariant]
        )}>
          {badge}
        </span>
      )}
    </Link>
  );
}
