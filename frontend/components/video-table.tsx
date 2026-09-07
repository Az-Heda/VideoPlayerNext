import { ApiPlaylist, ApiVideo } from "@/lib/api";
import { GlobalConfigType } from "@/lib/globals"
import { ComponentProps, ReactNode, useEffect, useMemo, useState } from "react";
import { ColumnFiltersState, ColumnVisibilityState, createColumnHelper, SortingState, useTable, type ColumnDef, type RowData } from "@tanstack/react-table"
import { features, DataTableFeatures } from "@/components/data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Cpu, Film, Hash, ListMinus, OctagonAlert, Plus, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, HumanReadableBytes } from "@/lib/utils";
import { Description, RatingStars, Typography } from "./utility";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxItem, ComboboxList, ComboboxValue } from "@/components/ui/combobox";
import { ButtonGroup } from "@/components/ui/button-group";
import { GeneralModal } from "./modals";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


type MainVideoTableProps = {
  Config: GlobalConfigType;
}

export function MainvideoTable(props: MainVideoTableProps) {
  const [nPerPage,] = useState([10, 15, 20, 25, 30, 40, 50, 75, 100] as const);
  const [defaultPage,] = useState<typeof nPerPage['1']>(nPerPage[1]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    'col-rating': false,
    'col-size': false,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'col-folder', desc: false },
    { id: 'col-filename', desc: false },
  ]);

  const columnHelper = createColumnHelper<DataTableFeatures, ApiVideo>();

  const visibleVideos = useMemo(() => {
    return (props.Config.Api.Data.Videos.Getter ?? []).filter(x => {
      const conds: boolean[] = [];
      if (props.Config.Filters.Folder.Getter != undefined) conds.push(x.folder?.id == props.Config.Filters.Folder.Getter?.id);
      if (props.Config.Filters.Playlist.Getter != undefined) conds.push((x.playlists ?? []).map(p => p.id).includes(props.Config.Filters.Playlist.Getter?.id));
      if (props.Config.Filters.Fullpath.Getter != undefined) conds.push(x.fullpath.startsWith(props.Config.Filters.Fullpath.Getter));
      if (props.Config.Filters.Tag.Getter != undefined) conds.push((x.tags ?? []).map(t => t.id).includes(props.Config.Filters.Tag.Getter.id));
      return conds.length == 0 || conds.every(Boolean);
    });
  }, [
    props.Config.Filters.Folder.Getter,
    props.Config.Filters.Playlist.Getter,
    props.Config.Filters.Fullpath.Getter,
    props.Config.Filters.Tag.Getter,
    props.Config.Api.Data.Videos.Getter,
  ]);

  const commonProperties: Parameters<typeof columnHelper.accessor>[1] = {
    enableHiding: true,
    enableColumnFilter: true,
    enableSorting: true,
  }
  const columns = columnHelper.columns([
    columnHelper.accessor('attributes.rating', {
      ...commonProperties as any,
      id: 'col-rating',
      header: 'Rating',
      size: 0,
      minSize: 80,
      filterFn: (row): boolean => {
        // return row.original.
        return true;
      },
      cell({ row }) {
        let value = row.original.attributes.rating;
        if (value < 0) value = 0;
        if (value > 5) value = 5;
        return <div className="grid grid-cols-5 w-fit">
          {RatingStars(value)}
        </div>
      },
    }),
    columnHelper.accessor('attributes.watched', {
      ...commonProperties as any,
      id: 'col-watched',
      header: 'Watched',
      size: 0,
      maxSize: 4,
      filterFn: (row): boolean => {
        return true;
      },
      cell({ row }) {
        var onClickFN = () => {
          props.Config.Api.Instance.PatchSetWatchedFlag(row.original, { attr: !row.original.attributes.watched })
            .then(video => {
              props.Config.Api.Data.Videos.Setter(allVideos => allVideos === undefined ? undefined : allVideos.map(v => {
                if (v.id != video.id) return v;
                return video;
              }))
            });
        }

        const icons = {
          'true': <Check />,
          'false': <X />,
          'undefined': <OctagonAlert />,
        };
        const labels = {
          'true': 'Yes',
          'false': 'No',
          'undefined': 'Unknown',
        }
        const colors = {
          'true': 'bg-emerald-500 text-emerald-950 hover:bg-emerald-600',
          'false': 'bg-rose-500 text-rose-950 hover:bg-rose-600',
          'undefined': 'bg-amber-500 text-amber-950 hover:bg-amber-600',
        }

        return <div
          className="flex items-center gap-1"
          onClick={onClickFN}
        >
          <Button
            size="icon"
            className={cn(colors[`${row.original.attributes.watched}`])}
          >
            {icons[`${row.original.attributes.watched}`]}
          </Button>
          {labels[`${row.original.attributes.watched}`]}
        </div>
      }
    }),
    columnHelper.accessor('filename', {
      ...commonProperties as any,
      id: 'col-code',
      header: 'Code',
      size: 20,
      cell({ row }) {
        const codeRegex = /\.\d+x\d+\./;
        if (codeRegex.test(row.original.filename)) {
          const code = row.original.filename.replaceAll(/.*\.(\d+)x(\d\d)\..*/g, '$1 - $2');
          const parts = code.split(' - ');
          return <span>{parts[0]} x {parts[1]}</span>
        } else {
          return <div></div>
        }
      }
    }),
    columnHelper.accessor('filename', {
      ...commonProperties as any,
      id: 'col-filename',
      header: 'Filename',
      cell({ row }) {
        return <span
          className="block overflow-hidden truncate text-ellipsis max-w-150"
          onClick={() => {
            props.Config.VideoPlayer.Selected.Setter(row.original);
            if (!row.original.attributes.watched && !props.Config.Settings.PrivacyVideoMode.Getter) {
              props.Config.Api.Instance.PatchSetWatchedFlag(row.original, { attr: true })
                .then(vid => props.Config.Api.Data.Videos.Setter(allVideos => allVideos === undefined ? undefined : allVideos.map(v => {
                  if (v.id != vid.id) return v;
                  return vid;
                })))
            }
          }}
        >
          {row.original?.filename}
        </span>
      },
    }),
    columnHelper.accessor('attributes.duration', {
      ...commonProperties as any,
      id: 'col-duration',
      header: 'Duration',
      size: 10,
      cell({ row }) {
        return <span>{new Date((row?.original?.attributes?.duration ?? 1e6) / 1e6).toISOString().substring(11, 19)}</span>
      },
    }),
    columnHelper.accessor("fullpath", {
      ...commonProperties as any,
      id: 'col-folder',
      header: 'Folder',
      cell({ row, column }) {
        const lastFolder = row.getValue<string>(column.id).replace('\\', '/').split('/').slice(0, -1).join('/');
        return <span
          onClick={() => {
            props.Config.Filters.Fullpath.Setter(lastFolder);
          }}>
          {lastFolder}
        </span>
      },
      sortFn: (rowA, rowB, columnId) => {
        const folderFirst = '_auto-delete';
        const a = rowA.getValue<ApiVideo['fullpath']>(columnId).replace('\\', '/').split('/').slice(0, -1).join('/');
        const b = rowB.getValue<ApiVideo['fullpath']>(columnId).replace('\\', '/').split('/').slice(0, -1).join('/');
        const priorityA = a.includes(folderFirst);
        const priorityB = b.includes(folderFirst);

        if (priorityA && !priorityB) return -1;
        if (priorityB && !priorityA) return 1;
        return a.localeCompare(b);
      }
    }),
    columnHelper.accessor("attributes.size", {
      ...commonProperties as any,
      id: 'col-size',
      header: 'File size',
      size: 15,
      cell({ row }) {
        const bytes = row.original.attributes.size;
        return <span>{HumanReadableBytes(bytes)}</span>
      }
    }),
    columnHelper.accessor("id", {
      ...commonProperties as any,
      id: 'col-actions',
      header: 'Actions',
      size: 0,
      cell({ row }) {
        const kind: ComponentProps<typeof Typography>['kind'] = 'p';
        return <>
          <ButtonGroup>
            <Description
              text={<Typography kind={kind}>Edit playlist</Typography>}
              asChild
            >
              <Button size="icon" onClick={() => {
                console.log("before");
                props.Config.Utility.Modals.EditPlaylists.Setter(row.original);
                console.log("after");
              }}>
                <ListMinus />
              </Button>
            </Description>

            <Description
              text={<Typography kind={kind}>Edit Tags</Typography>}
              asChild
            >
              <Button size="icon" onClick={() => props.Config.Utility.Modals.EditTags.Setter(row.original)}>
                <Hash />
              </Button>
            </Description>
          </ButtonGroup>
        </>
      }
    })
  ])



  const tbl = useTable({
    features: features,
    data: visibleVideos,
    columns: columns,
    enableSorting: true,

    autoResetPageIndex: false,

    initialState: {
      sorting: [
        { id: 'col-folder', desc: false },
        { id: 'col-filename', desc: false },
      ]
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

  useEffect(() => {
    let validPage: number | null = null;
    if (window !== undefined) {
      const itemsPerPage = localStorage.getItem('items-per-page');
      if (itemsPerPage !== null && !isNaN(+itemsPerPage)) {
        validPage = +itemsPerPage;
      }
    }
    tbl.setPageSize(validPage ?? defaultPage)
  }, []);


  return (<>
    {
      props.Config.Filters.Folder.Getter != undefined && <Badge
        className="cursor-pointer"
        onClick={() => props.Config.Filters.Folder.Setter(undefined)}
      >
        Folder: {props.Config.Filters.Folder.Getter.fullpath}
      </Badge>
    }
    {
      props.Config.Filters.Playlist.Getter != undefined && <Badge
        className="cursor-pointer"
        onClick={() => props.Config.Filters.Playlist.Setter(undefined)}
      >
        Playlist: {props.Config.Filters.Playlist.Getter.name}
      </Badge>
    }
    {
      props.Config.Filters.Fullpath.Getter != undefined && <Badge
        className="cursor-pointer"
        onClick={() => props.Config.Filters.Fullpath.Setter(undefined)}
      >
        Fullpath: {props.Config.Filters.Fullpath.Getter}
      </Badge>
    }
    {
      props.Config.Filters.Tag.Getter != undefined && <Badge
        className="cursor-pointer"
        onClick={() => props.Config.Filters.Tag.Setter(undefined)}
      >
        Tag: {props.Config.Filters.Tag.Getter.name}
      </Badge>
    }

    <div className="overflow-hidden rounded-md border">
      <div className="flex items-center py-4 gap-10">
        <Label>
          Items per page
          <Select
            defaultValue={localStorage.getItem('items-per-page') ?? defaultPage.toString()}
            onValueChange={(value) => {
              localStorage.setItem('items-per-page', value);
              tbl.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-17.5">
              <SelectValue placeholder={tbl.state.pagination.pageSize} />
            </SelectTrigger>
          </Select>
        </Label>

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
                    <TableContext key={row.id} video={cell.row.original} inherit={props}>
                      <tbl.FlexRender cell={cell} />
                    </TableContext>
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
  </>
  )
}


type TableContextProps = {
  children: ReactNode
  video: ApiVideo
  inherit: MainVideoTableProps
}
function TableContext(props: TableContextProps) {
  return <ContextMenu>
    <ContextMenuTrigger>
      {props.children}
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuLabel>Id: {props.video.id}</ContextMenuLabel>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            Tags
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onClick={() => {
                props.inherit.Config.Utility.Modals.EditTags.Setter(props.video)
              }}
            >Add to another tag</ContextMenuItem>
            {
              props.video.tags && <>
                <ContextMenuSeparator />
                {(props.video.tags)?.map(t => (
                  <ContextMenuItem
                    key={t.id}
                    onClick={() => props.inherit.Config.Filters.Tag.Setter(t)}
                  >
                    {t.name}
                  </ContextMenuItem>
                ))}</>
            }

          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            Playlists
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem
              onClick={() => {
                props.inherit.Config.Utility.Modals.EditPlaylists.Setter(props.video)
              }}
            >
              Add to another playlist
            </ContextMenuItem>
            {
              props.video.playlists && <>
                <ContextMenuSeparator />
                {props.video.playlists?.map(p => (
                  <ContextMenuItem
                    key={p.id}
                    onClick={() => props.inherit.Config.Filters.Playlist.Setter(p)}
                  >
                    {p.name}
                  </ContextMenuItem>
                ))}
              </>
            }
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuGroup>
    </ContextMenuContent>
  </ContextMenu >
}