'use client';

import dynamic from "next/dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { VideoPlayer, VideoPlayerContent, VideoPlayerControlBar, VideoPlayerMuteButton, VideoPlayerPlayButton, VideoPlayerSeekBackwardButton, VideoPlayerSeekForwardButton, VideoPlayerTimeDisplay, VideoPlayerTimeRange, VideoPlayerVolumeRange } from '@/components/ui/video-player-full';
import { MediaChromeButton, MediaFullscreenButton, MediaTooltip as MediaTooltipReact } from "media-chrome/react";
import { ChevronsLeft, ChevronsRight, Info } from "lucide-react";
import { cn, isApiVideo } from "@/lib/utils";
import { GlobalConfigType } from "@/lib/globals";
import { ApiVideo } from "@/lib/api";

type Props = {
  config: GlobalConfigType;
  className?: string;
}

export default dynamic(() => Promise.resolve(Vp), { ssr: false })
// https://www.kibo-ui.com/components/video-player

export function Vp({ config, className }: Props) {
  const refVideo = useRef<HTMLVideoElement>(null);
  const [currentVideoTitlteOpen, setCurrentVideoTitleOpen] = useState(false);
  const [previousVideoLabelOpen, setPreviousVideoLabelOpen] = useState(false);
  const [nextVideoLabelOpen, setNextVideoLabelOpen] = useState(false);


  const nextVideo = useMemo(() => {
    const ids: string[] = [config.Filters.Playlist.Getter?.id, config.Filters.Tag.Getter?.id].filter(x => x != undefined);
    if (ids.length != 1) return undefined;
    if (typeof config.VideoPlayer.Selected.Getter === 'string') return undefined
    if (config.VideoPlayer.List.find(x => x.id == (config.VideoPlayer.Selected.Getter as ApiVideo | undefined)?.id) == null) return undefined;

    const currentIdx = config.VideoPlayer.List.findIndex(v => v.id == (config.VideoPlayer.Selected.Getter as ApiVideo | undefined)?.id);
    if ((currentIdx + 1) < config.VideoPlayer.List.length) return config.VideoPlayer.List[currentIdx + 1];
    return null;
  }, [
    config.VideoPlayer.Selected.Getter,
    config.Filters.Playlist.Getter,
    config.Filters.Tag.Getter,
    config.VideoPlayer.List,
  ]);

  const previousVideo = useMemo(() => {
    const ids: string[] = [config.Filters.Playlist.Getter?.id, config.Filters.Tag.Getter?.id].filter(x => x != undefined);
    if (ids.length != 1) return undefined;
    if (typeof config.VideoPlayer.Selected.Getter === 'string') return undefined
    if (config.VideoPlayer.List.find(x => x.id == (config.VideoPlayer.Selected.Getter as ApiVideo | undefined)?.id) == null) return undefined;

    const currentIdx = config.VideoPlayer.List.findIndex(v => v.id == (config.VideoPlayer.Selected.Getter as ApiVideo | undefined)?.id);
    if ((currentIdx - 1) >= 0) return config.VideoPlayer.List[currentIdx - 1];
    return null;
  }, [
    config.VideoPlayer.Selected.Getter,
    config.Filters.Playlist.Getter,
    config.Filters.Tag.Getter,
    config.VideoPlayer.List,
  ]);

  useEffect(() => {
    const video = document.querySelector<HTMLVideoElement>("video#video-stream");
    if (video == null) { return }
    let holdTimer: NodeJS.Timeout[] = [];
    const HOLD_TIMER_BEFORE_MOVING = 500; // 500ms
    const WAIT_AFTER_SCREENSHOT = 1000 * 1.5 // 2s;
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
            throw new Error("Not implemented");
            // if (nextVideo !== undefined && commands.VideoPlayer.Setter !== undefined) {
            //   commands.VideoPlayer.Setter(nextVideo);
            //   setTimeout(() => video.focus(), REFOCUS);
            // }
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
            throw new Error("Not implemented");
            // if (previousVideo !== undefined && commands.VideoPlayer.Setter !== undefined) {
            //   commands.VideoPlayer.Setter!(previousVideo);
            //   setTimeout(() => video.focus(), REFOCUS);
            // }
          }

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
  }, [config.VideoPlayer.Selected.Getter]);

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

  return (
    <VideoPlayer className={cn("overflow-hidden rounded-lg border max-w-200 mx-auto", className)} id="video-container">
      <VideoPlayerContent
        ref={refVideo}
        crossOrigin=""
        preload="auto"
        muted={false}
        slot="media"
        id="video-stream"
        src={
          config.VideoPlayer.Selected.Getter != undefined
            ? typeof config.VideoPlayer.Selected.Getter == "string"
              ? config.VideoPlayer.Selected.Getter
              : config.Api.Instance.GetStreamUrl(config.VideoPlayer.Selected.Getter)
            : ""
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


        {
          previousVideo !== undefined && <MediaChromeButton
            role="button"
            className="p-2.5"
            noTooltip
            disabled={previousVideo === null}
            onMouseEnter={() => setPreviousVideoLabelOpen(true)}
            onMouseLeave={() => setPreviousVideoLabelOpen(false)}
            onClick={() => {
              if (!!previousVideo) config.VideoPlayer.Selected.Setter(previousVideo);
            }}
          >
            <div className={cn(previousVideo === null ? 'text-primary/50 cursor-not-allowed' : 'text-primary cursor-pointer')} tabIndex={0} role="button" aria-label="Previous video in table">
              <ChevronsLeft />
            </div>
            <slot name="tooltip">
              <MediaTooltipReact
                part="tooltip"
                className="px-2 py-1"
                hidden={!previousVideoLabelOpen}
              >
                Previous video
                {
                  previousVideo === null
                    ? <></>
                    : <>:<br />{previousVideo.filename}</>
                }
              </MediaTooltipReact>
            </slot>
          </MediaChromeButton>
        }

        {
          config.VideoPlayer.Selected.Getter && isApiVideo(config.VideoPlayer.Selected.Getter) && <MediaChromeButton
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
                className="px-2 py-1"
                hidden={!currentVideoTitlteOpen}
              >
                {config.VideoPlayer.Selected.Getter?.filename}
              </MediaTooltipReact>
            </slot>
          </MediaChromeButton>
        }
        {
          nextVideo !== undefined && <MediaChromeButton
            role="button"
            className="p-2.5"
            noTooltip
            disabled={nextVideo === null}
            onMouseEnter={() => setNextVideoLabelOpen(true)}
            onMouseLeave={() => setNextVideoLabelOpen(false)}
            onClick={() => {
              if (!!nextVideo) config.VideoPlayer.Selected.Setter(nextVideo);
            }}
          >
            <div className={cn(nextVideo === null ? 'text-primary/50 cursor-not-allowed' : 'text-primary cursor-pointer')} tabIndex={0} role="button" aria-label="Next video in table">
              <ChevronsRight />
            </div>
            <slot name="tooltip">
              <MediaTooltipReact
                part="tooltip"
                className="px-2 py-1"
                hidden={!nextVideoLabelOpen}
              >
                Next video
                {
                  nextVideo === null
                    ? <></>
                    : <>:<br />{nextVideo.filename}</>
                }
              </MediaTooltipReact>
            </slot>
          </MediaChromeButton>
        }

        <VideoPlayerMuteButton />
        <VideoPlayerVolumeRange mediaVolume={0} />

        <MediaFullscreenButton className="p-2.5" />
      </VideoPlayerControlBar>

    </VideoPlayer>
  )
}