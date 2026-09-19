"use client";

import { AudioLines, CloudBackup, FileVideo, Film, Globe, House, Keyboard, Palette, RefreshCw, Settings, ShieldAlert, SquareFunction, TvMinimalPlay, Waypoints, X } from "lucide-react";
import { ComponentProps, Dispatch, JSX, ReactNode, SetStateAction, useEffect, useMemo, useState } from "react";
import { ApiError, ApiFolder, ApiPlaylist, ApiRequest, ApiRule, ApiTag, ApiVideo } from "@/lib/api";
import { SheetContent } from "@/components/ui/sheet";
import { Drawer } from "@/components/ui/drawer";
import { getKeybind } from "@/lib/utils";


type GetterSetter<T> = {
  Getter: T;
  Setter: Dispatch<SetStateAction<T>>;
}
export type SidebarItem<T> = {
  Icon: JSX.Element
  Title: ReactNode;
  Action?: () => void;
  Visibility?: boolean;
} & GetterSetter<T>;


type Page = 'homepage' | 'videos';
type PageSidebar = {
  Id: Page,
  Label: string;
  Icon: JSX.Element;
}

export type KeybindLS = {
  Id: string;
  Key?: string;
  Ctrl?: boolean;
  Alt?: boolean;
  Meta?: boolean;
  Shift?: boolean;
};

export type Command = {
  Default: KeybindLS;
  Custom?: KeybindLS;
  Action: () => void
}

export type GlobalConfigType = {
  Api: {
    Instance: ApiRequest;
    Data: {
      Videos: GetterSetter<ApiVideo[] | undefined>;
      Playlists: GetterSetter<ApiPlaylist[] | undefined>;
      Folders: GetterSetter<ApiFolder[] | undefined>;
      Tags: GetterSetter<ApiTag[] | undefined>;
      Rules: GetterSetter<ApiRule[] | undefined>;
    };
  };
  Filters: {
    Playlist: GetterSetter<ApiPlaylist | undefined>;
    Folder: GetterSetter<ApiFolder | undefined>;
    Fullpath: GetterSetter<string | undefined>;
    Tag: GetterSetter<ApiTag | undefined>;

    Table: {
      Watched: GetterSetter<boolean | undefined>;
      Filename: GetterSetter<string | undefined>;
      Folder: GetterSetter<string | undefined>;
      FilenameMode: GetterSetter<'text' | 'regex'>;
      FolderMode: GetterSetter<'input' | 'select'>;
    }
  }
  Sidebar: {
    Title: SidebarItem<string>;
    Top: {
      RemoveVideo: SidebarItem<boolean>;
      FromFileModal: SidebarItem<boolean>;
      FromUrlModal: SidebarItem<boolean>;
      AutomaticRuleModel: SidebarItem<boolean>;
      AudioContextModal: SidebarItem<boolean>;
      ScanFolderVideosModal: SidebarItem<boolean>;
    };
    Bottom: {
      ThemeModal: SidebarItem<boolean>;
      KeybindsModal: SidebarItem<boolean>;
      SettingsModal: SidebarItem<boolean>;
      OpenScalar: SidebarItem<undefined>;
      SyncDataModal: SidebarItem<boolean>;
      OpenErrorModal: SidebarItem<boolean>;
    };
  };
  VideoPlayer: {
    Selected: GetterSetter<ApiVideo | undefined>;
    List: ApiVideo[];
    AudioContext: {
      Enabled: GetterSetter<boolean>;
      SelectedLimit: GetterSetter<number>;
      Limits: GetterSetter<number[]>;
      GainNode: GetterSetter<GainNode | undefined>;
    };
  };
  Utility: {
    Modals: {
      EditPlaylists: GetterSetter<ApiVideo | undefined>;
      EditTags: GetterSetter<ApiVideo | undefined>;
    }
  },
  Settings: {
    ModalKind: GetterSetter<'dialog' | 'drawer' | 'sheet'>;
    ModalSide: GetterSetter<ComponentProps<typeof SheetContent>['side'] | ComponentProps<typeof Drawer>['direction']>;
    PrivacyVideoMode: GetterSetter<boolean>;
    ShowScalarApi: GetterSetter<boolean>;
    ApiHostUrl: GetterSetter<string | undefined>;
    ColoredWatchedStatus: GetterSetter<'none' | 'border' | 'full'>;
    DevelopmentMode: GetterSetter<boolean>;
  },
  Errors: GetterSetter<(ApiError | Error | { source: string; content: string })[]>;
  Keybinds: GetterSetter<{ [key: string]: Command }>;
  Pages: {
    Current: GetterSetter<Page>;
    All: PageSidebar[];
  }
}

