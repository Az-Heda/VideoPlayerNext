import { GlobalConfigType } from "@/lib/globals";
import { ColumnFiltersState, ColumnVisibilityState, createColumnHelper, SortingState, useTable } from "@tanstack/react-table";
import { Fragment, useEffect, useMemo, useState } from "react";
import { DataTableFeatures, features } from "./data-table-features";
import { ApiPlaylist, ApiRule, ApiTag } from "@/lib/api";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, SearchAlert, Trash2, X } from "lucide-react";
import { cn, displayNumber } from "@/lib/utils";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GeneralModal } from "@/components/modals";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";


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

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary" size="icon">
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
                <li className="text-muted-foreground">{row.original.regexRaw}</li>
              </ul>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={() => {
                    props.Config.Api.Instance.DeleteRule(row.original)
                      .then(
                        (deleted) => {
                          let currentRules = props.Config.Api.Data.Rules.Getter?.filter(r => r.id != deleted.id);
                          if (currentRules?.length === 0) currentRules = undefined;
                          props.Config.Api.Data.Rules.Setter(currentRules);
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
                    <CreateNewRule Config={props.Config} />
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


type CreateNewRuleProps = {
  Config: GlobalConfigType;
}
function CreateNewRule(props: CreateNewRuleProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>();
  const [inputError, setInputError] = useState<string>();
  const [selectedPlaylistsIds, setSelectedPlaylistsIds] = useState<string[]>([]);
  const [selectedTagsIds, setSelectedTagsIds] = useState<string[]>([]);
  const anchorPlaylists = useComboboxAnchor()
  const anchorTags = useComboboxAnchor()

  useEffect(() => {
    if (!input) {
      setInputError(undefined);
      return;
    }

    const timeout = setTimeout(() => {
      props.Config.Api.Instance.ValidateRuleRegex(input)
        .then(
          (v) => { if (!v.isValid) { setInputError(v.error); } else { setInputError(undefined); } },
          (error) => props.Config.Errors.Setter(errs => [...errs, error]),
        );
    }, 500);

    return () => clearTimeout(timeout);
  }, [input]);

  function confirm() {
    if (!input || !!inputError) return;
    const playlists = (props.Config.Api.Data.Playlists.Getter ?? []).filter(p => selectedPlaylistsIds.includes(p.id));
    const tags = (props.Config.Api.Data.Tags.Getter ?? []).filter(t => selectedTagsIds.includes(t.id));
    props.Config.Api.Instance.PostCreateRule(input, playlists, tags)
      .then(
        (data) => {
          props.Config.Api.Data.Rules.Setter(current => current === undefined ? [data] : [...current, data]);
          setOpen(false);
        },
        (error) => props.Config.Errors.Setter(errs => [...errs, error]),
      )
  }
  const frameworks = [
    "Next.js",
    "SvelteKit",
    "Nuxt.js",
    "Remix",
    "Astro",
  ] as const
  return <>
    <GeneralModal
      Config={props.Config}
      open={open}
      setOpen={setOpen}
      title="Create a new rule"
      description="Here you can create a new automatic rule"
      cancelBtn={<Button variant="outline">Close</Button>}
      confirmBtn={<Button onClick={() => confirm()} disabled={!input || !!inputError}>Confirm</Button>}
      kind={props.Config.Settings.ModalKind.Getter}
      side={props.Config.Settings.ModalSide.Getter}
    >
      <div className="w-full">
        <Field data-invalid={!!inputError}>
          <FieldLabel>{inputError}</FieldLabel>
          <Input
            value={input ?? ''}
            onChange={(e) => setInput(e.target.value !== '' ? e.target.value : undefined)}
            placeholder="Type the regex instruction"
          />
          <FieldDescription>The regex instruction must follow the rules for Go/Re2</FieldDescription>
        </Field>
      </div>

      <div className="grid grid-cols-4 gap-y-2 items-center">
        <span>Playlists</span>
        <div className="col-span-3">
          <Combobox
            items={props.Config.Api.Data.Playlists.Getter ?? []}
            multiple
            value={selectedPlaylistsIds}
            onValueChange={setSelectedPlaylistsIds}
          >
            <div ref={anchorPlaylists} className="w-full">
              <ComboboxChips>
                <ComboboxValue>
                  {selectedPlaylistsIds.map((item) => (
                    <ComboboxChip key={item}>{props.Config.Api.Data.Playlists.Getter?.find(p => p.id === item)?.name ?? '<unknown>'}</ComboboxChip>
                  ))}
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Add playlists" />
              </ComboboxChips>
            </div>
            <ComboboxContent anchor={anchorPlaylists} className="pointer-events-auto">
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: ApiPlaylist) => (
                  <ComboboxItem key={item.id} value={item.id}>
                    {item.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <span>Tags</span>
        <div className="col-span-3">
          <Combobox
            items={props.Config.Api.Data.Tags.Getter ?? []}
            multiple
            value={selectedTagsIds}
            onValueChange={setSelectedTagsIds}
          >
            <div ref={anchorTags} className="w-full">
              <ComboboxChips>
                <ComboboxValue>
                  {selectedTagsIds.map((item) => (
                    <ComboboxChip key={item}>{props.Config.Api.Data.Tags.Getter?.find(t => t.id === item)?.name ?? '<unknown>'}</ComboboxChip>
                  ))}
                </ComboboxValue>
                <ComboboxChipsInput placeholder="Add tags" />
              </ComboboxChips>
            </div>
            <ComboboxContent anchor={anchorTags} className="pointer-events-auto">
              <ComboboxEmpty>No items found.</ComboboxEmpty>
              <ComboboxList>
                {(item: ApiTag) => (
                  <ComboboxItem key={item.id} value={item.id}>
                    {item.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>

    </GeneralModal>
    <Button className="w-full" onClick={() => setOpen(true)}>
      Create new
    </Button>
  </>
}