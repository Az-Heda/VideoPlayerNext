import { GlobalConfigType } from "./globals";

type HTTPMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';

type Thenable<T> = {
  then(
    resolve: (value: T) => void,
    reject: (reason: ApiError | Error) => void
  ): void;
};

type ApiErrorDetails = {
  location?: string;
  message: string;
  value?: any;
}

export type GenericError = { source: string; content: string };
export type ApiError = {
  errors: ApiErrorDetails[];
  detail: string;
  instance?: string;
  status?: number;
  title: string;
};

type RequestOptions = {
  query?: { [key: string]: string | string[] };
  headers?: HeadersInit;
  body?: BodyInit;
  responseType?: 'text' | 'json';
}


type GetVideoListFilter = {
  id?: ApiVideo['id'] | ApiVideo['id'][];
  path?: ApiVideo['fullpath'];
  watched?: boolean;
  'show-only-existing': boolean;
  preloadPlaylist?: boolean;
  preloadFolder?: boolean;
  preloadTags?: boolean;
}
type GetPlaylistListFilter = {
  id?: ApiPlaylist['id'] | ApiPlaylist['id'][];
  name?: ApiPlaylist['name'];
  preloadVideos?: boolean;
  preloadFolders?: boolean;
}
type GetFolderListFilter = {
  id?: ApiFolder['id'] | ApiFolder['id'][];
  path?: ApiFolder['fullpath'];
  preloadVideos?: boolean;
}
type GetTagListFilter = {
  id?: ApiTag['id'] | ApiTag['id'][];
  name?: ApiTag['name'];
  preloadVideos?: boolean;
}
type GetRuleListFilder = {
  id?: ApiRule['id'] | ApiRule['id'][];
  preloadPlaylist?: boolean;
  preloadTags?: boolean;
}
type GetSystemLogListFilder = {
  id?: ApiSystemLog['id'] | ApiSystemLog['id'][];
}
type PatchSetWatchedFlagFilter = {
  attr: boolean;
}

