'use client';

import { GlobalConfigType } from "@/lib/globals"
import { ColumnFiltersState, ColumnVisibilityState, createColumnHelper, SortingState, useTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTableFeatures, features } from "./data-table-features";
import { ApiSystemLog } from "@/lib/api";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ButtonGroup, ButtonGroupSeparator } from "./ui/button-group";
import { Input } from "./ui/input";

type SystemLogTableProps = {
  Config: GlobalConfigType;
}
export function SystemLogTable(props: SystemLogTableProps) {
  const [localStatusCodeFilter, setLocalStatusCodeFilter] = useState<string>('');
  const [localMessageFilter, setLocalMessageFilter] = useState<string>();
  const [localDetailsFilter, setLocalDetailsFilter] = useState<string>();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'col-createdAt', desc: true },
  ]);

  const columnHelper = createColumnHelper<DataTableFeatures, ApiSystemLog>();

  const commonProperties: Parameters<typeof columnHelper.accessor>[1] = {
    enableHiding: true,
    enableColumnFilter: true,
    enableSorting: true,
  };
  function getStatusCodeColor(statusCode: number): string {
    if (300 <= statusCode && statusCode < 400) return 'text-cyan-500';
    if (400 <= statusCode && statusCode < 500) return 'text-amber-500';
    return 'text-rose-500'
  }

  function displayStatusCode(sl: ApiSystemLog): string {
    return `${sl.statusCode} ${sl.statusCodeText}`;
  }

  const columns = columnHelper.columns([
    columnHelper.accessor('id', {
      ...commonProperties as any,
      id: 'col-id',
      header: '#',
      size: 10,
      minSize: 10,
    }),
    columnHelper.accessor('statusCode', {
      ...commonProperties as any,
      id: 'col-statusCode',
      header: 'Status code',
      size: 20,
      cell({ row }) {
        var x: ApiSystemLog
        return <span className={cn("capitalize", getStatusCodeColor(row.original.statusCode))}>
          {displayStatusCode(row.original)}
        </span>
      }
    }),
    columnHelper.accessor('message', {
      ...commonProperties as any,
      id: 'col-message',
      header: 'Message',
      minSize: 100,
    }),
    columnHelper.accessor('errors', {
      ...commonProperties as any,
      id: 'col-details',
      header: 'Details',
      size: 20,
      cell({ row }) {
        return <ul>
          {row.original.errors?.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      }
    }),
    columnHelper.accessor('createdAt', {
      ...commonProperties as any,
      id: 'col-createdAt',
      header: 'Created at',
      size: 20,
      cell({ row }) {
        let value: ApiSystemLog['createdAt'] | Date = row.original.createdAt;
        if (typeof value === 'string') value = new Date(value);
        if (value instanceof Date) return <span>{value.toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)Z/g, '$4:$5:$6 $3/$2/$1')}</span>
        return <span></span>
      },
      sortFn(rowA, rowB, columnId) {
        let a: ApiSystemLog['createdAt'] | Date = rowA.getValue<ApiSystemLog['createdAt']>(columnId);
        let b: ApiSystemLog['createdAt'] | Date = rowB.getValue<ApiSystemLog['createdAt']>(columnId);
        if (typeof a == 'string') a = new Date(a);
        if (typeof b == 'string') b = new Date(b);

        if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
        if (a === undefined && b !== undefined) return -1;
        if (a !== undefined && b === undefined) return 1;
        return 0;
      },
    })
  ]);

  const filteredSystemLogs: ApiSystemLog[] = useMemo(() => {
    if (props.Config.Api.Data.SystemLogs.Getter === undefined) return [];
    return props.Config.Api.Data.SystemLogs.Getter.filter(x => {
      const conds: boolean[] = [];

      if (!!localStatusCodeFilter) conds.push(displayStatusCode(x) == localStatusCodeFilter);
      if (!!localMessageFilter) conds.push(x.message.toLowerCase().includes(localMessageFilter.toLowerCase()));
      if (!!localDetailsFilter) conds.push(x.errors?.some(x => x.toLowerCase().includes(localDetailsFilter.toLowerCase())) ?? false)

      return conds.every(Boolean);
    })
  }, [
    localStatusCodeFilter,
    localMessageFilter,
    localDetailsFilter,
    props.Config.Api.Data.SystemLogs.Getter
  ])

  const tbl = useTable({
    features: features,
    data: filteredSystemLogs,
    columns: columns,

    enableSorting: true,
    autoResetPageIndex: false,

    initialState: {
      sorting: []
    },

    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
  });

  return <div className="overflow-hidden rounded-md border">
    <div className="flex items-center py-4 gap-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="ml-auto">
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {
            tbl
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {column.id.replace('col-', '')}
                </DropdownMenuCheckboxItem>
              ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    <Table>
      <TableHeader>
        {tbl.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead
                  key={header.id}
                  style={{
                    width: header.getSize(),
                  }}
                >
                  {header.isPlaceholder ? null : (
                    <tbl.FlexRender header={header} />
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {tbl.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              switch (header.id) {
                case 'col-message':
                  return <TableCell key={header.id}>
                    <ButtonGroup className="w-full">
                      <Input value={localMessageFilter ?? ''} onChange={(e) => setLocalMessageFilter(e.target.value)} />
                      <Button size="icon" disabled={!localMessageFilter} onClick={() => setLocalMessageFilter(undefined)}>
                        <X />
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                case 'col-details':
                  return <TableCell key={header.id}>
                    <ButtonGroup className="w-full">
                      <Input value={localDetailsFilter ?? ''} onChange={(e) => setLocalDetailsFilter(e.target.value)} />
                      <Button size="icon" disabled={!localDetailsFilter} onClick={() => setLocalDetailsFilter(undefined)}>
                        <X />
                      </Button>
                    </ButtonGroup>
                  </TableCell>
                case 'col-statusCode':
                  return <TableCell key={header.id}>
                    <ButtonGroup className="w-full">
                      <Select value={localStatusCodeFilter} onValueChange={setLocalStatusCodeFilter}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a status code" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set((props.Config.Api.Data.SystemLogs.Getter ?? []).map(l => displayStatusCode(l)))].sort().map(l => (
                            <SelectItem key={l} value={l} className="capitalize">
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="icon" disabled={!localStatusCodeFilter} onClick={() => setLocalStatusCodeFilter('')}><X /></Button>
                    </ButtonGroup>
                  </TableCell>
                default: return <TableCell key={header.id}></TableCell>
              }
            })}
          </TableRow>
        ))}
        {tbl.getRowModel().rows?.length ? (
          tbl.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(cell.id.endsWith('col-actions') ? 'm-0 p-0' : '')}
                  style={{
                    width: cell.column.getSize(),
                  }}
                >
                  <tbl.FlexRender cell={cell} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>

    <div className="flex items-center justify-center space-x-2 py-4 select-none">
      <Button
        variant="outline"
        size="icon"
        onClick={() => tbl.firstPage()}
        disabled={!tbl.getCanPreviousPage()}
        className="cursor-pointer"
      >
        <ChevronsLeft />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => tbl.previousPage()}
        disabled={!tbl.getCanPreviousPage()}
        className="cursor-pointer"
      >
        <ChevronLeft />
      </Button>
      <span>{tbl.state.pagination.pageIndex + 1}/{tbl.getPageCount()}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => tbl.nextPage()}
        disabled={!tbl.getCanNextPage()}
        className="cursor-pointer"
      >
        <ChevronRight />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => tbl.lastPage()}
        disabled={!tbl.getCanNextPage()}
        className="cursor-pointer"
      >
        <ChevronsRight />
      </Button>
    </div>

  </div >
}