// 'use client';

// import { Dispatch, Fragment, JSX, SetStateAction, useEffect, useMemo, useState } from "react";
// import { ArrowDownAz, ArrowUpAZ, ChevronLeft, ChevronRight } from "lucide-react";

// import { Descript } from "@/components/descript";
// import { cn } from "@/lib/utils";
// import { Config } from "@/lib/config";

// import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Kbd } from "@/components/ui/kbd";
// import { Button } from "@/components/ui/button";
// import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";


// export enum KeyKinds {
//   /** Callback only */
//   Cb,
//   /** Getter & Setter */
//   GetterSetter,
//   /** Callback, Getter and Setter */
//   CBGetterSetter
// };

// export type KeysInLocalStorage = {
//   Id: string;
//   Key?: string;
//   Ctrl?: boolean;
//   Alt?: boolean;
//   Meta?: boolean;
//   Shift?: boolean;
// };

// export type KeyEntity<T = boolean> = {
//   Id: string;
//   Label: string;
//   Description?: string;
//   Icon?: JSX.Element;
//   DefaultStorage: KeysInLocalStorage;
//   CustomStorage?: KeysInLocalStorage;
// } & (
//     {
//       Kind: KeyKinds.Cb;
//       Callback: () => void;
//       Getter?: never;
//       Setter?: never;
//     } |
//     {
//       Kind: KeyKinds.GetterSetter;
//       Getter: T;
//       Setter: Dispatch<SetStateAction<T>>;
//       Callback?: never;
//     } |
//     {
//       Kind: KeyKinds.CBGetterSetter,
//       Getter: T;
//       Setter: Dispatch<SetStateAction<T>>;
//       Callback: (g: T, s: Dispatch<SetStateAction<T>>) => void;
//     }
//   );

// type Props = {
//   EditIcon: JSX.Element;
//   ResetIcon: JSX.Element;
//   DeleteIcon: JSX.Element;
//   LocalStorageKey: string;
//   Getter: KeyEntity[];
//   Setter: Dispatch<SetStateAction<KeyEntity[]>>
// } & (
//     {
//       Pagination: false;
//       ItemsPerPage?: never;
//     } | {
//       Pagination: true;
//       ItemsPerPage: number;
//     }
//   )

// export function KeyBinds(props: Props) {
//   const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>();
//   const itemsPerPage = ((props.Pagination) ? props.ItemsPerPage : undefined) ?? 10;
//   const [currentPage, setCurrentPage] = useState(0);
//   const [openPopover, setOpenPopover] = useState<string | null | undefined>();

//   const ItemsSorted = useMemo(() => {
//     if (sortOrder === undefined) return props.Getter;
//     function sortItems(a: KeyEntity, b: KeyEntity): number {
//       const before = sortOrder == 'asc' ? -1 : 1;
//       const after = before * -1;
//       return (a.Label < b.Label) ? before : after;
//     }
//     return props.Getter.sort(sortItems);
//   }, [props.Getter, sortOrder]);

//   const ItemPaged = useMemo(() => {
//     const start = (itemsPerPage + 1) * currentPage;
//     const end = itemsPerPage * (currentPage + 1);
//     return ItemsSorted.slice(start, end)
//   }, [ItemsSorted, currentPage, sortOrder]);

//   const hasDescription: boolean = useMemo(() => {
//     return !ItemsSorted.every(e => e.Description === undefined);
//   }, [ItemsSorted, sortOrder]);

//   function SetCustomKeybind(kb: KeyEntity<any>, s: KeysInLocalStorage) {
//     if (kb.Id !== s.Id) return;
//     props.Setter(props.Getter.map(i => {
//       if (i.Id == kb.Id) {
//         i.CustomStorage = s;
//       }
//       return i;
//     }))
//     SaveToLocalStorage();
//   }

//   function ResetKeybind(kb: KeyEntity<any>) {
//     props.Setter(props.Getter.map(i => {
//       if (i.Id == kb.Id) {
//         i.CustomStorage = undefined;
//       }
//       return i;
//     }))
//     SaveToLocalStorage();
//   }

//   function DeleteKeybind(kb: KeyEntity<any>) {
//     props.Setter(props.Getter.map(i => {
//       if (i.Id == kb.Id) {
//         i.CustomStorage = { Id: i.Id }
//       }
//       return i;
//     }));
//     SaveToLocalStorage();
//   }