export class ApiRequest {
  private baseUrl?: string;
  private globalConfigs?: GlobalConfigType;
  private defaultContentType = { 'Content-Type': 'application/json' } as const;
  private groups = {
    docs: "/docs",
    stream: "/stream",
    folder: "/api/folder",
    video: "/api/video",
    playlist: "/api/playlist",
    tag: "/api/tag",
    rule: "/api/automatic-rule",
    systemLog: "/api/system-log"
  } as const;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
  }

  private ensureBaseUrl(): string {
    if (this.globalConfigs != undefined && (this.globalConfigs.Settings.DevelopmentMode.Getter && this.globalConfigs.Settings.ApiHostUrl.Getter != undefined)) return new URL(this.globalConfigs.Settings.ApiHostUrl.Getter).origin;
    let lsSettings = window.localStorage.getItem("vp-settings");
    if (lsSettings != null) {
      const obj: { [key: string]: any } = JSON.parse(lsSettings);
      if (obj.localApiOrigin) return obj.localApiOrigin as string;
    }
    if (this.baseUrl != undefined) return this.baseUrl;
    const port = window.location.port;
    if (port === '3000') this.baseUrl = 'http://localhost:5008';
    else this.baseUrl = window.location.origin;
    return this.baseUrl;
  }

  public addGlobalConfigs(configs: GlobalConfigType) {
    this.globalConfigs = configs;
    (window as any).ApiHandler = this;
  }

  //* =============================================[ Utility ]============================================= *//

  public GetStreamUrl(video: ApiVideo): string {
    const url = new URL(`${this.groups.stream}/${video.id}`, this.ensureBaseUrl());
    return url.toString();
  }

  public GetScalarUrl(): string {
    const url = new URL(this.groups.docs, this.ensureBaseUrl());
    return url.toString();
  }

  public GetScanFolderStreamUrl(folder: ApiFolder): string {
    const url = new URL(`${this.groups.folder}/${folder.id}/stream`, this.ensureBaseUrl());
    return url.toString();
  }

  private SendRequest<T>(method: HTTPMethod, path: string, options?: RequestOptions): Thenable<T> {
    if (!path.startsWith('/')) path = '/' + path;

    const url = new URL(this.ensureBaseUrl());
    url.pathname = path;
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        for (const vs of (typeof v == 'string') ? [v] : v) {
          url.searchParams.append(k, vs);
        }
      }
    }
    return {
      then: (resolve, reject) => {
        try {
          fetch(url, {
            method: method,
            headers: options?.headers,
            body: options?.body,
          })
            .then(async (result) => {
              if (result.status !== 200) {
                throw await result.json();
              }

              return await result[options?.responseType ?? 'json']() as T;
            })
            .then(resolve)
            .catch(err => {
              if (err instanceof Error) {
                reject(err);
                return;
              }

              reject(err as ApiError);
            });
        } catch (err) {
          reject(new Error(`${err}`, { cause: 'Fail' }));
        }
      }
    }
  }

  //* =============================================[ Folders ]============================================= *//

  public GetFolderList(filter?: GetFolderListFilter): Thenable<ApiFolder[]> {
    if (filter == undefined) filter = {} as GetFolderListFilter;
    const queryData: RequestOptions['query'] = {};
    if (filter.id) queryData.id = filter.id;
    if (filter.path) queryData.name = filter.path;
    if (filter.preloadVideos) queryData.preloadVideos = "true";

    return this.SendRequest<ApiFolder[]>('GET', `${this.groups.folder}/`, { query: queryData });
  }

  public PostFolderNew(folderPath: string): Thenable<ApiFolder> {
    return this.SendRequest<ApiFolder>('POST', `${this.groups.folder}/`, {
      headers: { ...this.defaultContentType },
      body: JSON.stringify({ path: folderPath }),
    });
  }

  //* =============================================[ Videos ]============================================= *//

  public GetVideoList(filter?: GetVideoListFilter): Thenable<ApiVideo[]> {
    if (filter == undefined) filter = {
      preloadPlaylist: true,
      preloadFolder: true,
      preloadTags: true,
    } as GetVideoListFilter;
    if (filter["show-only-existing"] == undefined) filter["show-only-existing"] = true;
    const queryData: RequestOptions['query'] = {};
    if (filter.preloadFolder) queryData.preloadFolder = "true";
    if (filter.preloadPlaylist) queryData.preloadPlaylist = "true";
    if (filter.preloadTags) queryData.preloadTags = "true";
    if (filter.id) queryData.id = filter.id;
    if (filter.path) queryData.path = filter.path;

    return this.SendRequest<ApiVideo[]>('GET', `${this.groups.video}/`, { query: queryData });
  }

  public PatchSetWatchedFlag(video: ApiVideo, filter?: PatchSetWatchedFlagFilter): Thenable<ApiVideo> {
    if (filter == undefined) filter = {} as PatchSetWatchedFlagFilter;
    const queryData: RequestOptions['query'] = { attr: filter.attr ? 'true' : 'false' };
    return this.SendRequest<ApiVideo>('PATCH', `${this.groups.video}/${video.id}/watched`, { query: queryData });
  }


  //* =============================================[ Playlists ]============================================= *//

  public GetPlaylistList(filter?: GetPlaylistListFilter): Thenable<ApiPlaylist[]> {
    if (filter == undefined) filter = {} as GetVideoListFilter;
    const queryData: RequestOptions['query'] = {};
    if (filter.id) queryData.id = filter.id;
    if (filter.name) queryData.name = filter.name;
    if (filter.preloadFolders) queryData.preloadFolders = "true";
    if (filter.preloadVideos) queryData.preloadVideos = "true";

    return this.SendRequest<ApiPlaylist[]>('GET', `${this.groups.playlist}/`, { query: queryData });;
  }

  public PostPlaylistNew(name: string, videos: ApiVideo[]): Thenable<ApiPlaylist> {
    return this.SendRequest<ApiPlaylist>('POST', `${this.groups.playlist}/`, {
      headers: { ...this.defaultContentType },
      body: JSON.stringify({ name: name, ids: videos.map(v => v.id) }),
    });
  }

  public PatchPlaylistAddVideo(playlist: ApiPlaylist, video: ApiVideo): Thenable<ApiVideo> {
    return this.SendRequest<ApiVideo>('PATCH', `${this.groups.playlist}/${playlist.id}/video/${video.id}`);
  }

  public DeletePlaylistAddVideo(playlist: ApiPlaylist, video: ApiVideo): Thenable<ApiVideo> {
    return this.SendRequest<ApiVideo>('DELETE', `${this.groups.playlist}/${playlist.id}/video/${video.id}`);
  }

  //* =============================================[ Tags ]============================================= *//

  public GetTagList(filter?: GetTagListFilter): Thenable<ApiTag[]> {
    if (filter == undefined) filter = {} as GetTagListFilter;

    const queryData: RequestOptions['query'] = {};
    if (filter.id) queryData.id = filter.id;
    if (filter.name) queryData.name = filter.name;
    if (filter.preloadVideos) queryData.preloadVideos = "true";

    return this.SendRequest<ApiTag[]>('GET', `${this.groups.tag}/`, { query: queryData });
  }

  public PostTagNew(name: string, videos: ApiVideo[]): Thenable<ApiTag> {
    return this.SendRequest<ApiTag>('POST', `${this.groups.tag}/`, {
      headers: { ...this.defaultContentType },
      body: JSON.stringify({
        name: name,
        ids: videos.map(v => v.id),
      })
    });
  }

  public PatchTagAddVideo(tag: ApiTag, video: ApiVideo): Thenable<ApiVideo> {
    return this.SendRequest<ApiVideo>('PATCH', `${this.groups.tag}/${tag.id}/video/${video.id}`);
  }

  public DeleteTagAddVideo(tag: ApiTag, video: ApiVideo): Thenable<ApiVideo> {
    return this.SendRequest<ApiVideo>('DELETE', `${this.groups.tag}/${tag.id}/video/${video.id}`);
  }

  //* =============================================[ Automatic Rules ]============================================= *//

  public GetRuleList(filter?: GetRuleListFilder): Thenable<ApiRule[]> {
    if (filter == undefined) filter = {} as GetRuleListFilder;

    const queryData: RequestOptions['query'] = {};
    if (filter.id) queryData.id = filter.id;
    if (filter.preloadPlaylist) queryData.preloadPlaylist = "true";
    if (filter.preloadTags) queryData.preloadTags = "true";

    return this.SendRequest<ApiRule[]>('GET', `${this.groups.rule}/`, { query: queryData });
  }

  public ApplyAutomaticRule(...rules: ApiRule[]): Thenable<ApiVideo[]> {
    return this.SendRequest<ApiVideo[]>('GET', `${this.groups.rule}/apply`)
  }

  public ValidateRuleRegex(regex: string): Thenable<RuleValidation> {
    return this.SendRequest<RuleValidation>('POST', `${this.groups.rule}/validate`, {
      headers: { ...this.defaultContentType },
      body: JSON.stringify({ regex }),
    })
  }

  public PostCreateRule(regex: string, playlists: ApiPlaylist[], tags: ApiTag[]): Thenable<ApiRule> {
    return this.SendRequest<ApiRule>('POST', `${this.groups.rule}/`, {
      headers: { ...this.defaultContentType },
      body: JSON.stringify({
        regex: regex,
        playlistIds: playlists.map(p => p.id),
        tagIds: tags.map(t => t.id),
      }),
    })
  }

  public DeleteRule(rule: ApiRule): Thenable<ApiRule> {
    return this.SendRequest('DELETE', `${this.groups.rule}/${rule.id}`, {
      headers: { ...this.defaultContentType },
    })
  }

  //* =============================================[ System Logs ]============================================= *//

  public GetSystemLogList(filter?: GetSystemLogListFilder): Thenable<ApiSystemLog[]> {
    if (filter === undefined) filter = {} as GetSystemLogListFilder;

    const queryData: RequestOptions['query'] = {};
    if (filter.id) queryData.id = typeof filter.id == 'number' ? filter.id.toString() : filter.id.map(x => x.toString());

    return this.SendRequest<ApiSystemLog[]>('GET', `${this.groups.systemLog}/`, { query: queryData });
  }
}

//* =============================================[ Api types ]============================================= *//

type baseApiType = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ApiRule = baseApiType & {
  regexRaw: string;
  playlists?: ApiPlaylist[];
  tags?: ApiTag[];
};

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
  lastFileChange?: string;
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

export type ApiSystemLog = {
  id: number;
  statusCode: number;
  statusCodeText: string;
  message: string;
  errors?: string[] | null;
  createdAt?: string;
}

//* =============================================[ Additional types ]============================================= *//

type RuleValidation = {
  isValid: true;
  error?: never;
} | {
  isValid: false;
  error: string;
}