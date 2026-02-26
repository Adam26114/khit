"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/notifications";
import { Package, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@/../convex/_generated/dataModel";

interface InventoryItem {
  productId: Id<"products">;
  productName: string;
  colorVariantId: string;
  colorName: string;
  size: string;
  stock: number;
}

export default function InventoryPage() {
  const inventory = useQuery(api.inventory.getInventory);
  const updateStock = useMutation(api.inventory.updateStock);

  // Keep track of edited stock values locally before saving
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState<string | null>(null);

  const handleStockChange = (key: string, value: string) => {
    const num = parseInt(value, 10);
    setEditedStock((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  const handleSave = async (item: InventoryItem) => {
    const key = `${item.productId}-${item.colorVariantId}-${item.size}`;
    const newStock = editedStock[key];
    
    if (newStock === undefined || newStock === item.stock) return;

    setIsSaving(key);
    try {
      await updateStock({
        productId: item.productId,
        colorVariantId: item.colorVariantId,
        size: item.size,
        newStock,
      });
      notify.success(`Stock updated for ${item.productName}`);
      
      // Clear the local edit state since it's saved
      const newEdited = { ...editedStock };
      delete newEdited[key];
      setEditedStock(newEdited);
    } catch (error) {
      notify.actionError("update stock", error);
    } finally {
      setIsSaving(null);
    }
  };

  const columns: AdminTableColumn<InventoryItem>[] = [
    {
      id: "productName",
      header: "Product",
      searchAccessor: (item) => `${item.productName} ${item.colorName}`,
      cell: (item) => <span className="font-medium">{item.productName}</span>,
    },
    {
      id: "colorName",
      header: "Color",
      cell: (item) => <span className="text-muted-foreground">{item.colorName}</span>,
    },
    {
      id: "size",
      header: "Size",
      cell: (item) => (
        <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
          {item.size.toUpperCase() === "FREE SIZE" ? "F" : item.size}
        </span>
      ),
    },
    {
      id: "stock",
      header: "Stock Level",
      cell: (item) => {
        const key = `${item.productId}-${item.colorVariantId}-${item.size}`;
        const currentValue = editedStock[key] ?? item.stock;
        const isModified = editedStock[key] !== undefined && editedStock[key] !== item.stock;

        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              value={currentValue.toString()}
              onChange={(e) => handleStockChange(key, e.target.value)}
              className={`w-20 h-8 ${isModified ? "border-primary bg-primary/5" : ""}`}
            />
            {isModified && (
              <Button
                size="sm"
                variant="default"
                className="h-8 px-2"
                disabled={isSaving === key}
                onClick={() => handleSave(item)}
              >
                {isSaving === key ? (
                  <span className="size-4 rounded-full border-2 border-primary-foreground border-r-transparent animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                <span className="sr-only">Save</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  if (inventory === undefined) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-8">Inventory</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <p className="text-muted-foreground mt-1">
          Manage stock levels across all product variants.
        </p>
      </div>

      <AdminDataTable
        data={inventory}
        columns={columns}
        getRowId={(item) => `${item.productId}-${item.colorVariantId}-${item.size}`}
        emptyTitle="No inventory found"
        emptyDescription="Add products and variants to see them here."
        emptyIcon={Package}
        searchPlaceholder="Search products or colors..."
      />
    </div>
  );
}
