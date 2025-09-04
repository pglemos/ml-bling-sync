"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionProps {
  type?: "single" | "multiple"
  collapsible?: boolean
  className?: string
  children: React.ReactNode
}

interface AccordionItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

interface AccordionTriggerProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

interface AccordionContentProps {
  className?: string
  children: React.ReactNode
}

const AccordionContext = React.createContext<{
  openItems: Set<string>
  toggleItem: (value: string) => void
}>({ openItems: new Set(), toggleItem: () => {} })

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean }>({ value: "", isOpen: false })

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ className, children, type = "single", ...props }, ref) => {
    const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

    const toggleItem = React.useCallback((value: string) => {
      setOpenItems(prev => {
        const newSet = new Set(prev)
        if (type === "single") {
          newSet.clear()
          if (!prev.has(value)) {
            newSet.add(value)
          }
        } else {
          if (prev.has(value)) {
            newSet.delete(value)
          } else {
            newSet.add(value)
          }
        }
        return newSet
      })
    }, [type])

    return (
      <AccordionContext.Provider value={{ openItems, toggleItem }}>
        <div ref={ref} className={className} {...props}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { openItems } = React.useContext(AccordionContext)
    const isOpen = openItems.has(value)

    return (
      <AccordionItemContext.Provider value={{ value, isOpen }}>
        <div ref={ref} className={cn("border-b", className)} {...props}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { toggleItem } = React.useContext(AccordionContext)
    const { value, isOpen } = React.useContext(AccordionItemContext)

    return (
      <button
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline w-full text-left",
          className
        )}
        onClick={() => toggleItem(value)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = React.useContext(AccordionItemContext)

    if (!isOpen) return null

    return (
      <div
        ref={ref}
        className={cn("overflow-hidden text-sm transition-all", className)}
        {...props}
      >
        <div className="pb-4 pt-0">{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