//   function SaveToLocalStorage() {
//     const customStorage = props.Getter.filter(i => i.CustomStorage != undefined).map(i => i.CustomStorage);
//     if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
//       localStorage.setItem(props.LocalStorageKey, JSON.stringify(customStorage));
//     }
//   }

//   return <Table className="select-none">
//     <TableHeader>
//       <TableRow>
//         <TableHead className="cursor-pointer" onClick={() => {
//           return;
//           if (sortOrder === undefined) return setSortOrder('asc');
//           if (sortOrder === 'asc') return setSortOrder('desc');
//           if (sortOrder === 'desc') return setSortOrder(undefined);
//         }}>
//           <div className="flex justify-between items-center ">
//             Label
//             {sortOrder === 'asc' && <ArrowDownAz size={20} />}
//             {sortOrder === 'desc' && <ArrowUpAZ size={20} />}
//           </div>
//         </TableHead>
//         {hasDescription && <TableHead>Description</TableHead>}
//         <TableHead className="text-center">Shortcut</TableHead>
//         <TableHead className="text-center">Actions</TableHead>
//       </TableRow>
//     </TableHeader>
//     <TableBody>
//       {ItemPaged.map(d => (
//         <TableRow key={d.Label}>
//           <TableCell>
//             <div className="flex justify-start gap-2 items-center">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 disabled={d.Kind == KeyKinds.GetterSetter || d.Callback === undefined}
//                 onClick={GetKeyCallback(d)}
//               >
//                 {d.Icon}
//               </Button> {d.Label}
//             </div>
//           </TableCell>
//           {hasDescription && <TableCell>{d.Description}</TableCell>}
//           <TableCell className="text-center">
//             <KeyKeyboard {...(d.CustomStorage ?? d.DefaultStorage)} />
//           </TableCell>
//           <TableCell>
//             <div className="flex justify-end items-center">
//               <Descript side="left" content={Config.StaticText.KeyboardShortcuts.Descript.Edit} asChild>
//                 <Button variant="outline" size="icon" className="cursor-pointer hover:text-primary" onClick={() => setOpenPopover(d.Id)}>{props.EditIcon}</Button>
//               </Descript>
//               <Popover open={openPopover == d.Id} onOpenChange={() => setOpenPopover(undefined)}>
//                 <PopoverTrigger></PopoverTrigger>
//                 <PopoverContent side="right" className="flex flex-col gap-4 justify-center items-center">
//                   <NewKeybind
//                     Id={d.Id}
//                     Change={(e) => SetCustomKeybind(d, e)}
//                     IsOpen={openPopover}
//                   />
//                   <div className="grid grid-cols-2 w-full">
//                     <Button variant="outline" onClick={() => setOpenPopover(undefined)}>Cancel</Button>
//                     <Button onClick={() => setOpenPopover(null)}>Confirm</Button>
//                   </div>
//                 </PopoverContent>
//               </Popover>
//               <Descript side="top" content={Config.StaticText.KeyboardShortcuts.Descript.Reset} asChild>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   className="cursor-pointer hover:text-primary"
//                   disabled={d.CustomStorage === undefined}
//                   onClick={() => ResetKeybind(d)}
//                 >
//                   {props.ResetIcon}
//                 </Button>
//               </Descript>
//               <Descript side="right" content={Config.StaticText.KeyboardShortcuts.Descript.Delete} asChild>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   className="scursor-pointer hover:text-primary"
//                   onClick={() => DeleteKeybind(d)}
//                   disabled={d.CustomStorage !== undefined && d.CustomStorage.Key === undefined}
//                 >
//                   {props.DeleteIcon}
//                 </Button>
//               </Descript>
//             </div>
//           </TableCell>
//         </TableRow>
//       ))}
//     </TableBody>
//     {
//       props.Getter.length > itemsPerPage && <TableFooter>
//         <TableRow>
//           <TableCell colSpan={3 + +hasDescription}>
//             <Pagination>
//               <PaginationContent className="gap-2">
//                 <PaginationItem>
//                   <Button variant="outline" size="icon" onClick={() => {
//                     setCurrentPage(Math.min(Math.max(currentPage - 1, 0), Math.floor(props.Getter.length / itemsPerPage)))
//                   }}>
//                     <ChevronLeft />
//                   </Button>
//                 </PaginationItem>
//                 <PaginationItem>
//                   <span>{currentPage + 1}/{Math.ceil(props.Getter.length / itemsPerPage)}</span>
//                 </PaginationItem>
//                 <PaginationItem>
//                   <Button variant="outline" size="icon" onClick={() => {
//                     setCurrentPage(Math.min(Math.max(currentPage + 1, 0), Math.floor(props.Getter.length / itemsPerPage)))
//                   }}>
//                     <ChevronRight />
//                   </Button>
//                 </PaginationItem>
//               </PaginationContent>
//             </Pagination>
//           </TableCell>
//         </TableRow>
//       </TableFooter>
//     }
//   </Table >
// }

