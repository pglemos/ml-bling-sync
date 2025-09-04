"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shared/dialog";
import { Badge } from "@/components/shared/badge";
import { Separator } from "@/components/shared/separator";
import { Keyboard, Command } from "lucide-react";

interface KeyboardShortcut {
  key: string;
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  {
    key: "N",
    description: "Criar novo produto",
    category: "Produtos",
  },
  {
    key: "/",
    description: "Focar campo de busca",
    category: "Navegação",
  },
  {
    key: "Esc",
    description: "Fechar modais e limpar seleções",
    category: "Navegação",
  },
  {
    key: "?",
    description: "Mostrar atalhos de teclado",
    category: "Ajuda",
  },
  {
    key: "Tab",
    description: "Navegar entre elementos",
    category: "Navegação",
  },
  {
    key: "Enter",
    description: "Ativar elemento focado",
    category: "Navegação",
  },
];

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
}: KeyboardShortcutsHelpProps) {
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos para navegar mais rapidamente pela aplicação.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs px-2 py-1 min-w-[2rem] justify-center"
                    >
                      {shortcut.key === " " ? "Space" : shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
              <Separator className="mt-3" />
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2">
          <div className="flex items-center justify-center gap-1">
            <Command className="w-3 h-3" />
            <span>Pressione ? para abrir esta ajuda</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to manage keyboard shortcuts help
export function useKeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.key === "?" && !event.shiftKey) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    isOpen,
    setIsOpen,
  };
}