export function GlobalConfig(apiRequest: ApiRequest): GlobalConfigType {
  const [currentPage, setCurrentPage] = useState<GlobalConfigType['Pages']['Current']['Getter']>('homepage');
  const [empty, setEmpty] = useState<undefined>();
  const [pageTitle, setPageTitle] = useState<string>('Video Player');
  const [openSettings, setOpenSettings] = useState(false);
  const [openImportFromFile, setOpenFromFile] = useState(false);
  const [openImportFromUrl, setOpenFromUrl] = useState(false);
  const [openAudioContext, setOpenAudioContext] = useState(false);
  const [openTheme, setOpenTheme] = useState(false);
  const [openKeybinds, setOpenKeybinds] = useState(false);
  const [openSyncFolderData, setOpenSyncFolderData] = useState(false);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [openAutomaticRule, setOpenAutomaticRule] = useState(false);
  const [openSyncData, setOpenSyncData] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);


  const [selectedVideo, setSelectetdVideo] = useState<ApiVideo | undefined>();
  const [apiVideos, setApiVideos] = useState<ApiVideo[]>();
  const [apiPlaylists, setApiPlaylists] = useState<ApiPlaylist[]>();
  const [apiFolders, setApiFolders] = useState<ApiFolder[]>();
  const [apiTagas, setApiTags] = useState<ApiTag[]>();
  const [apiRules, setApiRules] = useState<ApiRule[]>();

  const [filterFolder, setFilterFolder] = useState<ApiFolder>();
  const [filterPlaylist, setFilterPlaylist] = useState<ApiPlaylist>();
  const [filterFullpath, setFiltetrFullpath] = useState<string>();
  const [filterTag, setFilterTag] = useState<ApiTag>();

  const [audioCtxGainNode, setAudioCtxGainNode] = useState<GainNode>();
  const [audioCtxEnabled, setAudioCtxEnabled] = useState<boolean>(false);
  const [audioCtxLimits, setAudioCtxLimits] = useState<number[]>([100, 200, 300, 400, 500, 600]);
  const [audioCtxSelectedLimit, setAudioCtxSelectedLimit] = useState<typeof audioCtxLimits[number]>(300);

  const [utilityEditPlaylist, setUtilityEditPlaylist] = useState<ApiVideo>();
  const [utilityEditTag, setUtilityEditTag] = useState<ApiVideo>();

  const [tableFilterWatched, setTableFilterWatched] = useState<boolean>();
  const [tableFilterFilename, setTableFilterFilename] = useState<string>();
  const [tableFilterFolder, setTableFilterFolder] = useState<string>();
  const [tableFilterFilenameMode, setTableFilterFilenameMode] = useState<'text' | 'regex'>('text');
  const [tableFilterFolderMode, setTableFilterFolderMode] = useState<'input' | 'select'>('input');


  const [settingsModalKind, setSettingsModalKind] = useState<GlobalConfigType['Settings']['ModalKind']['Getter']>('dialog');
  const [settingsModalSide, setSettingsModalSide] = useState<GlobalConfigType['Settings']['ModalSide']['Getter']>('left');
  const [privacyVideoMode, setPrivacyVideoMode] = useState(false);
  const [settingsShowScalarApi, setSettingsShowScalarApi] = useState(false);
  const [settingsColoredWatchedStatus, setSettingsColoredWatchedStatus] = useState<'none' | 'border' | 'full'>('border');
  const [settingsApiUrl, setSettingsApiUrl] = useState<string>();
  const [settingsShowDevelopmentMode, setSettingsShowDevelopmentMode] = useState(false);

  const [errorHandler, setErrorHandler] = useState<GlobalConfigType['Errors']['Getter']>([]);

  const showHideVideo = useMemo(() => selectedVideo != undefined, [selectedVideo]);

  const visibleVideos = useMemo(() => {
    if (apiVideos === undefined) return [];
    return apiVideos.filter(x => {
      const conds: boolean[] = [];
      if (filterFolder != undefined) conds.push(x.folder?.id == filterFolder?.id);
      if (filterPlaylist != undefined) conds.push((x.playlists ?? []).map(p => p.id).includes(filterPlaylist?.id));
      if (filterFullpath != undefined) conds.push(x.fullpath.startsWith(filterFullpath));
      if (filterTag != undefined) conds.push((x.tags ?? []).map(t => t.id).includes(filterTag.id));

      if (tableFilterWatched != undefined) conds.push((x.attributes.watched ?? false) == tableFilterWatched)
      if (tableFilterFolder != undefined) conds.push(x.fullpath.replace('\\', '/').split('/').slice(0, -1).join('/').toLowerCase().includes(tableFilterFolder.toLowerCase()))
      if (tableFilterFilename != undefined) {
        switch (tableFilterFilenameMode) {
          case 'text':
            conds.push(x.filename.toLowerCase().includes(tableFilterFilename.toLowerCase()))
            break;
          case 'regex':
            try {
              const rule = new RegExp(tableFilterFilename, 'gi');
              conds.push(rule.test(x.filename))
            } catch { }
            break;
        }
      }
      return conds.length == 0 || conds.every(Boolean);
    });
  }, [
    filterFolder,
    filterPlaylist,
    filterFullpath,
    filterTag,

    tableFilterWatched,
    tableFilterFilename,
    tableFilterFolder,
    tableFilterFilenameMode,

    apiVideos,
  ]);

  useEffect(() => {
    if (!audioCtxGainNode) return;
    audioCtxGainNode.gain.value = audioCtxSelectedLimit / 100;
  }, [audioCtxGainNode, audioCtxSelectedLimit]);


  useEffect(() => {
    if (selectedVideo === undefined) return;
    if (privacyVideoMode) return;

    if (!selectedVideo.attributes.watched) {
      apiRequest.PatchSetWatchedFlag(selectedVideo, { attr: true })
        .then(
          (vid) => {
            setApiVideos(videos => videos === undefined ? undefined : videos.map(v => {
              if (v.id == vid.id) return vid;
              return v;
            }).sort((a, b) => {
              return a.fullpath.localeCompare(b.fullpath);
            }))
          },
          (error) => { setErrorHandler(errs => [...errs, error]) }
        )
    }
  }, [
    privacyVideoMode,
    selectedVideo,
  ]);

  useEffect(() => {
    resetModal('OpenErrorModal');
    setOpenErrorModal(true);
  }, [errorHandler]);


  function resetModal(exclude: (keyof GlobalConfigType['Sidebar']['Top'] | keyof GlobalConfigType['Sidebar']['Bottom'])) {
    const modals = {
      'FromFileModal': setOpenFromFile,
      'FromUrlModal': setOpenFromUrl,
      'AutomaticRuleModel': setOpenAutomaticRule,
      'AudioContextModal': setOpenAudioContext,
      'ScanFolderVideosModal': setOpenSyncFolderData,
      'OpenErrorModal': setOpenErrorModal,
      'SyncDataModal': setOpenSyncData,
      'ThemeModal': setOpenTheme,
      'KeybindsModal': setOpenKeybinds,
      'SettingsModal': setOpenSettings,
    } as const;

    for (const [k, v] of Object.entries(modals)) {
      if (k != exclude) v(false);
    }
  }

  const commandIds = {
    audioctx: {
      enable: 'audioctx.enable',
    },
    video: {
      remove: 'video.remove',
    },
    open: {
      keybinds: 'open.keybinds',
      themes: 'open.themes',
      settings: 'open.settings',
      sync: 'open.syncdata',
    }
  } as const;

  const [keybinds, setKeybinds] = useState<GlobalConfigType['Keybinds']['Getter']>({
    [commandIds.audioctx.enable]: {
      Default: getKeybind(commandIds.audioctx.enable, 'a', false, true, false, false),
      Action() {
        if (!audioCtxEnabled) setAudioCtxEnabled(true);
      },
    },
    [commandIds.video.remove]: {
      Default: getKeybind(commandIds.video.remove, 'CAPSLOCK', false, false, false, false),
      Action() {
        setSelectetdVideo(undefined);
      },
    },
    [commandIds.open.keybinds]: {
      Default: getKeybind(commandIds.open.keybinds, 'K', false, true, false, false),
      Action() { resetModal('KeybindsModal'); setOpenKeybinds(true); }
    },
    [commandIds.open.themes]: {
      Default: getKeybind(commandIds.open.themes, 't', false, true, false, false),
      Action() { resetModal('ThemeModal'); setOpenTheme(true); }
    },
    [commandIds.open.settings]: {
      Default: getKeybind(commandIds.open.settings, 'F1', false, false, false, false),
      Action() { resetModal('SettingsModal'); setOpenSettings(true); }
    },
    [commandIds.open.sync]: {
      Default: getKeybind(commandIds.open.sync, 'F2', false, false, false, false),
      Action() { resetModal('SyncDataModal'); setOpenSyncData(true); }
    },
  });


  return {
    Pages: {
      Current: { Getter: currentPage, Setter: setCurrentPage, },
      All: [
        { Id: 'homepage', Label: 'Homepage', Icon: <House />   },
        { Id: 'videos', Label: 'Videos', Icon: <TvMinimalPlay /> }
      ],
    },
    Api: {
      Instance: apiRequest,
      Data: {
        Videos: { Getter: apiVideos, Setter: setApiVideos, },
        Playlists: { Getter: apiPlaylists, Setter: setApiPlaylists, },
        Folders: { Getter: apiFolders, Setter: setApiFolders, },
        Tags: { Getter: apiTagas, Setter: setApiTags, },
        Rules: { Getter: apiRules, Setter: setApiRules, },
      },
    },
    Filters: {
      Folder: { Getter: filterFolder, Setter: setFilterFolder, },
      Playlist: { Getter: filterPlaylist, Setter: setFilterPlaylist, },
      Fullpath: { Getter: filterFullpath, Setter: setFiltetrFullpath, },
      Tag: { Getter: filterTag, Setter: setFilterTag, },

      Table: {
        Watched: { Getter: tableFilterWatched, Setter: setTableFilterWatched, },
        Filename: { Getter: tableFilterFilename, Setter: setTableFilterFilename, },
        Folder: { Getter: tableFilterFolder, Setter: setTableFilterFolder, },
        FilenameMode: { Getter: tableFilterFilenameMode, Setter: setTableFilterFilenameMode, },
        FolderMode: { Getter: tableFilterFolderMode, Setter: setTableFilterFolderMode, },
      }
    },
    Sidebar: {
      Title: {
        Icon: <Film />,
        Title: "Video Player",
        Getter: pageTitle,
        Setter: setPageTitle,
      },
      Top: {
        RemoveVideo: {
          Icon: <X />,
          Title: "Remove video",
          Getter: removeVideo,
          Setter: setRemoveVideo,
          Visibility: showHideVideo,
          Action() { setSelectetdVideo(undefined) },
        },
        FromFileModal: {
          Icon: <FileVideo />,
          Title: "Open from file",
          Getter: openImportFromFile,
          Setter: setOpenFromFile,
          Action() {
            resetModal('FromFileModal');
            setOpenFromFile(!openImportFromFile);
          },
        },
        FromUrlModal: {
          Icon: <Globe />,
          Title: "Open from url",
          Getter: openImportFromUrl,
          Setter: setOpenFromUrl,
          Action() {
            resetModal('FromUrlModal');
            setOpenFromUrl(!openImportFromUrl);
          },
        },
        AutomaticRuleModel: {
          Icon: <SquareFunction />,
          Title: "Apply automatic rules",
          Getter: openAutomaticRule,
          Setter: setOpenAutomaticRule,
          Action() {
            resetModal('AutomaticRuleModel');
            setOpenAutomaticRule(!openAutomaticRule);
          },
        },
        AudioContextModal: {
          Icon: <AudioLines />,
          Title: "Audio context",
          Getter: openAudioContext,
          Setter: setOpenAudioContext,
          Action() {
            resetModal('AudioContextModal');
            setOpenAudioContext(!openAudioContext);
          },
        },
        ScanFolderVideosModal: {
          Icon: <RefreshCw />,
          Title: "Scan folder data",
          Getter: openSyncFolderData,
          Setter: setOpenSyncFolderData,
          Action() {
            resetModal('ScanFolderVideosModal');
            setOpenSyncFolderData(!openSyncFolderData);
          },
        }
      },
      Bottom: {
        OpenErrorModal: {
          Title: <div className="text-destructive">{errorHandler.length} Error{errorHandler.length == 1 ? '' : 's'}</div>,
          Icon: <ShieldAlert className="text-destructive" />,
          Visibility: errorHandler.length > 0,
          Getter: openErrorModal,
          Setter: setOpenErrorModal,
          Action() {
            resetModal('OpenErrorModal');
            setOpenErrorModal(!openErrorModal);
          },
        },
        SyncDataModal: {
          Icon: <CloudBackup />,
          Title: "Sync local data",
          Getter: openSyncData,
          Setter: setOpenSyncData,
          Action() {
            resetModal('SyncDataModal');
            setOpenSyncData(!openSyncData);
          }
        },
        ThemeModal: {
          Title: "Theme selector",
          Icon: <Palette />,
          Getter: openTheme,
          Setter: setOpenTheme,
          Action() {
            resetModal('ThemeModal');
            setOpenTheme(!openTheme);
          },
        },
        KeybindsModal: {
          Title: "Keybinds",
          Icon: <Keyboard />,
          Getter: openKeybinds,
          Setter: setOpenKeybinds,
          Action() {
            resetModal('KeybindsModal');
            setOpenKeybinds(!openKeybinds);
          },
        },
        SettingsModal: {
          Title: "Settings",
          Icon: <Settings />,
          Getter: openSettings,
          Setter: setOpenSettings,
          Action() {
            resetModal('SettingsModal');
            setOpenSettings(!openSettings);
          },
        },
        OpenScalar: {
          Title: "Scalar API",
          Icon: <Waypoints />,
          Getter: empty,
          Setter: setEmpty,
          Visibility: settingsShowDevelopmentMode && settingsShowScalarApi,
          Action() {
            const url = apiRequest.GetScalarUrl();
            open(url, 'mozillaWindow', 'pupup');
          },
        },
      },
    },
    VideoPlayer: {
      Selected: { Getter: selectedVideo, Setter: setSelectetdVideo, },
      List: visibleVideos,
      AudioContext: {
        Enabled: { Getter: audioCtxEnabled, Setter: setAudioCtxEnabled },
        SelectedLimit: { Getter: audioCtxSelectedLimit, Setter: setAudioCtxSelectedLimit, },
        Limits: { Getter: audioCtxLimits, Setter: setAudioCtxLimits },
        GainNode: { Getter: audioCtxGainNode, Setter: setAudioCtxGainNode },
      },
    },
    Utility: {
      Modals: {
        EditPlaylists: { Getter: utilityEditPlaylist, Setter: setUtilityEditPlaylist, },
        EditTags: { Getter: utilityEditTag, Setter: setUtilityEditTag, }
      },
    },
    Settings: {
      ModalKind: { Getter: settingsModalKind, Setter: setSettingsModalKind, },
      ModalSide: { Getter: settingsModalSide, Setter: setSettingsModalSide, },
      PrivacyVideoMode: { Getter: privacyVideoMode, Setter: setPrivacyVideoMode, },
      ShowScalarApi: { Getter: settingsShowScalarApi, Setter: setSettingsShowScalarApi, },
      ColoredWatchedStatus: { Getter: settingsColoredWatchedStatus, Setter: setSettingsColoredWatchedStatus, },
      ApiHostUrl: { Getter: settingsApiUrl, Setter: setSettingsApiUrl, },
      DevelopmentMode: { Getter: settingsShowDevelopmentMode, Setter: setSettingsShowDevelopmentMode, },
    },
    Errors: { Getter: errorHandler, Setter: setErrorHandler },
    Keybinds: { Getter: keybinds, Setter: setKeybinds },
  } as const;
}

