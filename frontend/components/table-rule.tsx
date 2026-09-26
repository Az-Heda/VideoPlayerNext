import { GlobalConfigType } from "@/lib/globals";
import { ColumnFiltersState, ColumnVisibilityState, createColumnHelper, SortingState, useTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { DataTableFeatures, features } from "./data-table-features";
import { ApiRule } from "@/lib/api";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ButtonGroup } from "./ui/button-group";
import { Input } from "./ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, SearchAlert, Trash2, X } from "lucide-react";
import { cn, displayNumber } from "@/lib/utils";


type AutomaticRulesTableProps = {
  Config: GlobalConfigType;
}
export function AutomaticRulesTable(props: AutomaticRulesTableProps) {
  const [localFilterRegex, setLocalFilterRegex] = useState<string>();

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    'col-id': false,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredRules = useMemo(() => {
    if (props.Config.Api.Data.Rules.Getter === undefined) return [];
    return props.Config.Api.Data.Rules.Getter.filter(r => {
      var conds: boolean[] = [];
      if (localFilterRegex) conds.push(r.regexRaw.toLowerCase().includes(localFilterRegex.toLowerCase()));
      return conds.every(Boolean);
    });
  }, [
    localFilterRegex,
    props.Config.Api.Data.Rules.Getter,
  ])

  const columnHelper = createColumnHelper<DataTableFeatures, ApiRule>();
  const commonProperties: Parameters<typeof columnHelper.accessor>[1] = {
    enableHiding: true,
    enableColumnFilter: true,
    enableSorting: true,
  };
  const columns = columnHelper.columns([
    columnHelper.accessor('id', {
      ...commonProperties as any,
      id: 'col-id',
      header: 'Id',
      size: 20,
      minSize: 20,
      maxSize: 20,
    }),
    columnHelper.accessor('regexRaw', {
      ...commonProperties as any,
      id: 'col-regex',
      header: 'Regex',
    }),
    columnHelper.accessor('playlists', {
      ...commonProperties as any,
      id: 'col-playlists',
      header: 'Playlists',
      size: 10,
      cell({ row }) {
        return <span>{displayNumber(row.original.playlists?.length ?? 0)}</span>
      }
    }),
    columnHelper.accessor('tags', {
      ...commonProperties as any,
      id: 'col-tags',
      header: 'Tags',
      size: 10,
      cell({ row }) {
        return <span>{displayNumber(row.original.tags?.length ?? 0)}</span>
      }
    }),
    columnHelper.accessor('id', {
      ...commonProperties as any,
      id: 'col-actions',
      header: 'Actions',
      size: 1,
      cell({ row }) {
        return <ButtonGroup className="w-full">
          <Button variant="secondary" size="icon">
            <SearchAlert />
          </Button>
          <Button variant="secondary" size="icon">
            <Trash2 />
          </Button>
        </ButtonGroup>
      }
    })
  ]);

  const tbl = useTable({
    features: features,
    data: filteredRules,
    columns: columns,

    enableSorting: true,
    autoResetPageIndex: true,

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
  })

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
                case 'col-regex':
                  return <TableCell key={header.id}>
                    <ButtonGroup className="w-full">
                      <Input value={localFilterRegex ?? ''} onChange={(e) => setLocalFilterRegex(e.target.value !== '' ? e.target.value : undefined)} />
                      <Button disabled={!localFilterRegex} onClick={() => setLocalFilterRegex(undefined)}><X /></Button>
                    </ButtonGroup>
                  </TableCell>
                case 'col-actions':
                  return <TableCell key={header.id}>
                    <Button className="w-full">
                      Create new
                    </Button>
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