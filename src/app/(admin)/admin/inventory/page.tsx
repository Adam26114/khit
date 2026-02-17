import { Boxes } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";

export default function InventoryPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Inventory</h1>
      <AdminDataTable
        data={[] as { id: string }[]}
        getRowId={(row) => row.id}
        enableSearch={false}
        enablePagination={false}
        emptyTitle="Empty"
        emptyDescription="Inventory management is coming soon."
        emptyIcon={Boxes}
        columns={[
          {
            id: "placeholder",
            header: "Inventory",
            cell: () => null,
          },
        ] satisfies AdminTableColumn<{ id: string }>[]}
      />
    </div>
  );
}
