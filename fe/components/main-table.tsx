'use client';

import {
  ColumnDef,
  Column,
  SortingState,
  ColumnFiltersState,

  flexRender,
  useReactTable,

  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  Header,
  Row,
} from '@tanstack/react-table';
import type { FilterFn, Table as ReactTable } from '@tanstack/react-table';

import React, { Dispatch, JSX, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CaseSensitive, ChevronLeft, ChevronRight, RefreshCcw, Regex, Star, X } from "lucide-react";

import { ApiVideo } from "@/lib/api";
import { cn, HumanReadableBytes } from "@/lib/utils";
import { Configs } from '@/lib/consts';
import { Config } from '@/lib/config';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel } from '@/components/ui/field';
import { ButtonGroup } from '@/components/ui/button-group';
import { ContextMenu, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuTrigger } from '@/components/ui/context-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';

type Props = {
  data: ApiVideo[];
  setData: Dispatch<SetStateAction<ApiVideo[] | undefined>>;
  videoSetter: Dispatch<SetStateAction<ApiVideo | undefined>>;
  videoData: ApiVideo | undefined;
}

function SortableHeader(props: { header: string, column: Column<ApiVideo, unknown> }) {
  return <Button
    variant="ghost"
    onClick={() => props.column.toggleSorting(props.column.getIsSorted() === 'asc')}
  >
    {props.header}
    {
      props.column.getIsSorted()
        ? props.column.getIsSorted() === 'desc'
          ? <ArrowUp />
          : <ArrowDown />
        : <></>
    }
  </Button>
}

