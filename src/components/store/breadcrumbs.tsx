"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-2 text-[10px] sm:text-[11px] uppercase tracking-widest text-gray-400 font-medium", className)}
    >
      <Link 
        href="/" 
        className="flex items-center hover:text-black transition-colors"
      >
        <Home className="size-3 mr-1" />
        <span className="sr-only sm:not-sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="size-3 shrink-0" />
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-black transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-black whitespace-nowrap">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
