'use client';

import { MonitorCog, Moon, Palette, PanelLeftIcon, Settings, Sun, User, Volume2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Dispatch, JSX, SetStateAction, useEffect, useMemo, useState } from 'react';
import { ApiPage, ApiRequest, ApiVideo } from '@/lib/api';

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
        ApiRequest<ApiPage>('GET', '/api/v1/pages', null, null).then(data => setAllPages(data.results))
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
                //         fetch('/actions/auth/signin', {
                //             method: 'POST',
                //             body: new URLSearchParams({
                //                 'userName': 'admin',
                //                 'password': 'admin',
                //             })
                //         }).then(res => {
                //             console.log(res);
                //             if (res.status == 200) {
                //                 // document.location.reload();
                //             }
                //         });
                //     },
                //     Enabled: true,
                //     Visible: true,
                // }
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