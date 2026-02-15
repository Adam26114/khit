"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  invalid?: boolean;
  "data-invalid"?: boolean;
}

const Field = React.forwardRef<HTMLDivElement, FieldProps>(
  ({ className, invalid, "data-invalid": dataInvalid, ...props }, ref) => (
    <div
      ref={ref}
      data-invalid={invalid ?? dataInvalid}
      className={cn("group/field grid gap-2", className)}
      {...props}
    />
  )
);
Field.displayName = "Field";

const FieldLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn("group-data-[invalid=true]/field:text-destructive", className)}
    {...props}
  />
));
FieldLabel.displayName = "FieldLabel";

const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-xs text-muted-foreground group-data-[invalid=true]/field:text-destructive", className)}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

export { Field, FieldDescription, FieldLabel };
