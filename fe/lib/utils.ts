import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function HumanReadableBytes(bytes: number): string {
  const exponent = Math.floor(Math.log(bytes) / Math.log(1024.0))
  const decimal = (bytes / Math.pow(1024.0, exponent)).toFixed(exponent ? 2 : 0)
  return `${decimal} ${exponent ? `${'kMGTPEZY'[exponent - 1]}B` : 'B'}`
}