'use client';

import { CogIcon, Keyboard, Layers, MonitorCog, Moon, Palette, PanelLeftIcon, RefreshCcw, Settings, Sun, TestTubeDiagonal, User, Volume2, Waypoints, Webhook } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Dispatch, JSX, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ApiPage, ApiRequest, ApiVideo } from '@/lib/api';
import { Configs } from './consts';
import { Config } from './config';

export type additionalKeyPressed = {
  isShiftPressed?: boolean;
  isCtrlPressed?: boolean;
  isAltPressed?: boolean;
  isMetaPressed?: boolean;
}

export type Commands<T> = {
  Label: string;
  Visible: boolean;
  Commands: Command<T>[];
}

export type Command<T> = {
  Icon: JSX.Element,
  Name: string;
  ShortCutHint?: string;
  ShortCut: (key: string, params: additionalKeyPressed) => boolean;
  Callback: (...args: any) => undefined;
  Updates: {
    Getter: T,
    Setter: Dispatch<SetStateAction<T>>
  }
  Enabled: boolean;
  Visible?: boolean;
}

export function GetCommands() {
  const { setTheme } = useTheme();

  const [audioContext, setAudioContext] = useState(false);
  const [audioContextLimit, setAudioContextLimit] = useState<number | boolean>(false);
  const [gainNode, setGainNode] = useState<GainNode>();
  const [videoData, setVideoData] = useState<ApiVideo | undefined>();
  const [allPages, setAllPages] = useState<ApiPage[]>([]);
  const [themeSelector, setThemeSelector] = useState<boolean>(false);
  const [settings, setSettings] = useState<boolean>(false);
  const [reloadDataOpenModal, setReloadDataOpenModal] = useState<boolean>(false);
  const [reloadDataStatus, setReloadDataStatus] = useState<boolean | string>();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [user, setUser] = useState<boolean>(false);
  const isUserLogged = useMemo<boolean>(() => {
    return true;
  }, [user]);

  useEffect(() => {
    if (!gainNode) return;
    if (typeof audioContextLimit != 'number') return;

    gainNode.gain.value = audioContextLimit / 100;
  }, [gainNode, audioContextLimit]);

  useEffect(() => {
    Config.Api.Handler.Get_ApiV1Pages().then(setAllPages)
    // ApiRequest<ApiPage>('GET', '/api/v1/pages', null, null).then(data => setAllPages(data.results))
  }, []);

  return {
    Preferences: {
      Label: 'Preferences',
      Visible: true,
      Commands: {
        ThemeSelector: {
          Name: 'Theme selector',
          Icon: <Palette />,
          ShortCutHint: "Shift+Alt+T",
          ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'T' && !!params.isShiftPressed && !!params.isAltPressed,
          Callback: () => {
            setSettings(false);
            setThemeSelector(!themeSelector);
          },
          Updates: {
            Getter: themeSelector,
            Setter: setThemeSelector
          },
          Enabled: true,
          Visible: true,
        } as Command<boolean>
      }
    },
    AudioContext: {
      Label: 'Audio Context',
      Visible: true,
      Commands: {
        EnableAudioContext: {
          Name: 'Enable audio Context',
          Icon: <Volume2 />,
          ShortCutHint: "Shift+Alt+A",
          ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'A' && !!params.isShiftPressed && !!params.isAltPressed,
          Callback: () => {
            if (!audioContext) {
              setAudioContext(true);

              const interval = setInterval(() => {
                const video = document.querySelector<HTMLVideoElement>('video#video-stream');
                if (video == null) return;

                const ctx = new AudioContext();
                const source = ctx.createMediaElementSource(video);
                const gn = ctx.createGain();

                source.connect(gn);

                gn.connect(ctx.destination);
                setGainNode(gn)

                clearInterval(interval);
              })
            }
          },
          Updates: {
            Getter: audioContext,
            Setter: setAudioContext,
          },
          Enabled: true,
          Visible: true,
        } as Command<boolean>,
        Limit: {
          Name: 'Limit',
          Enabled: false,
          Updates: {
            Getter: audioContextLimit,
            Setter: setAudioContextLimit,
          },
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Callback: () => { },
          Visible: false,
        } as Command<typeof audioContextLimit | boolean>
      }
    },
    Utility: {
      Label: 'Utility',
      Visible: true,
      Commands: {
        ReloadDataOpenModal: {
          Name: 'Reload data',
          Icon: <RefreshCcw />,
          Enabled: true,
          Visible: true,
          Callback: () => {
            setSettings(false);
            setReloadDataOpenModal(!reloadDataOpenModal);
          },
          Updates: {
            Getter: reloadDataOpenModal,
            Setter: setReloadDataOpenModal,
          }
        },
        ReloadDataStatus: {
          Name: 'Reload data status',
          Enabled: false,
          Visible: false,
          Callback: () => { },
          Updates: {
            Getter: reloadDataStatus,
            Setter: setReloadDataStatus,
          }
        }
      },
    },
    Configs: {
      Label: 'Configurations',
      Visible: true,
      Commands: {
        Settings: {
          Name: 'Settings',
          Icon: <Settings />,
          Callback: () => {
            setSettings(!settings)
          },
          Updates: {
            Getter: settings,
            Setter: setSettings,
          },
          Enabled: true,
          Visible: false,
        } as Command<boolean>,
        TriggerSideBar: {
          Name: 'Trigger sidebar',
          Icon: <PanelLeftIcon />,
          ShortCutHint: 'Shift+Alt+H',
          ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'H' && !!params.isShiftPressed && !!params.isAltPressed,
          Callback: () => { setSidebarOpen(!sidebarOpen) },
          Updates: {
            Getter: sidebarOpen,
            Setter: setSidebarOpen,
          },
          Enabled: true,
          Visible: true,
        },
        Navigation: {
          Name: 'Navigation',
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Updates: {
            Getter: allPages,
            Setter: setAllPages,
          },
          Enabled: false,
          Visible: false,
        },
        // Login: {
        //     Name: "Login",
        //     Icon: <User />,
        //     ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
        //     Callback: () => {
        //         fetch(`${Configs.ApiEndpoint}/actions/auth/signin`, {
        //             method: 'POST',
        //             body: new URLSearchParams({
        //                 'userName': 'admin',
        //                 'password': 'admin',
        //             })
        //         }).then(res => {
        //             console.log(res);
        //             if (res.status == 200) {
        //                 document.location.reload();
        //             }
        //         });
        //     },
        //     Enabled: true,
        //     Visible: true,
        // }
      }
    },
    Development: {
      Label: 'Development',
      Visible: true,
      Commands: {
        Scalar: {
          Name: 'Scalar OpenAPI',
          Enabled: true,
          Visible: true,
          Icon: <Webhook />,
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Callback: () => {
            let scalarUrl = `${Configs.ApiEndpoint}/oapi/scalar`;
            open(scalarUrl, 'mozillaWindow', 'pupup')
          }
        },
        GraphQL: {
          Name: 'GraphQL Playground',
          Enabled: true,
          Visible: true,
          Icon: <TestTubeDiagonal />,
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Callback: () => {
            let graphql = `${Configs.ApiEndpoint}/gql/playground`;
            open(graphql, 'mozillaWindow', 'pupup')
          }
        }
      }
    },
    VideoPlayer: {
      Label: '',
      Visible: false,
      Commands: {
        Video: {
          Name: 'Visible video',
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Updates: {
            Getter: videoData,
            Setter: setVideoData,
          },
          Enabled: true,
          Visible: true
        },
      }
    },
    User: {
      Label: "User",
      Visible: false,
      Commands: {
        CurrentUser: {
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Enabled: false,
          Visible: false,
          Updates: {
            Getter: user,
            Setter: setUser,
          }
        },
        IsLogged: {
          ShortCut: (key: string, params: additionalKeyPressed): boolean => false,
          Enabled: false,
          Visible: false,
          Updates: {
            Getter: isUserLogged,
          }
        }
      }
    }
  } as const;
}




