"use client";

import * as React from "react";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    
    // Carrega tema salvo ou define Light por padrão
    const savedTheme = localStorage.getItem('theme') || 'light';
    const root = document.documentElement;
    
    // Remove classes anteriores e aplica o tema salvo
    root.classList.remove('light', 'dark');
    root.classList.add(savedTheme);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
