"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  MoreHorizontal,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyIcon, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type SortDirection = "asc" | "desc" | null;
type CheckboxState = boolean | "indeterminate";

export type AdminTableColumn<T> = {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
  searchable?: boolean;
  searchAccessor?: (row: T) => string;
  filterLabel?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number | boolean | Date | null | undefined;
  hideable?: boolean;
  defaultHidden?: boolean;
};

export type AdminToolbarAction = {
  label: string;
  onClick: () => void | Promise<void>;
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
};

export type AdminRowAction<T> = {
  label: string;
  onClick: (row: T) => void | Promise<void>;
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
};

export type AdminBulkAction<T> = {
  label: string;
  onClick: (rows: T[]) => void | Promise<void>;
  icon?: LucideIcon;
  destructive?: boolean;
  disabled?: boolean;
};

type AdminDataTableProps<T> = {
  data: T[];
  columns: AdminTableColumn<T>[];
  getRowId: (row: T) => string;
  className?: string;
  rowClassName?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  enableSearch?: boolean;
  enablePagination?: boolean;
  enableColumnVisibility?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  rowsPerPageOptions?: number[];
  rowActions?: (row: T) => AdminRowAction<T>[];
  rowActionsLabel?: string;
  toolbarActions?: AdminToolbarAction[];
  bulkActions?: AdminBulkAction<T>[];
  onBulkDelete?: (rows: T[]) => void | Promise<void>;
  bulkDeleteLabel?: string;
};

const DEFAULT_ROWS_PER_PAGE_OPTIONS = [10, 20, 30, 40];

function normalizeSortValue(value: unknown): string | number {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value).toLowerCase();
}

