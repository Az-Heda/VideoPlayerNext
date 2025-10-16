'use client';

import { Dispatch, Fragment, SetStateAction, useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ApiVideo } from "@/lib/api";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

type Props = {
    data: ApiVideo[]
    videoSetter: Dispatch<SetStateAction<ApiVideo | undefined>>
    videoData: ApiVideo | undefined
}

export function VideoTable({ data, videoSetter, videoData }: Props) {
    const validPagedItems = [10, 15, 20, 50, 100, 200, 500] as const;
    const [itemPerPage, setItemPerPage] = useState<typeof validPagedItems[number]>(validPagedItems[1]);

    const [filterFieldWatched, setFilterFieldWatched] = useState<string>("");
    const [filterFieldTitle, setFilterTitle] = useState<string>("");
    const [filterFieldDuration, setFilterDuration] = useState<string>("");
    const [filterFieldSize, setFilterSize] = useState<string>("");
    const [filterFieldFolder, setFilterFolder] = useState<string>("");

    const filteredData = useMemo(() => {
        function ExecuteRegexOnField<T>(inputField: string, ...keys: Array<keyof T>) {
            return function (d: T) {
                if (inputField.length == 0) return true;
                try {
                    const match = keys.map(k => new RegExp('.*' + inputField + '.*', 'gi').test(d[k] as string))
                    return match.some(Boolean);
                } catch {
                    return true;
                }
            }
        }
        return data
            .filter(i => {
                // const cond = filterFieldWatched.toLowerCase() == 'y';
                switch (filterFieldWatched.toLowerCase()) {
                    case 'y':
                    case 's':
                    case 't':
                        return i.attributes.watched
                    case 'n':
                    case 'f':
                        return !i.attributes.watched
                    default:
                        return true;
                }
            })
            .filter(ExecuteRegexOnField<ApiVideo>(filterFieldTitle, 'title', 'id'))
            .filter(ExecuteRegexOnField<ApiVideo>(filterFieldFolder, 'filePath'));
    }, [data, filterFieldWatched, filterFieldTitle, filterFieldSize, filterFieldDuration, filterFieldFolder])

    const [pageIndex, setPageIndex] = useState<number>(0);
    const page = useMemo(() => filteredData.slice(itemPerPage * pageIndex, (itemPerPage * pageIndex) + itemPerPage), [itemPerPage, pageIndex, filteredData]);
    const lastPage = useMemo(() => Math.ceil(filteredData.length / itemPerPage) - 1, [filteredData, itemPerPage]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowLeft":
                    if (e.altKey) {
                        e.preventDefault()
                        setPageIndex(Math.max(pageIndex - 1, 0))
                    }
                    break;
                case "ArrowRight":
                    if (e.altKey) {
                        e.preventDefault()
                        setPageIndex(Math.min(pageIndex + 1, lastPage));
                    }
                    break;
                case "ArrowUp":
                    if (e.altKey) {
                        e.preventDefault()
                        const idx = validPagedItems.findIndex(i => i == itemPerPage);
                        if (idx + 1 < validPagedItems.length) {
                            setItemPerPage(validPagedItems[idx + 1]);
                        }
                    }
                    break;
                case "ArrowDown":
                    if (e.altKey) {
                        e.preventDefault()
                        const idx = validPagedItems.findIndex(i => i == itemPerPage);
                        if (idx - 1 >= 0) {
                            setItemPerPage(validPagedItems[idx - 1]);
                        }
                    }
                    break;
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [pageIndex, itemPerPage]);

    // useEffect(() => {
    //     commands.Pages.Commands.Last.Updates.Setter(lastPage)
    // }, [lastPage])

    function ShowVideo(data: ApiVideo) {
        videoSetter(data);
    }

    function fileSizePrettyPrint(bytes: number): string {
        const exponent = Math.floor(Math.log(bytes) / Math.log(1024.0))
        const decimal = (bytes / Math.pow(1024.0, exponent)).toFixed(exponent ? 2 : 0)
        return `${decimal} ${exponent ? `${'kMGTPEZY'[exponent - 1]}B` : 'B'}`
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[100px]">Watched</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Folder</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                    <TableHead className="text-right">Size</TableHead>
                </TableRow>
                <TableRow>
                    <TableHead className="w-[100px]">
                        <Input value={filterFieldWatched} onChange={(i) => { setFilterFieldWatched(i.target.value) }} placeholder="YTS/NF" />
                    </TableHead>
                    <TableHead>
                        <Input value={filterFieldTitle} onChange={(i) => { setFilterTitle(i.target.value) }} placeholder="Video title" />
                    </TableHead>
                    <TableHead>
                        <Input value={filterFieldFolder} onChange={(i) => { setFilterFolder(i.target.value) }} placeholder="Video path" />
                    </TableHead>
                    <TableHead>
                        <Input disabled value={filterFieldDuration} onChange={(i) => { setFilterDuration(i.target.value) }} placeholder="Video duration" />
                    </TableHead>
                    <TableHead className="text-right">
                        <Input disabled value={filterFieldSize} onChange={(i) => setFilterSize(i.target.value)} placeholder="Video size (MB)" />
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    page.map(i => (
                        <TableRow key={`row-${i.id}`} className={cn(i.id == videoData?.id ? 'bg-muted/30' : '')}>
                            <TableCell className="font-medium">{
                                i.attributes.watched
                                    ? <Check className="size-6 mx-auto text-emerald-600 dark:text-emerald-400" />
                                    : <X className="size-6 mx-auto text-rose-500" />
                            }</TableCell>
                            <TableCell className="hover:cursor-pointer" onClick={() => ShowVideo(i)}>{i.title}</TableCell>
                            <TableCell className="truncate text-muted-foreground">
                                {i.filePath.replaceAll('\\', '/').split('/').slice(0, -1).filter((i, idx) => i.length > 0 || idx == 0).join('/')}
                            </TableCell>
                            <TableCell className="text-right">{new Date(i.duration / 1000000).toISOString().substring(11, 19)}</TableCell>
                            <TableCell className="text-right">{fileSizePrettyPrint(i.size)}</TableCell>
                        </TableRow>
                    ))
                }
            </TableBody>
            <TableFooter className="bg-muted/0">
                <TableRow>
                    <TableCell className="text-center">
                        Items per page:
                        <Select defaultValue={itemPerPage.toString()} value={itemPerPage.toString()} onValueChange={(v) => { setItemPerPage(parseInt(v) as typeof itemPerPage) }}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pagination" />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    validPagedItems.map(i => (
                                        <SelectItem key={`item-per-page-${i}`} value={i.toString()}>{i}</SelectItem>
                                    ))
                                }
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell colSpan={4}>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious className="select-none hover:cursor-pointer" onClick={() => { setPageIndex(Math.max(pageIndex - 1, 0)); }} />
                                </PaginationItem>
                                < PaginationItem>
                                    {pageIndex + 1}/{lastPage + 1}
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext className="select-none hover:cursor-pointer" onClick={() => { setPageIndex(Math.min(pageIndex + 1, lastPage)); }} />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table >
    )
}