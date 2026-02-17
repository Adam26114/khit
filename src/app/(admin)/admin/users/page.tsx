import { UserRound } from "lucide-react";

import { AdminDataTable, type AdminTableColumn } from "@/components/admin/data-table";

export default function UsersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Users</h1>
      <AdminDataTable
        data={[] as { id: string }[]}
        getRowId={(row) => row.id}
        enableSearch={false}
        enablePagination={false}
        emptyTitle="Empty"
        emptyDescription="User management is coming soon."
        emptyIcon={UserRound}
        columns={[
          {
            id: "placeholder",
            header: "Users",
            cell: () => null,
          },
        ] satisfies AdminTableColumn<{ id: string }>[]}
      />
    </div>
  );
}
