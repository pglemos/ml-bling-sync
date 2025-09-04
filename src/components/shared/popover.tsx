"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface PopoverContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover = ({ children, open = false, onOpenChange }: PopoverProps) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <PopoverContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </PopoverContext.Provider>
  );
};

const usePopover = () => {
  const context = useContext(PopoverContext);
  if (!context) {
    throw new Error("usePopover must be used within a Popover");
  }
  return context;
};

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const PopoverTrigger = ({ children, asChild, className }: PopoverTriggerProps) => {
  const { open, onOpenChange } = usePopover();

  const handleClick = () => {
    onOpenChange(!open);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
      className: cn(className, children.props.className),
      'aria-expanded': open,
    });
  }

  return (
    <button 
      onClick={handleClick} 
      className={className}
      aria-expanded={open}
    >
      {children}
    </button>
  );
};

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
}

const PopoverContent = ({ 
  children, 
  className,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  onEscapeKeyDown,
  onPointerDownOutside 
}: PopoverContentProps) => {
  const { open, onOpenChange } = usePopover();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeKeyDown?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onOpenChange, onEscapeKeyDown]);

  if (!open) return null;

  const getPositionClasses = () => {
    const baseClasses = "absolute z-50";
    
    switch (side) {
      case "top":
        return `${baseClasses} bottom-full mb-${sideOffset}`;
      case "right":
        return `${baseClasses} left-full ml-${sideOffset}`;
      case "left":
        return `${baseClasses} right-full mr-${sideOffset}`;
      case "bottom":
      default:
        return `${baseClasses} top-full mt-${sideOffset}`;
    }
  };

  const getAlignClasses = () => {
    switch (align) {
      case "start":
        return "left-0";
      case "end":
        return "right-0";
      case "center":
      default:
        return "left-1/2 transform -translate-x-1/2";
    }
  };

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={cn(
          getPositionClasses(),
          getAlignClasses(),
          "w-72 rounded-md border border-surface bg-surface p-4 text-primary shadow-md outline-none",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
};

// Set display names for better debugging
Popover.displayName = "Popover";
PopoverTrigger.displayName = "PopoverTrigger";
PopoverContent.displayName = "PopoverContent";

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
};
