"use client";

import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<string>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Carrega tema salvo ou define Light por padrão
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (selectedTheme: string) => {
    const root = document.documentElement;
    // Remove classes anteriores
    root.classList.remove('light', 'dark');
    // Adiciona nova classe
    root.classList.add(selectedTheme);
    // Salva no localStorage
    localStorage.setItem('theme', selectedTheme);
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTheme = e.target.value;
    setTheme(selectedTheme);
    applyTheme(selectedTheme);
  };

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">🌗 Tema:</label>
        <select className="theme-toggle" disabled>
          <option>Light</option>
        </select>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="theme-toggle" className="text-sm font-medium">🌗 Tema:</label>
      <select 
        id="theme-toggle" 
        className="theme-toggle"
        value={theme}
        onChange={handleThemeChange}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </div>
  );
}
