"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

interface CollapsibleContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null);

function useCollapsibleContext(): CollapsibleContextValue {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("Collapsible components must be used within <Collapsible />");
  }
  return context;
}

interface CollapsibleProps extends React.ComponentProps<"div"> {
  asChild?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Collapsible({
  asChild = false,
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  ...props
}: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const Comp = asChild ? Slot : "div";

  return (
    <CollapsibleContext.Provider value={{ open: currentOpen, setOpen }}>
      <Comp data-state={currentOpen ? "open" : "closed"} className={className} {...props} />
    </CollapsibleContext.Provider>
  );
}

interface CollapsibleTriggerProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

export function CollapsibleTrigger({
  asChild = false,
  className,
  onClick,
  ...props
}: CollapsibleTriggerProps) {
  const { open, setOpen } = useCollapsibleContext();
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-state={open ? "open" : "closed"}
      className={className}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        setOpen(!open);
      }}
      {...props}
    />
  );
}

interface CollapsibleContentProps extends React.ComponentProps<"div"> {
  forceMount?: boolean;
}

export function CollapsibleContent({
  className,
  forceMount = false,
  ...props
}: CollapsibleContentProps) {
  const { open } = useCollapsibleContext();
  if (!open && !forceMount) return null;

  return (
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  );
}