//! ------------------------------------------------------------------------------------------- !//

//! ------------------------------------------------------------------------------------------- !//

export enum KeyKinds {
  /** Callback only */
  Cb,
  /** Getter & Setter */
  GetterSetter,
  /** Callback, Getter and Setter */
  CBGetterSetter
};

export type KeysInLocalStorage = {
  Id: string;
  Key?: string;
  Ctrl?: boolean;
  Alt?: boolean;
  Meta?: boolean;
  Shift?: boolean;
};

type KeyEntityKinds<T> = {
  Kind: KeyKinds.Cb;
  Callback: () => void;
  Getter?: never;
  Setter?: never;
} |
{
  Kind: KeyKinds.GetterSetter;
  Getter: T;
  Setter: Dispatch<SetStateAction<T>>;
  Callback?: never;
} |
{
  Kind: KeyKinds.CBGetterSetter,
  Getter: T;
  Setter: Dispatch<SetStateAction<T>>;
  Callback: (g: T, s: Dispatch<SetStateAction<T>>) => void;
}

type KeyEntityKeybind = {
  HasKeybind: false;
  DefaultStorage?: never;
  CustomStorage?: never;
} | {
  HasKeybind: true;
  DefaultStorage: KeysInLocalStorage;
  CustomStorage?: KeysInLocalStorage;
}

