import { Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminSearchPage() {
  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="mt-1 text-muted-foreground">
          Search tools for admin content are available here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="size-4" />
            Admin Search
          </CardTitle>
          <CardDescription>
            Find products, orders, and inventory records quickly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="Search products, orders, SKUs..." />
        </CardContent>
      </Card>
    </div>
  );
}
