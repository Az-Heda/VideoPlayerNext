import { ApiVideo, ApiVideoAttributes } from "@/lib/api";
import { GlobalConfigType } from "@/lib/globals";
import { ComponentProps, Fragment, ReactNode, useEffect, useMemo, useState } from "react";
import { ColumnFiltersState, ColumnVisibilityState, createColumnHelper, SortingState, useTable } from "@tanstack/react-table";
import { features, DataTableFeatures } from "@/components/data-table-features";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CaseSensitive, Check, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Hash, ListMinus, NotebookText, OctagonAlert, Regex, TextCursor, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, HumanReadableBytes } from "@/lib/utils";
import { Description, RatingStars, Typography } from "./utility";
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


type MainVideoTableProps = {
  Config: GlobalConfigType;
}

function getFolder(fullpath: string): string {
  return fullpath.replace('\\', '/').split('/').slice(0, -1).join('/');
}

export function MainvideoTable(props: MainVideoTableProps) {
  const [nPerPage,] = useState([10, 15, 20, 25, 30, 40, 50, 75, 100] as const);
  const [defaultPage,] = useState<typeof nPerPage['1']>(nPerPage[1]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [localWatched, setLocalWatched] = useState<string>('undefined');

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibilityState>({
    'col-rating': false,
    'col-size': false,
    'col-last-file-change': false,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'col-folder', desc: false },
    { id: 'col-filename', desc: false },
  ]);

  const columnHelper = createColumnHelper<DataTableFeatures, ApiVideo>();



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
      cell({ row }) {
        var onClickFN = () => {
          props.Config.Api.Instance.PatchSetWatchedFlag(row.original, { attr: !row.original.attributes.watched })
            .then(
              (video) => {
                props.Config.Api.Data.Videos.Setter(allVideos => allVideos === undefined ? undefined : allVideos.map(v => {
                  if (v.id != video.id) return v;
                  return video;
                }))
              },
              (error) => props.Config.Errors.Setter(errs => [...errs, error])
            );
        }

        type AutomaticChoice<T> = { true: T; false: T, undefined: T };

        const icons: AutomaticChoice<ReactNode> = {
          'true': <Check />,
          'false': <X />,
          'undefined': <OctagonAlert />,
        };
        const labels: AutomaticChoice<string> = {
          'true': 'Yes',
          'false': 'No',
          'undefined': 'Unknown',
        }

        const colors: { full: AutomaticChoice<string>; border: AutomaticChoice<string>; none: AutomaticChoice<string>; } = {
          full: {
            'true': 'bg-emerald-500 text-emerald-950 hover:bg-emerald-600',
            'false': 'bg-rose-500 text-rose-950 hover:bg-rose-600',
            'undefined': 'bg-amber-500 text-amber-950 hover:bg-amber-600',
          },
          border: {
            'true': 'border border-emerald-500 text-emerald-500 hover:border-emerald-600 hover:text-emerald-600',
            'false': 'border border-rose-500 text-rose-500 hover:border-rose-600 hover:text-rose-600',
            'undefined': 'border border-amber-500 text-amber-500 hover:border-amber-600 hover:text-amber-600',
          },
          none: {
            'true': '',
            'false': '',
            'undefined': '',
          },
        }

        return <div
          className="flex items-center gap-1"
          onClick={onClickFN}
        >
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              (
                props.Config.Settings.ColoredWatchedStatus.Getter == 'full'
                  ? colors.full
                  : props.Config.Settings.ColoredWatchedStatus.Getter == 'border'
                    ? colors.border
                    : colors.none
              )
              [`${row.original.attributes.watched}`])}
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
          return <span>{row.original.filename.replaceAll(/.*\.(\d+)x(\d\d)\..*/g, '$1 x $2')}</span>
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
        const lastFolder = getFolder(row.getValue<string>(column.id));
        return <span
          onClick={() => {
            props.Config.Filters.Fullpath.Setter(lastFolder);
          }}>
          {lastFolder}
        </span>
      },
      sortFn: (rowA, rowB, columnId) => {
        const folderFirst = '_auto-delete';
        const a = getFolder(rowA.getValue<ApiVideo['fullpath']>(columnId));
        const b = getFolder(rowB.getValue<ApiVideo['fullpath']>(columnId));
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
    columnHelper.accessor("attributes.lastFileChange", {
      ...commonProperties as any,
      id: 'col-last-file-change',
      header: 'Last file change',
      size: 20,
      cell({ row }) {
        let value: ApiVideoAttributes['lastFileChange'] | Date = row.original.attributes.lastFileChange;
        if (typeof value == 'string') value = new Date(value);
        if (value instanceof Date) return <span>{value.toISOString().replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)Z/g, '$4:$5:$6 $3/$2/$1')}</span>
        else return <span></span>
      },
      sortFn: (rowA, rowB, columnId) => {
        let a: ApiVideoAttributes['lastFileChange'] | Date = rowA.getValue<ApiVideo['attributes']['lastFileChange']>(columnId);
        let b: ApiVideoAttributes['lastFileChange'] | Date = rowB.getValue<ApiVideo['attributes']['lastFileChange']>(columnId);
        if (typeof a == 'string') a = new Date(a);
        if (typeof b == 'string') b = new Date(b);

        if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
        if (a === undefined && b !== undefined) return -1;
        if (a !== undefined && b === undefined) return 1;
        return 0;
      },
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
              <Button
                variant="secondary"
                size="icon"
                onClick={() => {
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
              <Button
                variant="secondary"
                size="icon"
                onClick={() => props.Config.Utility.Modals.EditTags.Setter(row.original)}>
                <Hash />
              </Button>
            </Description>
          </ButtonGroup>
        </>
      }
    })
  ])


  useEffect(() => {
    switch (localWatched) {
      case 'true':
        props.Config.Filters.Table.Watched.Setter(true);
        break;
      case 'false':
        props.Config.Filters.Table.Watched.Setter(false);
        break;
      default:
        props.Config.Filters.Table.Watched.Setter(undefined);
        break;
    }
  }, [localWatched]);

  const tbl = useTable({
    features: features,
    data: props.Config.VideoPlayer.List,
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

  const videosSeparated: { [key: string]: string[] } = useMemo(() => {
    const obj: { [key: string]: string[] } = {};
    for (const folder of (props.Config.Api.Data.Folders.Getter ?? [])) {
      const folderVideos = (props.Config.Api.Data.Videos.Getter ?? []).filter(v => v.folderId == folder.id);
      const folders = folderVideos.map(v => v.fullpath).map(f => getFolder(f));
      obj[folder.id] = [...new Set(folders)].sort().map(x => x.trim()).filter(x => x.length > 0);
      if (!obj[folder.id].includes(folder.fullpath)) obj[folder.id] = [folder.fullpath, ...obj[folder.id]];
    }
    return obj;
  }, [
    props.Config.Api.Data.Folders.Getter,
    props.Config.Api.Data.Videos.Getter,
  ])

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
          {tbl.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                switch (header.id) {
                  case 'col-watched':
                    return <TableCell key={header.id}>
                      <Select value={localWatched} onValueChange={setLocalWatched}>
                        <SelectTrigger>
                          <SelectValue className="w-full" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="undefined">No filter</SelectItem>
                          <SelectItem value="true">Yes</SelectItem>
                          <SelectItem value="false">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  case 'col-filename':
                    return <TableCell key={header.id}>
                      <ButtonGroup className="w-full">
                        <Input
                          value={props.Config.Filters.Table.Filename.Getter ?? ''}
                          onChange={(e) => props.Config.Filters.Table.Filename.Setter(e.target.value)}
                          placeholder="Filter filename"
                        />
                        <Button
                          size="icon"
                          variant="default"
                          onClick={() => props.Config.Filters.Table.FilenameMode.Setter({ 'text': 'regex', 'regex': 'text' }[props.Config.Filters.Table.FilenameMode.Getter] as any)}
                        >
                          {
                            props.Config.Filters.Table.FilenameMode.Getter == 'text'
                              ? <CaseSensitive />
                              : <Regex />
                          }
                        </Button>
                        {props.Config.Filters.Table.Filename.Getter && <Button size="icon" onClick={() => props.Config.Filters.Table.Filename.Setter(undefined)}><X /></Button>}
                      </ButtonGroup>
                    </TableCell>
                  case 'col-folder':
                    return <TableCell key={header.id}>
                      <ButtonGroup className="w-full">
                        {
                          props.Config.Filters.Table.FolderMode.Getter == 'input'
                            ? <Input
                              value={props.Config.Filters.Table.Folder.Getter ?? ''}
                              onChange={(e) => props.Config.Filters.Table.Folder.Setter(e.target.value)}
                              placeholder="Filter folder"
                            />
                            : <Select
                              value={props.Config.Filters.Table.Folder.Getter ?? ''}
                              onValueChange={(val) => props.Config.Filters.Table.Folder.Setter(val)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a folder" className="w-full" />
                              </SelectTrigger>
                              <SelectContent>
                                {(props.Config.Api.Data.Folders.Getter)?.filter(f => videosSeparated[f.id].length > 0)?.map((folder, i) => <Fragment key={folder.id}>
                                  {!!i && <SelectSeparator />}
                                  <SelectGroup>
                                    <SelectLabel>{folder.fullpath}</SelectLabel>
                                    {videosSeparated[folder.id].map((v, i) => <SelectItem key={i} value={v}>
                                      {
                                        v.trim() == folder.fullpath.trim()
                                          ? v.trim()
                                          : v.substring(folder.fullpath.length + 1)
                                      }
                                    </SelectItem>)}
                                  </SelectGroup>
                                </Fragment>)}
                              </SelectContent>
                            </Select>
                        }

                        {
                          props.Config.Filters.Table.FolderMode.Getter == 'input'
                            ? <Button size="icon" onClick={() => props.Config.Filters.Table.FolderMode.Setter('select')}><NotebookText /></Button>
                            : <Button size="icon" onClick={() => props.Config.Filters.Table.FolderMode.Setter('input')}><TextCursor /></Button>
                        }
                        {props.Config.Filters.Table.Folder.Getter && <Button size="icon" onClick={() => props.Config.Filters.Table.Folder.Setter(undefined)}><X /></Button>}
                      </ButtonGroup>
                    </TableCell>
                  // return props.Config.Filters.Table.FolderMode.Getter == 'input'
                  //   ? <TableCell key={header.id}>
                  //     <ButtonGroup className="w-full">
                  //       <Input
                  //         value={props.Config.Filters.Table.Folder.Getter ?? ''}
                  //         onChange={(e) => props.Config.Filters.Table.Folder.Setter(e.target.value)}
                  //         placeholder="Filter folder"
                  //       />
                  //       <Button size="icon" onClick={() => props.Config.Filters.Table.FolderMode.Setter('select')}><NotebookText /></Button>
                  //       {props.Config.Filters.Table.Folder.Getter && <Button size="icon" onClick={() => props.Config.Filters.Table.Folder.Setter(undefined)}><X /></Button>}
                  //     </ButtonGroup>
                  //   </TableCell>
                  //   : <TableCell key={header.id}>
                  //     <ButtonGroup className="w-full">
                  //       <Select
                  //         value={props.Config.Filters.Table.Folder.Getter ?? ''}
                  //         onValueChange={(val) => props.Config.Filters.Table.Folder.Setter(val)}
                  //       >
                  //         <SelectTrigger>
                  //           <SelectValue placeholder="Select a folder" className="w-full" />
                  //         </SelectTrigger>
                  //         <SelectContent>
                  //           {(props.Config.Api.Data.Folders.Getter)?.filter(f => videosSeparated[f.id].length > 0)?.map((folder, i) => <Fragment key={folder.id}>
                  //             {!!i && <SelectSeparator />}
                  //             <SelectGroup>
                  //               <SelectLabel>{folder.fullpath}</SelectLabel>
                  //               {videosSeparated[folder.id].map(v => <SelectItem key={v} value={v}>{v.substring(v.length > (folder.fullpath.length + 1) ? folder.fullpath.length + 1 : folder.fullpath.length)}</SelectItem>)}
                  //             </SelectGroup>
                  //           </Fragment>)}
                  //         </SelectContent>
                  //       </Select>
                  //       <Button size="icon" onClick={() => props.Config.Filters.Table.FolderMode.Setter('input')}><TextCursor /></Button>
                  //       {props.Config.Filters.Table.Folder.Getter && <Button size="icon" onClick={() => props.Config.Filters.Table.Folder.Setter(undefined)}><X /></Button>}
                  //     </ButtonGroup>
                  //   </TableCell>
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
