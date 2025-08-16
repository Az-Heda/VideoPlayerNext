'use client';

import { MonitorCog, Moon, PanelLeftIcon, Sun, Volume2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Dispatch, JSX, SetStateAction, useEffect, useState } from 'react';
import { ApiVideo } from '@/lib/api';

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

    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (!gainNode) return;
        if (typeof audioContextLimit != 'number') return;

        gainNode.gain.value = audioContextLimit / 100;
    }, [gainNode, audioContextLimit]);

    return {
        Theme: {
            Label: 'Theme',
            Visible: true,
            Commands: {
                LightTheme: {
                    Name: 'Light theme',
                    Icon: <Moon />,
                    ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'L' && !!params.isAltPressed && !!params.isShiftPressed,
                    ShortCutHint: 'Shift+Alt+L',
                    Callback: () => { setTheme('light') },
                    Enabled: true,
                    Visible: true,
                },
                DarkTheme: {
                    Name: 'Dark theme',
                    Icon: <Sun />,
                    ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'D' && !!params.isAltPressed && !!params.isShiftPressed,
                    ShortCutHint: 'Shift+Alt+D',
                    Callback: () => { setTheme('dark') },
                    Enabled: true,
                    Visible: true,
                },
                SystemTheme: {
                    Name: 'System theme',
                    Icon: <MonitorCog />,
                    ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'S' && !!params.isAltPressed && !!params.isShiftPressed,
                    ShortCutHint: 'Shift+Alt+S',
                    Callback: () => { setTheme('system') },
                    Enabled: true,
                    Visible: true,
                }
            }
        },
        AudioContext: {
            Label: 'Audio Context',
            Visible: true,
            Commands: {
                EnableAudioContext: {
                    Name: 'Enable audio Context',
                    Icon: <Volume2 />,
                    ShortCutHint: "Shift+A",
                    ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'A' && !!params.isShiftPressed,
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
                TriggerSideBar: {
                    Name: 'Trigger sidebar',
                    Icon: <PanelLeftIcon />,
                    ShortCutHint: 'Shift+H',
                    ShortCut: (key: string, params: additionalKeyPressed): boolean => key == 'H' && !!params.isShiftPressed,
                    Callback: () => { setSidebarOpen(!sidebarOpen) },
                    Updates: {
                        Getter: sidebarOpen,
                        Setter: setSidebarOpen,
                    },
                    Enabled: true,
                    Visible: true,
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
        }
    } as const;
}