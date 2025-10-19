'use client';

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";

import { ApiVideo } from "@/lib/api";
import { cn, HumanReadableBytes } from "@/lib/utils";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

type Props = {
    data: ApiVideo[]
    videoSetter: Dispatch<SetStateAction<ApiVideo | undefined>>
    videoData: ApiVideo | undefined
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

export function VideoTable({ data, videoSetter, videoData }: Props) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [nPerPage,] = useState([10, 15, 20, 25, 30, 40, 50, 75, 100] as const);
    const [defaultPage,] = useState<typeof nPerPage['1']>(nPerPage[1]);
    const [watchedFilter, setWatchedFilter] = useState(' ');
    const [currentVideo, setCurrentVideo] = useState<ApiVideo>();

    const [filterBooleans, setFilterBooleans] = useState({
        ' ': 'All',
        'Y': 'Yes',
        'N': 'No',
    } as const)

    function ShowVideo(data: ApiVideo) {
        videoSetter(data);
    }

    useEffect(() => {
        if (currentVideo === undefined) return;
        videoSetter(currentVideo);
    }, [currentVideo]);

    const VideoTableColumns: ColumnDef<ApiVideo>[] = [
        {
            id: 'col-watched',
            accessorFn: (r) => r.attributes.watched,
            header: 'Watched',
            cell: ({ row }) => {
                const val = row.getValue('col-watched') as boolean;
                return <div className="flex gap-2 !w-24 !max-w-24">
                    <Checkbox
                        defaultChecked={val}
                        className="disabled:opacity-100"
                        disabled
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
            accessorFn: (r) => r.filePath.replaceAll('\\', '/').split('/').at(-1),
            // header: ({ column }) => <SortableHeader header="Filename" column={column} />,
            cell: ({ row }) => {
                const val = row.getValue('col-filename') as string;
                return <div className="hover:cursor-pointer" onClick={() => {
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
                return <div className="truncate w-96" title={val}>{val}</div>
            }
        },
        {
            id: 'col-duration',
            accessorFn: (r) => new Date(r.duration / 1000000).toISOString().substring(11, 19),
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
        data: data,
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
                                    value={(columnFilters.find(f => f.id == 'col-watched')?.value as string) ?? ''}
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
                                <Input
                                    placeholder="Type to search"
                                    value={(tbl.getColumn("col-filename")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        tbl.getColumn("col-filename")?.setFilterValue(event.target.value)
                                    }
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    placeholder="Type to search"
                                    value={(tbl.getColumn("col-folder")?.getFilterValue() as string) ?? ""}
                                    onChange={(event) =>
                                        tbl.getColumn("col-folder")?.setFilterValue(event.target.value)
                                    }
                                />
                            </TableCell>
                        </TableRow>
                        {tbl.getRowModel().rows.length ? (
                            tbl.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className={cn(row.original.id == currentVideo?.id ? 'bg-muted' : '')}>
                                    {row.getVisibleCells().map(cell => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
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