// export function KeyKeyboard(props: KeysInLocalStorage) {

//   const parts = useMemo(() => {
//     return ([
//       [!!props.Ctrl, <Kbd key={`kbd-ctrl-${props.Key}`}>Ctrl</Kbd>],
//       [!!props.Shift, <Kbd key={`kbd-shift-${props.Key}`}>Shift</Kbd>],
//       [!!props.Alt, <Kbd key={`kbd-alt-${props.Key}`}>Alt</Kbd>],
//       [!!props.Meta, <Kbd key={`kbd-meta-${props.Key}`}>Meta</Kbd>],
//       [true, <Kbd key={`kbd-${props.Key}`}>{props.Key}</Kbd>],
//     ] as (readonly [boolean, JSX.Element])[])
//       .filter(i => i[0])
//       .map(i => i[1]);
//   }, [props.Key, props.Alt, props.Ctrl, props.Meta, props.Shift])

//   if (props.Key === undefined) {
//     return <div></div>
//   }
//   return (
//     <div className="flex justify-center gap-1">
//       {
//         parts.map((c, idx) => (
//           <Fragment key={`command-keyboard-${idx}`}>
//             {!!idx && <>+</>}
//             {c}
//           </Fragment>
//         ))
//       }
//     </div>
//   )
// }


// type NewKeybindProps = {
//   Change: (s: KeysInLocalStorage) => void;
//   Id: string;
//   IsOpen: string | null | undefined;
// }

// function NewKeybind(props: NewKeybindProps) {
//   const [content, setContent] = useState("");
//   const [currentConfigs, setCurrentConfigs] = useState<KeysInLocalStorage>();
//   const customKeybindId = 'new-custom-keybind';

//   useEffect(() => {
//     const input = document.querySelector<HTMLInputElement>(`input[name="${customKeybindId}"]`);
//     if (!input) return;
//     input.addEventListener('keydown', (e) => {
//       e.preventDefault();
//       const parts = ([
//         [e.ctrlKey, Config.KeyboardTextFor.KeyCtrl],
//         [e.shiftKey, Config.KeyboardTextFor.KeyShift],
//         [e.altKey, Config.KeyboardTextFor.KeyAlt],
//         [e.metaKey, Config.KeyboardTextFor.KeyMeta],
//       ] as readonly [boolean, string][])
//         .filter(i => i[0])
//         .filter(i => !['Control', 'Shift', 'Alt', 'Meta'].includes(i[1]))
//         .map(i => i[1].toUpperCase());

//       if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
//         setContent([...parts, e.key.toUpperCase()].join('+'));
//         setCurrentConfigs({
//           Id: props.Id,
//           Key: e.key.toUpperCase(),
//           Ctrl: e.ctrlKey,
//           Shift: e.shiftKey,
//           Alt: e.altKey,
//           Meta: e.metaKey,
//         });
//       } else setContent(parts.join('+'));
//     })
//   }, []);

//   useEffect(() => {
//     if (props.IsOpen || props.IsOpen === undefined) return;
//     if (currentConfigs == undefined) return;
//     if (props.IsOpen === null) props.Change(currentConfigs);
//   }, [currentConfigs, props.IsOpen])

//   return (
//     <Fragment>
//       <Label htmlFor={customKeybindId}>{Config.StaticText.KeyboardShortcuts.NewShortcutLabel}</Label>
//       <Input
//         name={customKeybindId}
//         className={cn("text-center", content.length == 0 ? 'caret-foreground' : 'caret-transparent')}
//         value={content}
//         onChange={(e) => setContent(e.target.value)}
//         autoFocus
//       />
//     </Fragment>
//   )
// }

