"use client";

import { AudioLines, CloudBackup, File, FileVideo, Film, Globe, Keyboard, Palette, RefreshCw, Settings, SquareFunction, Waypoints, X } from "lucide-react";
import { ComponentProps, Dispatch, JSX, SetStateAction, useEffect, useMemo, useState } from "react";
import { ApiFolder, ApiPlaylist, ApiRequest, ApiRule, ApiTag, ApiVideo } from "@/lib/api";
import { SheetContent } from "@/components/ui/sheet";
import { Drawer } from "@/components/ui/drawer";


type GetterSetter<T> = {
  Getter: T;
  Setter: Dispatch<SetStateAction<T>>;
}
export type SidebarItem<T> = {
  Icon: JSX.Element
  Title: string;
  Action?: () => void;
  Visibility?: boolean;
} & GetterSetter<T>;

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
  }
}

export function GlobalConfig(apiRequest: ApiRequest): GlobalConfigType {
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
  const [tableFilterfilenameMode, setTableFilterfilenameMode] = useState<'text' | 'regex'>('text');

  const [settingsModalKind, setSettingsModalKind] = useState<GlobalConfigType['Settings']['ModalKind']['Getter']>('sheet');
  const [settingsModalSide, setSettingsModalSide] = useState<GlobalConfigType['Settings']['ModalSide']['Getter']>('right');
  const [privacyVideoMode, setPrivacyVideoMode] = useState(false);
  const [settingsShowScalarApi, setSettingsShowScalarApi] = useState(false);
  const [settingsColoredWatchedStatus, setSettingsColoredWatchedStatus] = useState<'none' | 'border' | 'full'>('border');
  const [settingsApiUrl, setSettingsApiUrl] = useState<string>();

  const showHideVideo = useMemo(() => selectedVideo != undefined, [selectedVideo]);

  const visibleVideos = useMemo(() => {
    return (apiVideos ?? []).filter(x => {
      const conds: boolean[] = [];
      if (filterFolder != undefined) conds.push(x.folder?.id == filterFolder?.id);
      if (filterPlaylist != undefined) conds.push((x.playlists ?? []).map(p => p.id).includes(filterPlaylist?.id));
      if (filterFullpath != undefined) conds.push(x.fullpath.startsWith(filterFullpath));
      if (filterTag != undefined) conds.push((x.tags ?? []).map(t => t.id).includes(filterTag.id));

      if (tableFilterWatched != undefined) conds.push((x.attributes.watched ?? false) == tableFilterWatched)
      if (tableFilterFolder != undefined) conds.push(x.fullpath.replace('\\', '/').split('/').slice(0, -1).join('/').toLowerCase().includes(tableFilterFolder.toLowerCase()))
      if (tableFilterFilename != undefined) {
        switch (tableFilterfilenameMode) {
          case 'text':
            conds.push(x.filename.toLowerCase().includes(tableFilterFilename.toLowerCase()))
            break;
          case 'regex':
            try {
              const rule = new RegExp(tableFilterFilename ?? '', 'gi');
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
    tableFilterfilenameMode,

    apiVideos,
  ]);

  useEffect(() => {
    if (!audioCtxGainNode) return;
    audioCtxGainNode.gain.value = audioCtxSelectedLimit / 100;
  }, [audioCtxGainNode, audioCtxSelectedLimit]);

  return {
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
        FilenameMode: { Getter: tableFilterfilenameMode, Setter: setTableFilterfilenameMode, },
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
          Action() {
            setSelectetdVideo(undefined);
          },
        },
        FromFileModal: {
          Icon: <FileVideo />,
          Title: "Open from file",
          Getter: openImportFromFile,
          Setter: setOpenFromFile,
          Action() { setOpenFromFile(!openImportFromFile) },
        },
        FromUrlModal: {
          Icon: <Globe />,
          Title: "Open from url",
          Getter: openImportFromUrl,
          Setter: setOpenFromUrl,
          Action() { setOpenFromUrl(!openImportFromUrl) },
        },
        AutomaticRuleModel: {
          Icon: <SquareFunction />,
          Title: "Apply automatic rules",
          Getter: openAutomaticRule,
          Setter: setOpenAutomaticRule,
          Action() { setOpenAutomaticRule(!openAutomaticRule) },
        },
        AudioContextModal: {
          Icon: <AudioLines />,
          Title: "Audio context",
          Getter: openAudioContext,
          Setter: setOpenAudioContext,
          Action() { setOpenAudioContext(!openAudioContext) },
        },
        ScanFolderVideosModal: {
          Icon: <RefreshCw />,
          Title: "Scan folder data",
          Getter: openSyncFolderData,
          Setter: setOpenSyncFolderData,
          Action() { setOpenSyncFolderData(!openSyncFolderData) },
        }
      },
      Bottom: {
        SyncDataModal: {
          Icon: <CloudBackup />,
          Title: "Sync local data",
          Getter: openSyncData,
          Setter: setOpenSyncData,
          Action() { setOpenSyncData(!openSyncData) }
        },
        ThemeModal: {
          Title: "Theme selector",
          Icon: <Palette />,
          Getter: openTheme,
          Setter: setOpenTheme,
          Action() { setOpenTheme(!openTheme) },
        },
        KeybindsModal: {
          Title: "Keybinds",
          Icon: <Keyboard />,
          Getter: openKeybinds,
          Setter: setOpenKeybinds,
          Action() { setOpenKeybinds(!openKeybinds) },
        },
        SettingsModal: {
          Title: "Settings",
          Icon: <Settings />,
          Getter: openSettings,
          Setter: setOpenSettings,
          Action() { setOpenSettings(!openSettings) },
        },
        OpenScalar: {
          Title: "Scalar API",
          Icon: <Waypoints />,
          Getter: empty,
          Setter: setEmpty,
          Visibility: settingsShowScalarApi,
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
    }
  } as const;
}