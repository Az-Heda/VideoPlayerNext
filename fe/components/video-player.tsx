'use client';

import dynamic from "next/dynamic";

import { Dispatch, JSX, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer, VideoPlayerContent, VideoPlayerControlBar, VideoPlayerMuteButton, VideoPlayerPlayButton, VideoPlayerSeekBackwardButton, VideoPlayerSeekForwardButton, VideoPlayerTimeDisplay, VideoPlayerTimeRange, VideoPlayerVolumeRange } from '@/components/ui/video-player-full';
import { ApiVideo } from "@/lib/api";
import { Configs } from "@/lib/consts";
import { MediaChromeButton, MediaFullscreenButton, MediaTooltip as MediaTooltipReact } from "media-chrome/react";
import { GetCommands, GetCommands2 } from "@/lib/commands";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info, Key, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaTooltip } from "media-chrome";
import { Config } from "@/lib/config";
import { cn } from "@/lib/utils";

type Props = {
  // getter: ApiVideo | undefined;
  // setter: Dispatch<SetStateAction<ApiVideo | undefined>>
  commands: ReturnType<typeof GetCommands2>;
  allData: ApiVideo[] | undefined;
  allDataSetter: Dispatch<SetStateAction<ApiVideo[] | undefined>>;
}

export default dynamic(() => Promise.resolve(Vp), { ssr: false })
// https://www.kibo-ui.com/components/video-player

