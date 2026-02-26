import { cn } from "@/lib/utils";

interface FormattedPriceProps {
  price: number;
  className?: string;
}

export function FormattedPrice({ price, className }: FormattedPriceProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {price.toLocaleString()} MMK
    </span>
  );
}
