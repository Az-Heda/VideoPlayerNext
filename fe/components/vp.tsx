'use client';

import dynamic from "next/dynamic";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { VideoPlayer, VideoPlayerContent, VideoPlayerControlBar, VideoPlayerMuteButton, VideoPlayerPlayButton, VideoPlayerSeekBackwardButton, VideoPlayerSeekForwardButton, VideoPlayerTimeDisplay, VideoPlayerTimeRange, VideoPlayerVolumeRange } from '@/components/ui/video-player-full';
import { ApiVideo } from "@/lib/api";
import { Configs } from "@/lib/consts";
import { MediaFullscreenButton, MediaVolumeRange } from "media-chrome/react";
import { GetCommands } from "@/lib/commands";

type Props = {
    getter: ApiVideo | undefined;
    setter: Dispatch<SetStateAction<ApiVideo | undefined>>
    commands: ReturnType<typeof GetCommands>;
    allData: ApiVideo[] | undefined;
    allDataSetter: Dispatch<SetStateAction<ApiVideo[] | undefined>>;
}

export default dynamic(() => Promise.resolve(Vp), { ssr: false })
// https://www.kibo-ui.com/components/video-player

export function Vp({ getter, setter, commands, allData, allDataSetter }: Props) {
    useEffect(() => {
        if (getter) {
            getter.attributes.watched = true;
            allDataSetter(allData?.map(i => i.id == getter.id ? getter : i))
        }
    }, [getter]);

    useEffect(() => {
        const video = document.querySelector<HTMLVideoElement>("video#video-stream");
        if (video == null) { return }
        video.addEventListener('keydown', (evt) => {
            const incr = commands.AudioContext.Commands.EnableAudioContext.Updates.Getter ? 0.02 : 0.1;

            switch (evt.key) {
                case 'ArrowUp':
                    video.volume = Math.min(Math.max(video.volume + incr, 0), 1);
                    break;
                case 'ArrowDown':
                    video.volume = Math.min(Math.max(video.volume - incr, 0), 1);
                    break;
                default:
                    break;
            }
        });
        console.log(video);
    }, []);
    return (
        <VideoPlayer className="overflow-hidden rounded-lg border max-w-200 mx-auto">
            <VideoPlayerContent
                crossOrigin=""
                preload="auto"
                muted={false}
                slot="media"
                id="video-stream"
                src={`${Configs.ApiEndpoint}/video/stream/${getter?.id}`}
                onDoubleClick={() => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        const video = document.querySelector<HTMLVideoElement>("video#video-stream");
                        if (video != null) {
                            video.requestFullscreen();
                        }
                    }
                }}
            />
            <VideoPlayerControlBar className="*:bg-zinc-900">
                <VideoPlayerPlayButton />
                <VideoPlayerSeekBackwardButton seekOffset={5} />
                <VideoPlayerSeekForwardButton seekOffset={5} />
                <VideoPlayerTimeRange />
                <VideoPlayerTimeDisplay showDuration />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeRange mediaVolume={0} />
                <MediaFullscreenButton className="p-2.5" />
            </VideoPlayerControlBar>
        </VideoPlayer>
    )
}