export function Vp({ commands, allData, allDataSetter }: Props) {
  const refVideo = useRef<HTMLVideoElement>(null);


  const previousVideo = useMemo(() => {
    const filteredData = allData?.filter(d => d.folder?.path == commands.VideoPlayer.Getter?.folder?.path && d.folder?.path != null) ?? [];
    const idx = filteredData.findIndex(x => x.id == commands.VideoPlayer.Getter?.id);
    return idx > 0 ? filteredData.at(idx - 1) : undefined;
  }, [allData, commands.VideoPlayer.Getter]);

  const nextVideo = useMemo(() => {
    const filteredData = allData?.filter(d => d.folder?.path == commands.VideoPlayer.Getter?.folder?.path && d.folder?.path != null) ?? [];
    const idx = filteredData.findIndex(x => x.id == commands.VideoPlayer.Getter?.id);
    return (idx + 1) < filteredData.length ? filteredData.at(idx + 1) : undefined;
  }, [allData, commands.VideoPlayer.Getter]);


  useEffect(() => {
    if (commands.VideoPlayer.Getter && !commands.VideoPlayer.Getter.attributes.watched) {
      commands.VideoPlayer.Getter.attributes.watched = true;
      allDataSetter(allData?.map(i => i.id == commands.VideoPlayer.Getter!.id ? commands.VideoPlayer.Getter! : i))
    }
  }, [commands.VideoPlayer.Getter]);

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>("video#video-stream");
    if (video == null) { return }
    let holdTimer: NodeJS.Timeout[] = [];
    const HOLD_TIMER_BEFORE_MOVING = 500; // 500ms
    const WAIT_AFTER_SCREENSHOT = 1000 * 1.5 // 2s;
    const REFOCUS = 50;
    let can_take_screenshot = true;
    video.addEventListener('keyup', (evt) => {
      switch (evt.key) {
        case 'ArrowRight':
          holdTimer.forEach(clearTimeout);
          break;
        case 'ArrowLeft':
          holdTimer.forEach(clearTimeout);
          break;
        default:
          break;
      }
    })

    const handlerFunction = (evt: KeyboardEvent) => {
      // const total = commands.AudioContext.Commands.EnableAudioContext.Updates.Getter
      //     ? +(commands.AudioContext.Commands.Limit.Updates.Getter || 100)
      //     : 100;
      // const incr = 0.1 / (total / 100);
      // console.log({ total, incr, getter: commands.AudioContext.Commands.Limit.Updates.Getter, enabled: commands.AudioContext.Commands.EnableAudioContext.Updates.Getter });
      const incr = 0.05;
      const forwardBackworsTime = 1; // Seconds
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
          evt.preventDefault();
          if (!evt.altKey) {
            // forward current video
            holdTimer.push(setTimeout(() => {
              video.currentTime = Math.max(Math.min(video.currentTime + forwardBackworsTime, video.duration), 0)
            }, HOLD_TIMER_BEFORE_MOVING));
          } else {
            if (nextVideo !== undefined && commands.VideoPlayer.Setter !== undefined) {
              commands.VideoPlayer.Setter(nextVideo);
              setTimeout(() => video.focus(), REFOCUS);
            }
          }
          break;
        case 'ArrowLeft':
          evt.preventDefault();
          if (!evt.altKey) {
            // backwards current video
            holdTimer.push(setTimeout(() => {
              video.currentTime = Math.max(Math.min(video.currentTime - forwardBackworsTime, video.duration), 0)
            }, HOLD_TIMER_BEFORE_MOVING));
          } else {
            if (previousVideo !== undefined && commands.VideoPlayer.Setter !== undefined) {
              commands.VideoPlayer.Setter!(previousVideo);
              setTimeout(() => video.focus(), REFOCUS);
            }
          }

          break;
        // case 'F':
        //   if (!document.fullscreenElement) {
        //     video.requestFullscreen();
        //   } else {
        //     document.exitFullscreen();
        //   }
        //   break;
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
        case 's':
          if (evt.altKey) {
            evt.preventDefault();
            if (can_take_screenshot) TakeScreenshot(video);
            can_take_screenshot = false;
            setTimeout(() => can_take_screenshot = true, WAIT_AFTER_SCREENSHOT)
          }
        default:
          break;
      }
    };

    video.addEventListener('keydown', handlerFunction);
    return () => video.removeEventListener('keydown', handlerFunction);
  }, [commands.VideoPlayer.Getter]);

  useEffect(() => {
    if (commands.VideoPlayer.Getter?.title === undefined) return;
    document.title = commands.VideoPlayer.Getter?.title;
  }, [commands.VideoPlayer.Getter, previousVideo, nextVideo])

  function TakeScreenshot(video: HTMLVideoElement) {
    if (!video.paused) video.pause();

    let canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    let ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    let image = canvas.toDataURL("image/png");
    let a = document.createElement('a');
    const now = new Date();
    a.href = image;
    a.download = [
      `vp-screenshot-`,
      now.getFullYear(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0'),
      '-',
      now.getHours().toString().padStart(2, '0'),
      now.getMinutes().toString().padStart(2, '0'),
      now.getSeconds().toString().padStart(2, '0'),
    ].join('');

    canvas.toBlob(async (blob) => {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob! })
      ])
    }, "image/png");
    a.click();
  }

  const [previousVideoLabelOpen, setPreviousVideoLabelOpen] = useState<boolean>(false);
  const [nextVideoLabelOpen, setNextVideoLabelOpen] = useState<boolean>(false);

  return (
    <VideoPlayer className="overflow-hidden rounded-lg border max-w-200 mx-auto" id="video-container">
      <VideoPlayerContent
        ref={refVideo}
        crossOrigin=""
        preload="auto"
        muted={false}
        slot="media"
        id="video-stream"
        src={
          commands.VideoPlayer.Getter?.customUrl == undefined
            ? `${Configs.ApiEndpoint}/video/stream/${commands.VideoPlayer.Getter?.id}`
            : commands.VideoPlayer.Getter.customUrl
        }
        onDoubleClick={() => {
          if (!document.fullscreenElement) {
            const video = document.querySelector<HTMLVideoElement>("#video-container");
            if (video != null) video.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }}
      />

      <VideoPlayerControlBar className="*:bg-zinc-900/25 hover:bg-zinc-900">
        <VideoPlayerPlayButton />
        <VideoPlayerSeekBackwardButton seekOffset={10} />
        <VideoPlayerSeekForwardButton seekOffset={10} />
        <VideoPlayerTimeRange />
        <VideoPlayerTimeDisplay showDuration />


        <MediaChromeButton
          role="button"
          className="p-2.5"
          noTooltip
          disabled={previousVideo === undefined}
          onMouseEnter={() => setPreviousVideoLabelOpen(true)}
          onMouseLeave={() => setPreviousVideoLabelOpen(false)}
          onClick={() => {
            console.log(previousVideo)
            if (previousVideo === undefined) return;
            commands.VideoPlayer.Setter!(previousVideo);
          }}
        >
          <div className={cn(previousVideo === undefined ? 'text-primary/50 cursor-not-allowed' : 'text-primary cursor-pointer')} tabIndex={0} role="button" aria-label="Previous video in table">
            <ChevronsLeft />
          </div>
          <slot name="tooltip">
            <MediaTooltipReact
              part="tooltip"
              className="px-2 py-1"
              hidden={!previousVideoLabelOpen}
            >
              Previous video
            </MediaTooltipReact>
          </slot>
        </MediaChromeButton>


        <MediaChromeButton
          role="button"
          className="p-2.5"
          noTooltip
          disabled={nextVideo === undefined}
          onMouseEnter={() => setNextVideoLabelOpen(true)}
          onMouseLeave={() => setNextVideoLabelOpen(false)}
          onClick={() => {
            if (nextVideo === undefined) return;
            commands.VideoPlayer.Setter!(nextVideo);
          }}
        >
          <div className={cn(nextVideo === undefined ? 'text-primary/50 cursor-not-allowed' : 'text-primary cursor-pointer')} tabIndex={0} role="button" aria-label="Next video in table">
            <ChevronsRight />
          </div>
          <slot name="tooltip">
            <MediaTooltipReact
              part="tooltip"
              className="px-2 py-1"
              hidden={!nextVideoLabelOpen}
            >
              Next video
            </MediaTooltipReact>
          </slot>
        </MediaChromeButton>


        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange mediaVolume={0} />


        {/* <MediaChromeButton
          role="button"
          className="p-2.5"
          noTooltip
          onMouseEnter={() => setCurrentVideoTitleOpen(true)}
          onMouseLeave={() => setCurrentVideoTitleOpen(false)}
        >
          <div className="text-primary" tabIndex={0} role="button">
            <Info className="size-5" />
          </div>
          <slot name="tooltip">
            <MediaTooltipReact
              part="tooltip"
              className="px-2 py-1 w-32 whitespace-normal justify-content-end"
              hidden={!currentVideoTitlteOpen}
            >
              {commands.VideoPlayer.Getter?.title}
            </MediaTooltipReact>
          </slot>
        </MediaChromeButton> */}


        <MediaFullscreenButton className="p-2.5" />
      </VideoPlayerControlBar>

    </VideoPlayer>
  )
}