// export function GetKeyCallback(k: KeyEntity) {
//   switch (k.Kind) {
//     case KeyKinds.Cb:
//       return k.Callback;
//     case KeyKinds.CBGetterSetter:
//       return () => k.Callback(k.Getter, k.Setter);
//     default:
//       return undefined;
//   }
// }


import { Command, GetCommands, GetCommands2, KeyEntity, KeyKinds, KeysInLocalStorage } from "@/lib/commands"
import { Fragment, JSX, useMemo, useState } from "react";
import { Kbd } from "@/components/ui/kbd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiVideo } from "@/lib/api";
import { ColumnDef, flexRender, getCoreRowModel, RowModel, useReactTable } from "@tanstack/react-table";


type KeybindDialogProps = {
  commands: ReturnType<typeof GetCommands2>;
  order?: 'asc' | 'desc';
}
export function KeybindDialog(props: KeybindDialogProps) {
  // const itemsSorted = useMemo(() => {
  //     const data: any[] = [];
  //     const before = (props.order ?? 'asc') == 'asc' ? -1 : 1;
  //     const after = before * -1;
  //     for (const k1 of Object.keys(props.commands).sort((a, b) => { return a < b ? before : after })) {
  //         const key1 = k1 as keyof typeof props.commands;
  //         for (const k2 of Object.keys(props.commands[key1].Commands)) {
  //             const key2 = k2 as keyof typeof props.commands[typeof key1]['Commands'];
  //             const cmd = props.commands[key1].Commands[key2] as Command<any>;
  //             data.push(`${k1}.${k2}`);
  //         }
  //     }
  //     return data;
  // }, [props.commands, props.order]);

  // function SetCusotmKeybind()


  const columns: ColumnDef<KeyEntity<string | undefined | boolean | number | ApiVideo>>[] = [
    {
      header: 'Label',
      accessorKey: 'Label',
    },
    {
      accessorKey: 'Id',
      header: ({ column }) => {
        return <div className="flex justify-end items-center">Keyboard Shortcuts</div>
      },
      cell: ({ row }) => {
        const { original } = row;
        return <div className="flex justify-end items-center">
          {
            (original.CustomStorage != undefined || original.DefaultStorage != undefined) &&
            <KeyKeyboard {...(original.CustomStorage ?? original.DefaultStorage)} />
          }
        </div>
      }
    }
  ];

  const commandData = useMemo(() => {
    const d: KeyEntity<string | undefined | boolean | number | ApiVideo>[] = [];
    for (const k of Object.keys(props.commands)) {
      const cmd = props.commands[k as keyof typeof props.commands];
      if (!cmd.Visible) continue;
      if (!cmd.HasKeybind) continue;
      d.push(cmd as unknown as typeof d[number]);
    }
    return d.sort((a, b) => a.Label < b.Label ? -1 : 1);
  }, [props.commands])

  const tbl = useReactTable({
    data: commandData,

    columns: columns,

    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {tbl.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {tbl.getRowModel().rows?.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}


export function KeyKeyboard(props: KeysInLocalStorage) {

  const parts = useMemo(() => {
    return ([
      [!!props.Ctrl, <Kbd key={`kbd-ctrl-${props.Key}`}>Ctrl</Kbd>],
      [!!props.Shift, <Kbd key={`kbd-shift-${props.Key}`}>Shift</Kbd>],
      [!!props.Alt, <Kbd key={`kbd-alt-${props.Key}`}>Alt</Kbd>],
      [!!props.Meta, <Kbd key={`kbd-meta-${props.Key}`}>Meta</Kbd>],
      [true, <Kbd key={`kbd-${props.Key}`}>{props.Key}</Kbd>],
    ] as (readonly [boolean, JSX.Element])[])
      .filter(i => i[0])
      .map(i => i[1]);
  }, [props.Key, props.Alt, props.Ctrl, props.Meta, props.Shift])

  if (props.Key === undefined) {
    return <div></div>
  }
  return (
    <div className="flex justify-center gap-1">
      {
        parts.map((c, idx) => (
          <Fragment key={`command-keyboard-${idx}`}>
            {!!idx && <>+</>}
            {c}
          </Fragment>
        ))
      }
    </div>
  )
}