export function AdminDataTable<T>({
  data,
  columns,
  getRowId,
  className,
  rowClassName,
  emptyTitle = "Empty",
  emptyDescription = "No data available.",
  emptyIcon: EmptyStateIcon = Database,
  enableSearch = true,
  enablePagination = true,
  enableColumnVisibility = true,
  searchPlaceholder = "Filter...",
  pageSize = 10,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  rowActions,
  rowActionsLabel = "Actions",
  toolbarActions = [],
  bulkActions = [],
  onBulkDelete,
  bulkDeleteLabel = "Delete selected",
}: AdminDataTableProps<T>) {
  const hideableColumns = React.useMemo(
    () => columns.filter((column) => column.hideable !== false),
    [columns]
  );

  const [columnVisibility, setColumnVisibility] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      hideableColumns.map((column) => [column.id, !column.defaultHidden])
    )
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortColumnId, setSortColumnId] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);
  const [selectedRowIds, setSelectedRowIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setColumnVisibility((prev) => {
      const next: Record<string, boolean> = {};
      for (const column of hideableColumns) {
        next[column.id] =
          column.id in prev ? prev[column.id] : !column.defaultHidden;
      }
      return next;
    });
  }, [hideableColumns]);

  React.useEffect(() => {
    setSelectedRowIds((prev) => {
      const validIds = new Set(data.map(getRowId));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [data, getRowId]);

  const visibleColumns = React.useMemo(
    () =>
      columns.filter(
        (column) => column.hideable === false || columnVisibility[column.id] !== false
      ),
    [columnVisibility, columns]
  );

  React.useEffect(() => {
    if (sortColumnId && !visibleColumns.some((column) => column.id === sortColumnId)) {
      setSortColumnId(null);
      setSortDirection(null);
    }
  }, [sortColumnId, visibleColumns]);

  const searchableColumns = React.useMemo(
    () => visibleColumns.filter((column) => column.searchable !== false),
    [visibleColumns]
  );

  const getSearchText = React.useCallback((row: T, column: AdminTableColumn<T>) => {
    if (column.searchAccessor) return column.searchAccessor(row).toLowerCase();
    if (typeof row === "object" && row !== null) {
      const value = (row as Record<string, unknown>)[column.id];
      if (value === null || value === undefined) return "";
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return String(value).toLowerCase();
      }
    }
    return "";
  }, []);

  const filteredData = React.useMemo(() => {
    if (!enableSearch || !searchQuery.trim() || searchableColumns.length === 0) return data;
    const q = searchQuery.trim().toLowerCase();
    return data.filter((row) =>
      searchableColumns.some((column) => getSearchText(row, column).includes(q))
    );
  }, [data, enableSearch, getSearchText, searchQuery, searchableColumns]);

  const sortedData = React.useMemo(() => {
    if (!sortColumnId || !sortDirection) return filteredData;
    const sortColumn = columns.find((column) => column.id === sortColumnId);
    if (!sortColumn || sortColumn.sortable === false) return filteredData;

    return [...filteredData].sort((a, b) => {
      const rawA = sortColumn.sortAccessor
        ? sortColumn.sortAccessor(a)
        : typeof a === "object" && a !== null
          ? (a as Record<string, unknown>)[sortColumn.id]
          : undefined;
      const rawB = sortColumn.sortAccessor
        ? sortColumn.sortAccessor(b)
        : typeof b === "object" && b !== null
          ? (b as Record<string, unknown>)[sortColumn.id]
          : undefined;

      const valueA = normalizeSortValue(rawA);
      const valueB = normalizeSortValue(rawB);
      const result =
        typeof valueA === "number" && typeof valueB === "number"
          ? valueA - valueB
          : String(valueA).localeCompare(String(valueB), undefined, {
              numeric: true,
              sensitivity: "base",
            });

      return sortDirection === "asc" ? result : -result;
    });
  }, [columns, filteredData, sortColumnId, sortDirection]);

  const mergedRowsPerPageOptions = React.useMemo(() => {
    const values = new Set(
      [...rowsPerPageOptions, pageSize]
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0)
    );
    return Array.from(values).sort((a, b) => a - b);
  }, [pageSize, rowsPerPageOptions]);

  React.useEffect(() => {
    if (!mergedRowsPerPageOptions.includes(rowsPerPage)) {
      setRowsPerPage(mergedRowsPerPageOptions[0] || 10);
    }
  }, [mergedRowsPerPageOptions, rowsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rowsPerPage, sortColumnId, sortDirection]);

  const filteredRows = sortedData.length;
  const totalRows = data.length;
  const totalPages = enablePagination ? Math.max(1, Math.ceil(filteredRows / rowsPerPage)) : 1;
  const page = Math.min(currentPage, totalPages);
  const startIndex = enablePagination ? (page - 1) * rowsPerPage : 0;
  const pagedData = enablePagination
    ? sortedData.slice(startIndex, startIndex + rowsPerPage)
    : sortedData;

  const pageRowIds = React.useMemo(() => pagedData.map(getRowId), [getRowId, pagedData]);
  const selectedOnPageCount = pageRowIds.filter((id) => selectedRowIds.has(id)).length;
  const pageCheckboxState: CheckboxState =
    pageRowIds.length === 0
      ? false
      : selectedOnPageCount === 0
        ? false
        : selectedOnPageCount === pageRowIds.length
          ? true
          : "indeterminate";

  const filteredRowIds = React.useMemo(() => sortedData.map(getRowId), [getRowId, sortedData]);
  const filteredRowIdSet = React.useMemo(() => new Set(filteredRowIds), [filteredRowIds]);
  const selectedFilteredCount = React.useMemo(
    () => Array.from(selectedRowIds).filter((id) => filteredRowIdSet.has(id)).length,
    [filteredRowIdSet, selectedRowIds]
  );

  const selectedRows = React.useMemo(
    () => data.filter((row) => selectedRowIds.has(getRowId(row))),
    [data, getRowId, selectedRowIds]
  );

  const effectiveBulkActions = React.useMemo(() => {
    const actions = [...bulkActions];
    if (onBulkDelete) {
      actions.push({
        label: bulkDeleteLabel,
        onClick: onBulkDelete,
        destructive: true,
      });
    }
    return actions;
  }, [bulkActions, bulkDeleteLabel, onBulkDelete]);

  const toggleSort = (column: AdminTableColumn<T>) => {
    if (column.sortable === false) return;
    if (sortColumnId !== column.id) {
      setSortColumnId(column.id);
      setSortDirection("asc");
      return;
    }

    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }

    if (sortDirection === "desc") {
      setSortColumnId(null);
      setSortDirection(null);
      return;
    }

    setSortDirection("asc");
  };

  const toggleColumnVisibility = (columnId: string, checked: CheckboxState) => {
    const nextVisible = checked === true;
    const visibleHideableCount = hideableColumns.filter(
      (column) => columnVisibility[column.id] !== false
    ).length;
    if (!nextVisible && visibleHideableCount <= 1) return;

    setColumnVisibility((prev) => ({ ...prev, [columnId]: nextVisible }));
  };

  const sortIcon = (column: AdminTableColumn<T>) => {
    if (column.sortable === false) return null;
    if (sortColumnId !== column.id || !sortDirection) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  const fromCount = filteredRows === 0 ? 0 : startIndex + 1;
  const toCount = enablePagination
    ? Math.min(startIndex + pagedData.length, filteredRows)
    : filteredRows;

  const showToolbarMenu = toolbarActions.length > 0 || effectiveBulkActions.length > 0;

  const runToolbarAction = async (action: AdminToolbarAction) => {
    if (action.disabled) return;
    await action.onClick();
  };

  const runBulkAction = async (action: AdminBulkAction<T>) => {
    const disabled = action.disabled || selectedRows.length === 0;
    if (disabled) return;
    await action.onClick(selectedRows);
    setSelectedRowIds(new Set());
  };

  const runRowAction = async (action: AdminRowAction<T>, row: T) => {
    if (action.disabled) return;
    await action.onClick(row);
  };

  const executeMenuAction = (action: () => Promise<void>) => {
    void action().catch((error) => {
      console.error("Table action failed", error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {enableSearch ? (
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="sm:max-w-sm"
          />
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {enableColumnVisibility && hideableColumns.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Columns
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={columnVisibility[column.id] !== false}
                    onCheckedChange={(checked) => toggleColumnVisibility(column.id, checked)}
                    className="capitalize"
                  >
                    {column.filterLabel ??
                      (typeof column.header === "string" ? column.header : column.id)}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {showToolbarMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open table actions">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {toolbarActions.length > 0 && (
                  <>
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {toolbarActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <DropdownMenuItem
                          key={action.label}
                          onClick={() => {
                            executeMenuAction(() => runToolbarAction(action));
                          }}
                          disabled={action.disabled}
                          className={action.destructive ? "text-destructive focus:text-destructive" : ""}
                        >
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          <span>{action.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}

                {effectiveBulkActions.length > 0 && (
                  <>
                    {toolbarActions.length > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
                    {effectiveBulkActions.map((action) => {
                      const Icon = action.icon;
                      const disabled = action.disabled || selectedRows.length === 0;
                      return (
                        <DropdownMenuItem
                          key={action.label}
                          onClick={() => {
                            if (disabled) return;
                            executeMenuAction(() => runBulkAction(action));
                          }}
                          disabled={disabled}
                          className={action.destructive ? "text-destructive focus:text-destructive" : ""}
                        >
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          <span>{action.label}</span>
                        </DropdownMenuItem>
                      );
                    })}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Card className={cn("shadow-none", className)}>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox
                    aria-label="Select all rows on page"
                    checked={pageCheckboxState}
                    onCheckedChange={(checked) => {
                      const shouldSelect = checked === true;
                      setSelectedRowIds((prev) => {
                        const next = new Set(prev);
                        for (const id of pageRowIds) {
                          if (shouldSelect) next.add(id);
                          else next.delete(id);
                        }
                        return next;
                      });
                    }}
                  />
                </TableHead>

                {visibleColumns.map((column) => (
                  <TableHead key={column.id} className={cn("px-4 py-3", column.headerClassName)}>
                    {column.sortable === false ? (
                      column.header
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort(column)}
                        className="h-8 -ml-2 justify-start px-2 font-medium text-foreground"
                      >
                        <span>{column.header}</span>
                        {sortIcon(column)}
                      </Button>
                    )}
                  </TableHead>
                ))}

                {rowActions && <TableHead className="w-[56px] px-4 py-3" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={visibleColumns.length + (rowActions ? 2 : 1)} className="p-6">
                    <Empty className="border-0 py-12">
                      <EmptyIcon>
                        <EmptyStateIcon className="size-5" />
                      </EmptyIcon>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                pagedData.map((row) => {
                  const rowId = getRowId(row);
                  const actions = rowActions?.(row) ?? [];

                  return (
                    <TableRow key={rowId} className={rowClassName}>
                      <TableCell className="w-12 px-4 py-3">
                        <Checkbox
                          aria-label={`Select row ${rowId}`}
                          checked={selectedRowIds.has(rowId)}
                          onCheckedChange={(checked) => {
                            const shouldSelect = checked === true;
                            setSelectedRowIds((prev) => {
                              const next = new Set(prev);
                              if (shouldSelect) next.add(rowId);
                              else next.delete(rowId);
                              return next;
                            });
                          }}
                        />
                      </TableCell>

                      {visibleColumns.map((column) => (
                        <TableCell key={column.id} className={cn("px-4 py-3", column.cellClassName)}>
                          {column.cell(row)}
                        </TableCell>
                      ))}

                      {rowActions && (
                        <TableCell className="w-[56px] px-4 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" aria-label={`Open actions for row ${rowId}`}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>{rowActionsLabel}</DropdownMenuLabel>
                              {actions.map((action) => {
                                const Icon = action.icon;
                                return (
                                  <DropdownMenuItem
                                    key={action.label}
                                    onClick={() => {
                                      executeMenuAction(() => runRowAction(action, row));
                                    }}
                                    disabled={action.disabled}
                                    className={action.destructive ? "text-destructive focus:text-destructive" : ""}
                                  >
                                    {Icon ? <Icon className="h-4 w-4" /> : null}
                                    <span>{action.label}</span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 px-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {selectedFilteredCount} of {filteredRows} row(s) selected.
          {filteredRows !== totalRows ? ` (filtered from ${totalRows})` : ""}
        </p>

        {enablePagination ? (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {mergedRowsPerPageOptions.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <span>
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={page <= 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={page >= totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <p>
            Showing {fromCount}-{toCount} of {filteredRows}
          </p>
        )}
      </div>
    </div>
  );
}
