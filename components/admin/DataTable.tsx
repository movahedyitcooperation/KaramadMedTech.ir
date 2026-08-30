import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface DataTableColumn<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyLabel: string;
}

/**
 * Deliberately thin — not a generic sortable/filterable/paginated grid. With
 * only two CRUD tables in scope (products, categories) and pagination
 * already handled server-side via URL search params (mirroring how the
 * public catalog page already paginates, reusing components/ui/Pagination.tsx
 * unmodified), a fuller data-grid abstraction isn't justified yet.
 */
export function DataTable<T>({ columns, rows, rowKey, emptyLabel }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-line py-16 text-center text-sm text-ink-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-soft">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-line bg-bg">
            {columns.map((col) => (
              <th key={col.header} className={cn("px-4 py-3 text-start font-medium text-ink-500", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-bg">
              {columns.map((col) => (
                <td key={col.header} className={cn("px-4 py-3 text-ink-900", col.className)}>
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