type KeyEntityIcon = {
  Visible: false;
  Icon?: never;
} | {
  Visible: true;
  Icon: JSX.Element;
}

export type KeyEntity<T = boolean> = {
  Id: string;
  Label: string;
  Description?: string;
}
  & KeyEntityIcon
  & KeyEntityKinds<T>
  & KeyEntityKeybind
  ;


export function GetGroups(): { [key: string]: (keyof ReturnType<typeof GetCommands2>)[] } {
  return {
    'Audio': ['AudioContext'],
    'Windows': ['Settings', 'KeyboardShortcuts', 'ThemeSelector'],
    'Development': ['PopupScalar', 'PopupGraphqlPlayground'],
  } as const;
}

export function GetCommands2() {
  const { setTheme } = useTheme();

  const [themeModal, setThemeModal] = useState<boolean>(false);
  const [settingModal, setSettingModal] = useState<boolean>(false);
  const [keybindModal, setKeybindModal] = useState<boolean>(false);
  const [reloadDataModal, setReloadDataModal] = useState<boolean>(false);

  const [audioContext, setAudioContext] = useState(false);
  const [audioContextLimit, setAudioContextLimit] = useState<number | boolean>(false);
  const [gainNode, setGainNode] = useState<GainNode>();

  const [videoData, setVideoData] = useState<ApiVideo>();
  const [reloadDataStatus, setReloadDataStatus] = useState<boolean | string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!gainNode) return;
    if (typeof audioContextLimit != 'number') return;
    gainNode.gain.value = audioContextLimit / 100;
  }, [gainNode, audioContextLimit]);


  function ResetModals() {
    setThemeModal(false);
    setSettingModal(false);
    setKeybindModal(false);
    setReloadDataModal(false);
  }

  return {
    ThemeSelector: {
      Id: 'theme-selector',
      Label: 'Theme selector',
      Visible: true,
      Icon: <Palette />,
      HasKeybind: true,
      DefaultStorage: { Id: 'theme-selector', Key: 'T', Alt: true },
      CustomStorage: undefined,
      Kind: KeyKinds.CBGetterSetter,
      Getter: themeModal,
      Setter: setThemeModal,
      Callback(g, s) {
        ResetModals();
        s(!g);
      }
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    Settings: {
      Id: 'settings',
      Label: 'Settings',
      Visible: true,
      Icon: <CogIcon />,
      HasKeybind: true,
      DefaultStorage: { Id: 'settings', Key: 'F1' },
      CustomStorage: undefined,
      Kind: KeyKinds.CBGetterSetter,
      Getter: settingModal,
      Setter: setSettingModal,
      Callback(g, s) {
        ResetModals();
        s(!g);
      }
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    KeyboardShortcuts: {
      Id: 'keyboard-shortcuts',
      Label: 'Keyboard Shortcuts',
      Visible: true,
      Icon: <Keyboard />,
      HasKeybind: true,
      DefaultStorage: { Id: 'keyboard-shortcuts', Key: 'K', Alt: true },
      CustomStorage: undefined,
      Kind: KeyKinds.CBGetterSetter,
      Getter: keybindModal,
      Setter: setKeybindModal,
      Callback(g, s) {
        ResetModals();
        s(!g);
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    SidebarTrigger: {
      Id: 'sidebar-trigger',
      Label: 'Trigger sidebar',
      Visible: true,
      Icon: <PanelLeftIcon />,
      HasKeybind: true,
      DefaultStorage: { Id: 'sidebar-trigger', Key: 'H', Alt: true },
      CustomStorage: undefined,
      Kind: KeyKinds.CBGetterSetter,
      Getter: sidebarOpen,
      Setter: setSidebarOpen,
      Callback(g, s) {
        s(!g);
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    AudioContext: {
      Id: 'audio-context',
      Label: 'Audio Context',
      Visible: true,
      Icon: <Volume2 />,
      HasKeybind: true,
      DefaultStorage: { Id: 'audio-context', Key: 'A', Shift: true, Alt: true },
      CustomStorage: undefined,
      Kind: KeyKinds.CBGetterSetter,
      Getter: audioContext,
      Setter: setAudioContext,
      Callback(g, s) {
        if (!g) {
          s(true);

          const interval = setInterval(() => {
            const video = document.querySelector<HTMLVideoElement>('video#video-stream');
            if (video == null) return;

            const ctx = new AudioContext();
            const source = ctx.createMediaElementSource(video);
            const gn = ctx.createGain();

            source.connect(gn);
            gn.connect(ctx.destination);
            setGainNode(gn);

            clearInterval(interval);
          })
        }
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    ReloadData: {
      Id: 'reload-data',
      Label: 'Reload data',
      Visible: true,
      Icon: <RefreshCcw />,
      HasKeybind: false,
      Kind: KeyKinds.CBGetterSetter,
      Getter: reloadDataModal,
      Setter: setReloadDataModal,
      Callback(g, s) {
        ResetModals();
        s(!g);
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,

    SetThemeLight: {
      Id: 'set-theme-light',
      Label: 'Set theme light',
      Visible: false,
      HasKeybind: false,
      Kind: KeyKinds.Cb,
      Callback() {
        setTheme('light');
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    SetThemeDark: {
      Id: 'set-theme-dark',
      Label: 'Set theme dark',
      Visible: false,
      HasKeybind: false,
      Kind: KeyKinds.Cb,
      Callback() {
        setTheme('dark');
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    SetThemeSystem: {
      Id: 'set-theme-system',
      Label: 'Set theme system',
      Visible: false,
      HasKeybind: false,
      Kind: KeyKinds.Cb,
      Callback() {
        setTheme('system');
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    PopupScalar: {
      Id: 'popup-scalar',
      Label: 'Scalar',
      Visible: true,
      Icon: <Waypoints />,
      HasKeybind: false,
      Kind: KeyKinds.Cb,
      Callback() {
        let scalarUrl = `${Configs.ApiEndpoint}/oapi/scalar`;
        open(scalarUrl, 'mozillaWindow', 'pupup')
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    PopupGraphqlPlayground: {
      Id: 'popup-graphql',
      Label: 'GraphQL Playground',
      Visible: true,
      Icon: <Layers />,
      HasKeybind: false,
      Kind: KeyKinds.Cb,
      Callback() {
        let graphql = `${Configs.ApiEndpoint}/gql/playground`;
        open(graphql, 'mozillaWindow', 'pupup')
      },
    } satisfies KeyEntity<boolean> as KeyEntity<boolean>,
    AudioContextLimits: {
      Id: 'audio-context-limits',
      Label: 'Audio context limits',
      Visible: false,
      HasKeybind: false,
      Kind: KeyKinds.GetterSetter,
      Getter: audioContextLimit,
      Setter: setAudioContextLimit,
    } satisfies KeyEntity<typeof audioContextLimit> as KeyEntity<typeof audioContextLimit>,
    ReloadDataStatus: {
      Id: 'reload-data-status',
      Label: 'Reload data status',
      Visible: false,
      HasKeybind: false,
      Kind: KeyKinds.GetterSetter,
      Getter: reloadDataStatus,
      Setter: setReloadDataStatus,
    } satisfies KeyEntity<typeof reloadDataStatus> as KeyEntity<typeof reloadDataStatus>,
    VideoPlayer: {
      Id: 'video-player',
      Label: 'Video player',
      Visible: false,
      HasKeybind: false,
      Kind: KeyKinds.GetterSetter,
      Getter: videoData,
      Setter: setVideoData,
    } satisfies KeyEntity<typeof videoData> as KeyEntity<typeof videoData>
  };
}

export function EnableCommandTriggers(commands: { [key: string]: KeyEntity<string | boolean | any> }) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      console.log({ key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey })
      const commandInputName = 'asd';
      if ((e.target as HTMLElement).tagName == 'INPUT' && (e.target as HTMLInputElement).name != commandInputName) return;
      for (const cmd of Object.values(commands)) {
        if (!cmd.HasKeybind) continue;
        const stor = (cmd.CustomStorage ?? cmd.DefaultStorage) as KeysInLocalStorage;
        if (stor == undefined || stor.Key == undefined) continue;
        const conditions: boolean[] = [
          e.key.toUpperCase() == stor.Key.toUpperCase(),
          e.ctrlKey == (!!stor.Ctrl),
          e.shiftKey == (!!stor.Shift),
          e.altKey == (!!stor.Alt),
          e.metaKey == (!!stor.Meta),
        ];
        if (conditions.every(Boolean)) {
          e.preventDefault();
          CallCallback(cmd);
        }
      }
    }
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  })
}

export function CallCallback(cmd: KeyEntity<any>) {
  switch (cmd.Kind) {
    case KeyKinds.Cb:
      cmd.Callback();
      break;
    case KeyKinds.CBGetterSetter:
      cmd.Callback(cmd.Getter, cmd.Setter);
      break;
    default:
      break;
  }
}