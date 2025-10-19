'use client';

import dynamic from "next/dynamic";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { VideoPlayer, VideoPlayerContent, VideoPlayerControlBar, VideoPlayerMuteButton, VideoPlayerPlayButton, VideoPlayerSeekBackwardButton, VideoPlayerSeekForwardButton, VideoPlayerTimeDisplay, VideoPlayerTimeRange, VideoPlayerVolumeRange } from '@/components/ui/video-player-full';
import { ApiVideo } from "@/lib/api";
import { Configs } from "@/lib/consts";
import { MediaFullscreenButton } from "media-chrome/react";
import { GetCommands } from "@/lib/commands";

type Props = {
    // getter: ApiVideo | undefined;
    // setter: Dispatch<SetStateAction<ApiVideo | undefined>>
    commands: ReturnType<typeof GetCommands>;
    allData: ApiVideo[] | undefined;
    allDataSetter: Dispatch<SetStateAction<ApiVideo[] | undefined>>;
}

export default dynamic(() => Promise.resolve(Vp), { ssr: false })
// https://www.kibo-ui.com/components/video-player

export function Vp({ commands, allData, allDataSetter }: Props) {
    useEffect(() => {
        if (commands.VideoPlayer.Commands.Video.Updates.Getter && !commands.VideoPlayer.Commands.Video.Updates.Getter.attributes.watched) {
            commands.VideoPlayer.Commands.Video.Updates.Getter.attributes.watched = true;
            allDataSetter(allData?.map(i => i.id == commands.VideoPlayer.Commands.Video.Updates.Getter!.id ? commands.VideoPlayer.Commands.Video.Updates.Getter! : i))
        }
    }, [commands.VideoPlayer.Commands.Video.Updates.Getter]);

    useEffect(() => {
        const video = document.querySelector<HTMLVideoElement>("video#video-stream");
        if (video == null) { return }
        video.addEventListener('keydown', (evt) => {
            // const total = commands.AudioContext.Commands.EnableAudioContext.Updates.Getter
            //     ? +(commands.AudioContext.Commands.Limit.Updates.Getter || 100)
            //     : 100;
            // const incr = 0.1 / (total / 100);
            // console.log({ total, incr, getter: commands.AudioContext.Commands.Limit.Updates.Getter, enabled: commands.AudioContext.Commands.EnableAudioContext.Updates.Getter });
            const incr = 0.05;
            switch (evt.key) {
                case 'ArrowUp':
                    video.volume = Math.min(Math.max(video.volume + incr, 0), 1);
                    evt.preventDefault();
                    break;
                case 'ArrowDown':
                    video.volume = Math.min(Math.max(video.volume - incr, 0), 1);
                    evt.preventDefault();
                    break;
                case 'ArrowRight':
                    video.currentTime = Math.max(Math.min(video.currentTime + 5, video.duration), 0)
                    evt.preventDefault();
                    break;
                case 'ArrowLeft':
                    video.currentTime = Math.max(Math.min(video.currentTime - 5, video.duration), 0)
                    evt.preventDefault();
                    break;
                case '0':
                    video.currentTime = 0;
                    evt.preventDefault();
                    break;
                case '1':
                    video.currentTime = video.duration * 10 / 100;
                    evt.preventDefault();
                    break;
                case '2':
                    video.currentTime = video.duration * 20 / 100;
                    evt.preventDefault();
                    break;
                case '3':
                    video.currentTime = video.duration * 30 / 100;
                    evt.preventDefault();
                    break;
                case '4':
                    video.currentTime = video.duration * 40 / 100;
                    evt.preventDefault();
                    break;
                case '5':
                    video.currentTime = video.duration * 50 / 100;
                    evt.preventDefault();
                    break;
                case '6':
                    video.currentTime = video.duration * 60 / 100;
                    evt.preventDefault();
                    break;
                case '7':
                    video.currentTime = video.duration * 70 / 100;
                    evt.preventDefault();
                    break;
                case '8':
                    video.currentTime = video.duration * 80 / 100;
                    evt.preventDefault();
                    break;
                case '9':
                    video.currentTime = video.duration * 90 / 100;
                    evt.preventDefault();
                    break;
                default:
                    break;
            }
        });
        console.log(video);
    }, []);

    useEffect(() => {
        if (commands.VideoPlayer.Commands.Video.Updates.Getter?.title === undefined) return;
        document.title = commands.VideoPlayer.Commands.Video.Updates.Getter?.title;
    }, [commands.VideoPlayer.Commands.Video.Updates.Getter])

    return (
        <VideoPlayer className="overflow-hidden rounded-lg border max-w-200 mx-auto" id="video-container">
            <VideoPlayerContent
                crossOrigin=""
                preload="auto"
                muted={false}
                slot="media"
                id="video-stream"
                src={
                    commands.VideoPlayer.Commands.Video.Updates.Getter?.customUrl == undefined
                        ? `${Configs.ApiEndpoint}/video/stream/${commands.VideoPlayer.Commands.Video.Updates.Getter?.id}`
                        : commands.VideoPlayer.Commands.Video.Updates.Getter.customUrl
                }
                onDoubleClick={() => {
                    if (document.fullscreenElement) {
                        document.exitFullscreen();
                    } else {
                        const video = document.querySelector<HTMLVideoElement>("#video-container");
                        if (video != null) {
                            video.requestFullscreen();
                        }
                    }
                }}
            />
            <VideoPlayerControlBar className="*:bg-zinc-900/25 hover:bg-zinc-900">
                <VideoPlayerPlayButton />
                <VideoPlayerSeekBackwardButton seekOffset={5} key={undefined} onKeyUp={(evt) => evt.preventDefault()} />
                <VideoPlayerSeekForwardButton seekOffset={5} key={undefined} onKeyUp={(evt) => evt.preventDefault()} />
                <VideoPlayerTimeRange />
                <VideoPlayerTimeDisplay showDuration />
                <VideoPlayerMuteButton />
                <VideoPlayerVolumeRange mediaVolume={0} />
                <MediaFullscreenButton className="p-2.5" />
            </VideoPlayerControlBar>
        </VideoPlayer>
    )
}