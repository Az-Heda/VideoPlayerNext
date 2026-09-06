type HTTPMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';

type ApiErrorDetails = {
  location: string;
  message: string;
  value: any;
}
export type Api<T> =
  | T
  | {
    errors: ApiErrorDetails[];
    detail: string;
    instance?: string;
    title: string;
  };
type RequestOptions = {
  query?: { [key: string]: string | string[] };
  headers?: HeadersInit;
  body?: BodyInit;
  responseType?: 'text' | 'json';
}


type GetVideoListFilter = {
  id?: ApiVideo['id'];
  path?: ApiVideo['fullpath'];
  watched?: boolean;
  'show-only-existing': boolean;
  preloadPlaylist?: boolean;
  preloadFolder?: boolean;
  preloadTags?: boolean;
}
type GetPlaylistListFilter = {
  id?: ApiPlaylist['id'];
  name?: ApiPlaylist['name'];
  preloadVideos?: boolean;
  preloadFolders?: boolean;
}
type GetFolderListFilter = {
  id?: ApiFolder['id'];
  path?: ApiFolder['fullpath'];
  preloadVideos?: boolean;
}
type GetTagListFilter = {
  id?: ApiTag['id'];
  name?: ApiTag['name'];
  preloadVideos?: boolean;
}

export class ApiRequest {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  //* =============================================[ Utility ]============================================= *//

  public GetStreamUrl(video: ApiVideo): string {
    const url = new URL(this.baseUrl);
    url.pathname = `/stream/${video.id}`;
    return url.toString();
  }

  public GetScalarUrl(): string {
    const url = new URL(this.baseUrl);
    url.pathname = "/docs";
    return url.toString();
  }

  public GetScanFolderStreamUrl(folder: ApiFolder): string {
    const url = new URL(this.baseUrl);
    url.pathname = `/api/folder/${folder.id}/stream`;
    return url.toString();
  }