export function VideoTable({ data, videoSetter, videoData, setData }: Props) {
  const [tableData, setTableData] = useState<typeof data>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [nPerPage,] = useState([10, 15, 20, 25, 30, 40, 50, 75, 100] as const);
  const [defaultPage,] = useState<typeof nPerPage['1']>(nPerPage[1]);
  const [watchedFilter, setWatchedFilter] = useState(' ');
  const [currentVideo, setCurrentVideo] = useState<ApiVideo>();
  const [filenameFilterMode, setFilenameFilterMode] = useState<'text' | 'regex'>('text');


  const customFilterRegex: FilterFn<any> = (row, columnId, filterValue: string): boolean => {
    if (!filterValue) return true;
    const value = String(row.getValue(columnId) ?? '');
    try {
      const regex = new RegExp(filterValue, 'i');
      return regex.test(value);
    } catch { return true; }
  }

  const [filterBooleans, _] = useState({
    ' ': 'All',
    'Y': 'Yes',
    'N': 'No',
  } as const)

  const VideoTableColumns: ColumnDef<ApiVideo>[] = [
    {
      id: 'col-favorite',
      accessorFn: (r) => r.attributes.favorite,
      header: 'Favorite',
      cell: ({ row }) => {
        const val = row.getValue('col-favorite') as boolean;
        return <div className="flex pl-2 gap-2 !w-24 !max-w-24">
          <Star
            className={cn('size-5', val ? 'stroke-amber-500 fill-amber-500' : '')}
            onClick={() => {
              Config.Api.Handler.Set_VideoSetIdFavorite(row.original)
                .then(newVideo => {
                  setData(data.map(d => {
                    if (d.id != row.original.id) return d;
                    return newVideo;
                  }))
                })
                .catch(console.error);
            }}
          />
        </div>
      },
      filterFn: (row, columnId, filterValue) => {
        switch (filterValue) {
          case " ":
            return true;
          case "Y":
            return Boolean(row.getValue(columnId)) === true
          case "N":
            return Boolean(row.getValue(columnId)) === false
        }
        return true;
      }
    },
    {
      id: 'col-watched',
      accessorFn: (r) => r.attributes.watched,
      header: 'Watched',
      cell: ({ row }) => {
        const val = row.getValue('col-watched') as boolean;
        return <div className="flex gap-2 !w-24 !max-w-24">
          <Checkbox
            defaultChecked={val}
            className="hover:cursor-pointer"
            onClick={() => {
              Config.Api.Handler.Set_VideoSetIdWatched(row.original)
                .then(newVideo => {
                  setData(data.map(d => {
                    if (d.id != row.original.id) return d;
                    return newVideo;
                  }))
                })
                .catch(console.error)
            }}
          />
          <span>{val ? 'Yes' : 'No'}</span>
        </div>
      },
      filterFn: (row, columnId, filterValue) => {
        switch (filterValue) {
          case " ":
            return true;
          case "Y":
            return Boolean(row.getValue(columnId)) === true
          case "N":
            return Boolean(row.getValue(columnId)) === false
        }
        return true;
      }
    },
    {
      id: 'col-filename',
      header: 'Filename',
      filterFn: (filenameFilterMode == 'text' ? 'includesString' : 'customFilterText') as any,
      accessorFn: (r) => r.filePath.replaceAll('\\', '/').split('/').at(-1),
      cell: ({ row }) => {
        const val = row.getValue('col-filename') as string;
        return <div className="hover:cursor-pointer truncate max-w-175" title={val} onClick={() => {
          setCurrentVideo(row.original)
        }}>{val}</div>
      }
    },
    {
      id: 'col-folder',
      accessorFn: (r) => r.filePath.replaceAll('\\', '/').split('/').slice(0, -1).join('/'),
      header: ({ column }) => { return <div>Folder</div> },
      cell: ({ row }) => {
        const val = row.getValue('col-folder') as string;
        return <div className="truncate max-w-96" title={val}>{val}</div>
      }
    },
    {
      id: 'col-duration',
      accessorFn: (r) => {
        if (r.duration) return new Date(r.duration / 1e6).toISOString().substring(11, 19);
        else return '??:??:??';
      },
      header: ({ column }) => {
        return <div className="truncate max-w-26 w-26">Duration</div>
      }
    },
    {
      id: 'col-size',
      header: 'Size',
      accessorFn: (r) => HumanReadableBytes(r.size),
    },
  ];

  const tbl = useReactTable({
    data: tableData,
    columns: VideoTableColumns,

    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,

    state: {
      sorting,
      columnFilters
    },
    filterFns: {
      customFilterText: customFilterRegex,
    }
  })

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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.currentTarget === null) return;
      if ((e.target as HTMLElement).tagName === 'VIDEO') return;

      const totalPages = tbl.getPageCount();
      const currentPage = tbl.getState().pagination.pageIndex;
      switch (e.key) {
        case 'ArrowLeft':
          if (currentPage - 1 >= 0) tbl.setPageIndex(currentPage - 1);
          e.preventDefault();
          break;
        case 'ArrowRight':
          if (currentPage + 1 < totalPages) tbl.setPageIndex(currentPage + 1)
          e.preventDefault();
          break;
        default:
      }
    };

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, []);

  function GetColumnSize(data: Header<ApiVideo, unknown> | Row<ApiVideo>): string {
    switch (data.id) {
      case 'col-watched':
        return "w-24";
      case 'col-filename':
        return 'w-full'
      case 'col-folder':
        return "w-96";
      case 'col-duration':
        return "w-26";
      case 'col-size':
        return "w-26";
      default:
        return "";
    }
  }

  useEffect(() => {
    if (currentVideo === undefined) return;
    const watched = currentVideo.attributes.watched;
    const currentPage = tbl.getState().pagination.pageIndex;
    videoSetter(currentVideo);

    if (!watched) {
      const interval = setInterval(() => {
        if (currentVideo?.attributes.watched) {
          tbl.setPageIndex(currentPage);
          clearInterval(interval);
          return;
        }
      }, 1)
    }
  }, [currentVideo]);

  useEffect(() => {
    const currentPage = tbl.getState().pagination.pageIndex;
    setTableData(data);
    if (currentPage != 0) {
      setTimeout(tbl.setPageIndex, 10, currentPage)
    }
  }, [data, tbl])

  return (
    <div className="select-none">
      <div className="flex items-center py-4 gap-10">
        <Label>
          Items per page
          <Select
            value={`${tbl.getState().columnFilters}`}
            onValueChange={(value) => {
              localStorage.setItem('items-per-page', value);
              tbl.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={tbl.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {nPerPage.map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Label>
      </div>
      <div className="overflow-hidden rounded-md border">

        <Table>
          <TableHeader>
            {tbl.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className={cn(GetColumnSize(header))}>
                    {
                      header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())
                    }
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>

            <TableRow>
              <TableCell>
                <Select
                  value={(columnFilters.find(f => f.id == 'col-favorite')?.value as string) ?? ' '}
                  onValueChange={(value) => {
                    setColumnFilters([...columnFilters.filter(f => f.id != 'col-favorite'), { id: 'col-favorite', value: value }])
                  }}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {
                      Object.entries(filterBooleans).map(([k, v]) => (
                        <SelectItem value={k} key={k}>{v}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Select
                  value={(columnFilters.find(f => f.id == 'col-watched')?.value as string) ?? ' '}
                  onValueChange={(value) => {
                    setWatchedFilter(value);
                    setColumnFilters([...columnFilters.filter(f => f.id != 'col-watched'), { id: 'col-watched', value: value }])
                  }}
                >
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder={tbl.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {
                      Object.entries(filterBooleans).map(([k, v]) => (
                        <SelectItem value={k} key={k}>{v}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <ButtonGroup className="w-full">
                  <Input
                    placeholder="Type to search"
                    value={(tbl.getColumn("col-filename")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      tbl.getColumn("col-filename")?.setFilterValue(event.target.value)
                    }
                  />
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    size="icon"
                    onClick={() => {
                      const options = ['text', 'regex'] as const;
                      setFilenameFilterMode(options[(options.indexOf(filenameFilterMode) + 1) % options.length])
                    }}
                  >
                    {filenameFilterMode == 'text' ? <CaseSensitive /> : <Regex />}
                  </Button>
                  <Button
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      tbl.getColumn("col-filename")?.setFilterValue("");
                    }}
                  >
                    <X />
                  </Button>
                </ButtonGroup>
              </TableCell>
              <TableCell className="min-w-72">
                <FilterFolder tbl={tbl} data={tableData} />
              </TableCell>
            </TableRow>

            {tbl.getRowModel().rows.length ? (
              tbl.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={cn(row.original.id == currentVideo?.id ? 'bg-muted' : '')}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      <TableContext video={cell.row.original} inherit={{ data, videoSetter, videoData, setData }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableContext>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={VideoTableColumns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )

            }
          </TableBody>
        </Table>

        <div className="flex items-center justify-center space-x-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => tbl.previousPage()}
            disabled={!tbl.getCanPreviousPage()}
            className="cursor-pointer"
          >
            <ChevronLeft />
          </Button>
          <span>{tbl.getState().pagination.pageIndex + 1}/{tbl.getPageCount()}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => tbl.nextPage()}
            disabled={!tbl.getCanNextPage()}
            className="cursor-pointer"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}



type SelectFolderMode = 'input' | 'select';
type PropsFilterFolder = {
  tbl: ReactTable<ApiVideo>;
  data: ApiVideo[];
}
function FilterFolder({ tbl, data }: PropsFilterFolder) {
  const modesOrder: SelectFolderMode[] = ['input', 'select'];
  const [mode, setMode] = useState<SelectFolderMode>(modesOrder[0]);
  const [selectValue, setSelectValue] = useState<string>();

  const switchButton = (
    <Button
      variant="outline"
      className="cursor-pointer"
      onClick={() => {
        const currentIndex = modesOrder.findIndex(x => x == mode);
        setMode(modesOrder[(currentIndex + 1) % modesOrder.length]);
      }}
    >
      <RefreshCcw />
    </Button>
  );

  const deleteButton = (
    <Button
      variant="outline"
      className="cursor-pointer disabled:bg-amber-500"
      onClick={() => {
        setSelectValue('');
      }}
    >
      <X />
    </Button>
  )

  useEffect(() => {
    if (selectValue === undefined) return;
    tbl.getColumn("col-folder")?.setFilterValue(selectValue);
  }, [selectValue]);

  switch (mode) {
    case 'input':
      return <Field>
        <ButtonGroup>
          <Input
            placeholder="Type to search"
            className="w-full max-w-80"
            value={(tbl.getColumn("col-folder")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              setSelectValue(event.target.value)
            }
          />
          {switchButton}
          {deleteButton}
        </ButtonGroup>
      </Field>
    case 'select':
      return <Field>
        <ButtonGroup>
          <Select
            value={selectValue}
            onValueChange={setSelectValue}
          >
            <SelectTrigger className="w-full max-w-80 truncate">{(tbl.getColumn("col-folder")?.getFilterValue() as string) ?? <>Select folder</>}</SelectTrigger>
            <SelectContent>
              {[
                ...new Set((tbl.getColumn("col-folder")
                  ?.getFilterValue() === undefined
                  ? tbl.getFilteredRowModel().rows.map(i => i.original)
                  : data
                )
                  .filter(i => i.folder)
                  .map(d => d.folder!.path))
              ]
                .map((p, i) => (
                  <SelectItem key={i} value={p.replace(/\/$/, '')}>{p.replace(/\/$/, '')}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          {switchButton}
          {deleteButton}
        </ButtonGroup>
      </Field>
    default:
      return <></>
  }
}

type TableContextProps = {
  children: JSX.Element | ReactNode
  video: ApiVideo
  inherit: Props
}

function TableContext(props: TableContextProps) {
  return <ContextMenu>
    <ContextMenuTrigger>
      {props.children}
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuGroup>
        <ContextMenuLabel>{props.video.id}</ContextMenuLabel>
      </ContextMenuGroup>
    </ContextMenuContent>
  </ContextMenu>
}