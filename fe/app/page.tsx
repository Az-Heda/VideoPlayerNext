'use client';

import { AppSidebar } from "@/components/app-sidebar"
import { VideoTable } from "@/components/main-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Vp from "@/components/vp";
import { ApiRequest, ApiVideo } from "@/lib/api";
import { GetCommands } from "@/lib/commands"
import { Configs } from "@/lib/consts";
import { Volume2 } from "lucide-react"
import { useEffect, useState } from "react";

export default function Page() {
  const commands = GetCommands();
  const [videoData, setVideoData] = useState<ApiVideo | undefined>();
  const [data, setData] = useState<ApiVideo[]>();

  useEffect(() => {
    ApiRequest<ApiVideo>('GET', "/api/v1/videos", null, null).then((data) => {
      if (!data.error) {
        setData(data.results.sort((a: ApiVideo, b: ApiVideo): number => {
          if (a.filePath.includes(Configs.PriorityFolder) && !b.filePath.includes(Configs.PriorityFolder)) { return -1 }
          if (b.filePath.includes(Configs.PriorityFolder) && !a.filePath.includes(Configs.PriorityFolder)) { return 1 }
          return (a.filePath < b.filePath) ? -1 : 1;
        }));
      }
    })
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const params = {
        isAltPressed: e.altKey,
        isCtrlPressed: e.ctrlKey,
        isMetaPressed: e.metaKey,
        isShiftPressed: e.shiftKey,
      };
      for (const cmds of Object.values(commands).flat(1)) {
        for (const cmd of Object.values(cmds.Commands)) {
          if (cmd.ShortCut(e.key, params)) {
            e.preventDefault();
            cmd.Callback();
          }
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [
    commands.Configs.Commands.TriggerSideBar.Updates.Getter,
    commands.AudioContext.Commands.EnableAudioContext.Updates.Getter,
    commands.AudioContext.Commands.Limit.Updates.Getter,
  ]);

  return (
    <SidebarProvider
      open={commands.Configs.Commands.TriggerSideBar.Updates.Getter}
      onOpenChange={commands.Configs.Commands.TriggerSideBar.Callback}
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar commands={commands} />
      <SidebarInset >
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb >
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Homepage</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage
                  className={videoData !== undefined ? "hover:cursor-pointer" : ''}
                  onClick={() => setVideoData(undefined)}
                >
                  Video Player
                </BreadcrumbPage>
              </BreadcrumbItem>
              {videoData != undefined && <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{videoData.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {
            commands.AudioContext.Commands.EnableAudioContext.Updates?.Getter && <Alert variant="default">
              <Volume2 />
              <AlertTitle>Audio Context</AlertTitle>
              <AlertDescription>
                Audio context is enabled with a {commands.AudioContext.Commands.Limit.Updates.Getter}% boost
              </AlertDescription>
            </Alert>
          }
          {videoData != undefined && <Vp getter={videoData} setter={setVideoData} allData={data} allDataSetter={setData} commands={commands} />}
          {data != undefined && <VideoTable data={data} videoData={videoData} videoSetter={setVideoData} />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
