import { GlobalConfigType } from "@/lib/globals";
import { ColumnFiltersState, ColumnVisibilityState, createColumnHelper, SortingState, useTable } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTableFeatures, features } from "./data-table-features";
import { ApiTag } from "@/lib/api";
import { displayDate } from "@/lib/utils";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GeneralModal } from "./modals";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Typography } from "./utility";

type TagTableProps = {
  Config: GlobalConfigType;
}

export function TagTable(props: TagTableProps) {
  const [localTagName, setLocalTagName] = useState<string>();
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'col-name', desc: false },
  ]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    'col-id': false,
  });

  const filteredTags = useMemo(() => {
    if (props.Config.Api.Data.Tags.Getter === undefined) return [];
    return props.Config.Api.Data.Tags.Getter.filter(t => {
      var conds: boolean[] = [];

      if (localTagName) conds.push(t.name.toLowerCase().includes(localTagName.toLowerCase()));

      return conds.every(Boolean);
    })
  }, [
    localTagName,
    props.Config.Api.Data.Tags.Getter
  ]);

  const columnHelper = createColumnHelper<DataTableFeatures, ApiTag>();
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
    columnHelper.accessor('name', {
      ...commonProperties as any,
      id: 'col-name',
      header: 'Name',
    }),
    columnHelper.accessor('id', {
      ...commonProperties as any,
      id: 'col-num-videos',
      header: '# Videos',
      size: 1,
      cell({ row }) {
        return <span>{props.Config.Api.Data.Videos.Getter?.filter(v => v.tags?.map(t => t.id).includes(row.original.id)).length}</span>
      }
    }),
    columnHelper.accessor('createdAt', {
      ...commonProperties as any,
      id: 'col-created-at',
      header: 'Created at',
      size: 1,
      cell({ row }) {
        const value = row.original.createdAt != undefined ? new Date(row.original.createdAt) : undefined;
        return <span>{value && displayDate(value)}</span>
      }
    }),
    columnHelper.accessor('id', {
      ...commonProperties as any,
      id: 'col-actions',
      header: 'Actions',
      size: 1,
      cell({ row }) {
        return <ButtonGroup className="w-full">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon" className="mr-2 ml-auto">
                <Trash2 />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete automatic rule</DialogTitle>
                <DialogDescription>Are you sure you want to delete this rule?</DialogDescription>
              </DialogHeader>
              <ul>
                <li>The selected rule has the following instruction</li>
                <li className="text-muted-foreground">{row.original.name}</li>
              </ul>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => {
                    props.Config.Api.Instance.DeleteTag(row.original)
                      .then(
                        (deleted) => {
                          let currentTags = props.Config.Api.Data.Tags.Getter?.filter(t => t.id != deleted.id);
                          if (currentTags?.length === 0) currentTags = undefined;
                          props.Config.Api.Data.Tags.Setter(currentTags);
                        },
                        (error) => props.Config.Errors.Setter(errs => [...errs, error]),
                      )
                  }}>
                    Confirm
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ButtonGroup>
      }
    })
  ]);

  const tbl = useTable({
    features: features,
    data: filteredTags,
    columns: columns,

    enableSorting: true,
    autoResetPageIndex: true,

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
    <Typography kind="h2" className="text-center border-0 pt-8!">Tags</Typography>
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
                case 'col-name':
                  return <TableCell key={header.id}>
                    <ButtonGroup className="w-full">
                      <Input value={localTagName ?? ''} onChange={(e) => setLocalTagName(e.target.value !== '' ? e.target.value : undefined)} />
                      <Button disabled={!localTagName} onClick={() => setLocalTagName(undefined)}><X /></Button>
                    </ButtonGroup>
                  </TableCell>
                case 'col-actions':
                  return <TableCell key={header.id}>
                    <CreateNewTag Config={props.Config} />
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


type CreateNewTagProps = {
  Config: GlobalConfigType;
}
function CreateNewTag(props: CreateNewTagProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>();

  function cancel(andClose: boolean = false) {
    setInput(undefined);
    if (andClose) setOpen(false);
  }

  function confirm() {
    if (!input) return;
    props.Config.Api.Instance.PostTagNew(input, [])
      .then(
        (tag) => {
          props.Config.Api.Data.Tags.Setter(tags => tags !== undefined ? [...tags, tag] : [tag])
          cancel(true);
        },
        (error) => props.Config.Errors.Setter(errs => [...errs, error]),
      )
  }

  useEffect(() => {
    cancel();
  }, [open])

  return <>
    <GeneralModal
      Config={props.Config}
      open={open}
      setOpen={setOpen}
      title="Create a new tag"
      description="Here you can create a new tag"
      cancelBtn={<Button variant="outline" onClick={() => cancel()}>Close</Button>}
      confirmBtn={<Button onClick={() => confirm()} disabled={!input}>Confirm</Button>}
      kind={props.Config.Settings.ModalKind.Getter}
      side={props.Config.Settings.ModalSide.Getter}
    >
      <div className="w-full">
        <Input
          value={input ?? ''}
          onChange={(e) => setInput(e.target.value !== '' ? e.target.value : undefined)}
          placeholder="Type the tag name"
        />
      </div>
    </GeneralModal>
    <Button className="w-full" onClick={() => setOpen(true)}>
      Create new
    </Button>
  </>
}