import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { KeybindLS } from "@/lib/globals";
import { ApiError, ApiVideo, GenericError } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function SortArrayObject<T extends object>(list: T[], property: (item: T) => any, order: 'asc' | 'desc' = 'asc'): T[] {
  return list.toSorted((a, b): number => {
    var valA = property(a);
    var valB = property(b);
    if (valA < valB) return { asc: -1, desc: 1 }[order];
    if (valA > valB) return { asc: 1, desc: -1 }[order];
    return 0;
  })
}

export function HumanReadableBytes(bytes: number): string {
  const exponent = Math.floor(Math.log(bytes) / Math.log(1024.0))
  const decimal = (bytes / Math.pow(1024.0, exponent)).toFixed(exponent ? 2 : 0)
  return `${decimal} ${exponent ? `${'kMGTPEZY'[exponent - 1]}B` : 'B'}`
}

export function getKeybind(id: KeybindLS['Id'], key?: KeybindLS['Key'], ctrl?: KeybindLS['Ctrl'], alt?: KeybindLS['Alt'], meta?: KeybindLS['Meta'], shift?: KeybindLS['Shift']): KeybindLS {
  return { Id: id, Key: key, Ctrl: ctrl, Alt: alt, Meta: meta, Shift: shift }
}



export function isGeneric(x: GenericError | ApiError | Error): x is GenericError {
  return 'source' in x && 'content' in x
}
export function isApiError(x: GenericError | ApiError | Error): x is ApiError {
  return 'errors' in x && 'detail' in x && 'title' in x;
}
export function isError(x: GenericError | ApiError | Error): x is Error {
  return x instanceof Error;
}
export function isApiVideo(x: ApiVideo | string): x is ApiVideo {
  if (typeof x === 'string') return false;
  return 'fullpath' in x ||
    'filename' in x ||
    'folderId' in x ||
    'attributes' in x
}

export function displayDate(date: Date): string {
  return new Date(date.getTime() - (new Date().getTimezoneOffset() * 60 * 1000))
    .toISOString()
    .replace(/(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)Z/g, '$4:$5:$6 $3/$2/$1')
}