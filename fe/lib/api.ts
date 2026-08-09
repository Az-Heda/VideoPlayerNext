import { Configs } from "@/lib/consts";

type HTTPMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
// export type Api<T> = {
//   results: T[];
//   result: T;
//   when: string
//   error?: string
// };

export type Api<T> =
  | {
    when: string;
    error: string;
    result?: never;
    results?: never;
  }
  | {
    when: string;
    error?: never;
    result: T;
    results: T[];
  }

type RequestOptions = {
  query?: { [key: string]: string };
  headers?: HeadersInit;
  body?: BodyInit;
  responseType?: 'text' | 'json';
}


export class ApiRequest {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? Configs.ApiEndpoint;
  }

  private async SendRequest<T>(method: HTTPMethod, path: string, options?: RequestOptions): Promise<T> {
    if (!path.startsWith('/')) path = '/' + path;

    const url = new URL(this.baseUrl);
    url.pathname = path;
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        url.searchParams.append(k, v);
      }
    }

    return new Promise<T>(async (resolve) => {
      const result = await fetch(url, {
        method: method,
        headers: options?.headers,
        body: options?.body,
      });
      const data = await result[options?.responseType ?? 'json']() as T;
      resolve(data);
    })
  }

  public async Get_ApiV1Pages(): Promise<ApiPage[]> {
    return new Promise<ApiPage[]>(async (resolve, reject) => {
      const data = await this.SendRequest<Api<ApiPage>>('GET', '/api/v1/pages');
      if (data.error != undefined) reject(data.error);
      else resolve(data.results);
    })
  }

  public async Get_ApiV1Pictures(): Promise<ApiPicture[]> {
    return new Promise<ApiPicture[]>(async (resolve, reject) => {
      const data = await this.SendRequest<Api<ApiPicture>>('GET', '/api/v1/pictures');
      if (data.error != undefined) reject(data.error);
      else resolve(data.results);
    })
  }

  public async Get_ApiV1PVideos(): Promise<ApiVideo[]> {
    return new Promise<ApiVideo[]>(async (resolve, reject) => {
      const data = await this.SendRequest<Api<ApiVideo>>('GET', '/api/v1/videos');
      if (data.error != undefined) reject(data.error);
      else resolve(data.results);
    })
  }

  public async Get_ApiV1ReloadData(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      const data = await this.SendRequest<string | Api<unknown>>('GET', '/api/v1/reload-data', {
        responseType: 'text'
      });
      if (typeof data == 'string') resolve(data == 'ok');
      else reject(data.error);
    })
  }

  public async Set_VideoSetIdWatched(v: ApiVideo): Promise<ApiVideo> {
    return new Promise<ApiVideo>(async (resolve, reject) => {
      const data = await this.SendRequest<Api<ApiVideo>>('GET', `/video/set/${v.id}/watched`, {
        query: { value: ['T', 'F'][+v.attributes.watched] },
        headers: { Accept: 'application/json' }
      });
      if (data.error != undefined) reject(data.error)
      else resolve(data.result);
    })
  }

  public async Set_VideoSetIdFavorite(v: ApiVideo): Promise<ApiVideo> {
    return new Promise<ApiVideo>(async (resolve, reject) => {
      const data = await this.SendRequest<Api<ApiVideo>>('GET', `/video/set/${v.id}/favorite`, {
        query: { value: ['T', 'F'][+(v.attributes.favorite ?? false)] },
        headers: { Accept: 'application/json' },
      });
      if (data.error != undefined) reject(data.error)
      else resolve(data.result);
    })
  }
}


export type ApiVideo = {
  id: string;
  title: string;
  filePath: string;
  duration: number;
  size: number;
  folder?: {
    id: string;
    path: string;
  }
  attributes: {
    exists: boolean;
    watched: boolean;
    favorite: boolean;
  },
  customUrl?: string;
}

export type ApiPicture = {
  id: string;
  filePath: string;
  title: string;
  size: number,
  folder?: {
    id: string;
    path: string;
  }
}

export type ApiPage = {
  id: string;
  title: string;
  url: string;
}