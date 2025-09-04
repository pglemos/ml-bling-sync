"use client";

import React, { createContext, useContext } from "react";
import { cn } from "@/lib/utils";

interface ToggleGroupContextType {
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  type?: "single" | "multiple";
  disabled?: boolean;
}

const ToggleGroupContext = createContext<ToggleGroupContextType | undefined>(undefined);

const useToggleGroup = () => {
  const context = useContext(ToggleGroupContext);
  if (!context) {
    throw new Error("useToggleGroup must be used within a ToggleGroup");
  }
  return context;
};

interface ToggleGroupProps {
  children: React.ReactNode;
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  disabled?: boolean;
}

const ToggleGroup = ({ 
  children, 
  type = "single", 
  value, 
  onValueChange, 
  className,
  disabled = false 
}: ToggleGroupProps) => {
  return (
    <ToggleGroupContext.Provider value={{ value, onValueChange, type, disabled }}>
      <div 
        className={cn(
          "flex items-center justify-center gap-1",
          className
        )}
        role="group"
      >
        {children}
      </div>
    </ToggleGroupContext.Provider>
  );
};

interface ToggleGroupItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

const ToggleGroupItem = ({ 
  children, 
  value, 
  className, 
  disabled: itemDisabled,
  "aria-label": ariaLabel,
  ...props 
}: ToggleGroupItemProps) => {
  const { value: groupValue, onValueChange, type, disabled: groupDisabled } = useToggleGroup();
  
  const isDisabled = itemDisabled || groupDisabled;
  
  const isPressed = type === "single" 
    ? groupValue === value
    : Array.isArray(groupValue) && groupValue.includes(value);

  const handleClick = () => {
    if (isDisabled || !onValueChange) return;

    if (type === "single") {
      onValueChange(isPressed ? "" : value);
    } else {
      const currentValues = Array.isArray(groupValue) ? groupValue : [];
      if (isPressed) {
        onValueChange(currentValues.filter(v => v !== value));
      } else {
        onValueChange([...currentValues, value]);
      }
    }
  };

  return (
    <button
      type="button"
      role="button"
      aria-pressed={isPressed}
      aria-label={ariaLabel}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-surface transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary",
        "h-10 px-3",
        isPressed && "bg-primary/10 text-primary",
        className
      )}
      data-state={isPressed ? "on" : "off"}
      {...props}
    >
      {children}
    </button>
  );
};

// Set display names for better debugging
ToggleGroup.displayName = "ToggleGroup";
ToggleGroupItem.displayName = "ToggleGroupItem";

export {
  ToggleGroup,
  ToggleGroupItem,
};
