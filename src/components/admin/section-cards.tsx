import { TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormattedPrice } from "@/components/ui/formatted-price";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  trend?: {
    value: string;
    isUp: boolean;
  };
  footerInfo: string;
  isPrice?: boolean;
}

export function SectionCards({ stats }: { stats: any }) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-0 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <FormattedPrice price={stats?.revenue ?? 0} />
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 px-1.5">
              <TrendingUp className="size-3" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground text-xs">
            Based on completed orders
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.pending ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 px-1.5 text-orange-600 border-orange-200 bg-orange-50">
              Requires attention
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Awaiting processing
          </div>
          <div className="text-muted-foreground text-xs">
            From last 24 hours
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.productsCount ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 px-1.5">
              <TrendingUp className="size-3" />
              +4.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Stock growth stable <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground text-xs">Active in catalog</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Low Stock Items</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.lowStockCount ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 px-1.5 text-red-600 border-red-200 bg-red-50">
              <TrendingDown className="size-3" />
              Critical
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-red-600">
            Needs replenishment <TrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground text-xs">Items below threshold</div>
        </CardFooter>
      </Card>
    </div>
  );
}
