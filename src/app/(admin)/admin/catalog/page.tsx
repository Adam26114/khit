import Link from "next/link";
import { BookOpen, Boxes } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CatalogPage() {
  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Catalog</h1>
        <p className="mt-1 text-muted-foreground">
          Manage product catalog structure and product listings from one place.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="size-4" />
              Products
            </CardTitle>
            <CardDescription>Manage product listings, prices, and publish status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/products">Go to Products</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-4" />
              Categories
            </CardTitle>
            <CardDescription>Manage category hierarchy and collection grouping.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/admin/categories">Go to Categories</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