  private async SendRequest<T>(method: HTTPMethod, path: string, options?: RequestOptions): Promise<T> {
    if (!path.startsWith('/')) path = '/' + path;

    const url = new URL(this.baseUrl);
    url.pathname = path;
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        for (const vs of (typeof v == 'string') ? [v] : v) {
          url.searchParams.append(k, vs);
        }
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
    });
  }

  //* =============================================[ Folders ]============================================= *//

  public async GetFolderList(filter?: GetFolderListFilter): Promise<ApiFolder[]> {
    if (filter == undefined) filter = {} as GetFolderListFilter;
    return new Promise<ApiFolder[]>(async (resolve) => {
      const queryData: RequestOptions['query'] = {};
      if (filter.id) queryData.id = filter.id;
      if (filter.path) queryData.name = filter.path;
      if (filter.preloadVideos) queryData.preloadVideos = "true";

      const data = await this.SendRequest<ApiFolder[]>('GET', '/api/folder/', {
        query: queryData,
      });
      resolve(data);
    })
  }

  public async PostFolderNew(folderPath: string): Promise<ApiFolder> {
    return new Promise<ApiFolder>(async resolve => {
      const data = await this.SendRequest<ApiFolder>('POST', '/api/folder/', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: folderPath }),
      });
      resolve(data);
    })
  }

  //* =============================================[ Videos ]============================================= *//

  public async GetVideoList(filter?: GetVideoListFilter): Promise<ApiVideo[]> {
    if (filter == undefined) filter = {
      preloadPlaylist: true,
      preloadFolder: true,
      preloadTags: true,
    } as GetVideoListFilter;
    if (filter["show-only-existing"] == undefined) filter["show-only-existing"] = true;
    return new Promise<ApiVideo[]>(async (resolve) => {
      const queryData: RequestOptions['query'] = {};
      if (filter.preloadFolder) queryData.preloadFolder = "true";
      if (filter.preloadPlaylist) queryData.preloadPlaylist = "true";
      if (filter.preloadTags) queryData.preloadTags = "true";
      if (filter.id) queryData.id = filter.id;
      if (filter.path) queryData.path = filter.path;

      const data = await this.SendRequest<ApiVideo[]>('GET', '/api/video/', {
        query: queryData,
      })
      resolve(data);
    })
  }


  //* =============================================[ Playlists ]============================================= *//

  public async GetPlaylistList(filter?: GetPlaylistListFilter): Promise<ApiPlaylist[]> {
    if (filter == undefined) filter = {} as GetVideoListFilter;
    return new Promise<ApiPlaylist[]>(async (resolve) => {
      const queryData: RequestOptions['query'] = {};
      if (filter.id) queryData.id = filter.id;
      if (filter.name) queryData.name = filter.name;
      if (filter.preloadFolders) queryData.preloadFolders = "true";
      if (filter.preloadVideos) queryData.preloadVideos = "true";

      const data = await this.SendRequest<ApiPlaylist[]>('GET', '/api/playlist/', {
        query: queryData
      });
      resolve(data);
    })
  }

  public async PostPlaylistNew(name: string, videos: ApiVideo[]): Promise<ApiPlaylist> {
    return new Promise<ApiPlaylist>(async resolve => {
      const data = await this.SendRequest<ApiPlaylist>('POST', '/api/playlist/', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          ids: videos.map(v => v.id),
        })
      });
      resolve(data);
    });
  }

  public async PatchPlaylistAddVideo(playlist: ApiPlaylist, video: ApiVideo): Promise<ApiVideo> {
    return new Promise<ApiVideo>(async resolve => {
      const data = await this.SendRequest<ApiVideo>('PATCH', `/api/playlist/${playlist.id}/video/${video.id}`);
      resolve(data);
    });
  }

  public async DeletePlaylistAddVideo(playlist: ApiPlaylist, video: ApiVideo): Promise<ApiVideo> {
    return new Promise<ApiVideo>(async resolve => {
      const data = await this.SendRequest<ApiVideo>('DELETE', `/api/playlist/${playlist.id}/video/${video.id}`);
      resolve(data);
    });
  }

  //* =============================================[ Tags ]============================================= *//

  public async GetTagList(filter?: GetTagListFilter): Promise<ApiTag[]> {
    if (filter == undefined) filter = {} as GetTagListFilter;
    return new Promise<ApiTag[]>(async (resolve) => {
      const queryData: RequestOptions['query'] = {};
      if (filter.id) queryData.id = filter.id;
      if (filter.name) queryData.name = filter.name;
      if (filter.preloadVideos) queryData.preloadVideos = "true";

      const data = await this.SendRequest<ApiTag[]>('GET', '/api/tag/', {
        query: queryData
      });
      resolve(data);
    });
  }

  public async PostTagNew(name: string, videos: ApiVideo[]): Promise<ApiTag> {
    return new Promise<ApiTag>(async resolve => {
      const data = await this.SendRequest<ApiTag>('POST', '/api/tag/', {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          ids: videos.map(v => v.id),
        })
      });
      resolve(data);
    });
  }

  public async PatchTagAddVideo(tag: ApiTag, video: ApiVideo): Promise<ApiVideo> {
    return new Promise<ApiVideo>(async resolve => {
      const data = await this.SendRequest<ApiVideo>('PATCH', `/api/tag/${tag.id}/video/${video.id}`);
      resolve(data);
    });
  }

  public async DeleteTagAddVideo(tag: ApiTag, video: ApiVideo): Promise<ApiVideo> {
    return new Promise<ApiVideo>(async resolve => {
      const data = await this.SendRequest<ApiVideo>('DELETE', `/api/tag/${tag.id}/video/${video.id}`);
      resolve(data);
    });
  }


}


type baseApiType = {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export type ApiVideo = baseApiType & {
  fullpath: string;
  filename: string;
  folderId: string;
  attributes: ApiVideoAttributes;

  playlists?: ApiPlaylist[];
  tags?: ApiTag[];
  folder?: ApiFolder;
}

export type ApiVideoAttributes = {
  watched?: boolean;
  rating: number;
  exists?: boolean;
  size: number;
  duration: number;
}

export type ApiPlaylist = baseApiType & {
  name: string;
  videos?: ApiVideo[];
}

export type ApiTag = baseApiType & {
  name: string;
  videos?: ApiVideo[];
}

export type ApiFolder = baseApiType & {
  fullpath: string;
  videos?: ApiVideo[];
}