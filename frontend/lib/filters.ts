import { ApiRule, ApiVideo, ApiPlaylist, ApiTag, ApiFolder, ApiSystemLog } from "@/lib/api";

type AllTypes =
  | ApiRule
  | ApiVideo
  | ApiPlaylist
  | ApiTag
  | ApiFolder
  | ApiSystemLog;


type KeysOfType<T, V> = {
  [K in keyof T]-?: T[K] extends V ? K : never
}[keyof T];

type FilterableKeys<T> = KeysOfType<T, string | number | boolean>;
type filterCondBoolean = { op: '==' | '<>' };
type filterCondString = { op: '==' | '<>' | 'contains' | 'doesntContains' | 'startsWith' | 'endsWith', treatCase?: 'lower' | 'upper' }
type filterCondNumber =
  | { op: '==' | '<>' | '<' | '>' | '<=' | '=>' }
  | { op: 'between', num1: number, num2: number }

export type Filter<T extends AllTypes> = {
  [K in FilterableKeys<T>]: {
    property: K;
    value: T[K];
  } & (
    | (T[K] extends number ? filterCondNumber : never)
    | (T[K] extends string ? filterCondString : never)
    | (T[K] extends boolean ? filterCondBoolean : never)
  )
}[FilterableKeys<T>];

export type FilterExpression<T extends AllTypes> =
  | Filter<T>
  | {
    operator: 'and' | 'or';
    filters: FilterExpression<T>[];
  };