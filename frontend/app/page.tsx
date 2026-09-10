"use client";

import { ModalApplyAutomaticRules, ModalAudioContext, ModalImportFromFile, ModalImportFromUrl, ModalKeybinds, ModalSettings, ModalSyncData, ModalSyncVideos, ModalThemeSelector, PlaylistSelector, TagSelector } from "@/components/modals";
import { Explore } from "@/components/explore";
import { AppSidebar } from "@/components/sidebar"
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment";
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ShowIf, Typography } from "@/components/utility";
import { Vp } from "@/components/video-player";
import { MainvideoTable } from "@/components/video-table";
import { ApiPlaylist, ApiRequest, ApiVideo } from "@/lib/api";
import { GlobalConfig } from "@/lib/globals"
import { ArrowUpRightIcon, File, Film, Hash } from "lucide-react";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";

export default function Page() {
  // const [videos, setVideos] = useState<ApiVideo[]>();
  // const [playlists, setPlaylists] = useState<ApiPlaylist[]>();
  const api = new ApiRequest();
  let config = GlobalConfig(api);

  useEffect(() => {
    api.addGlobalConfigs(config);
    api.GetFolderList().then(config.Api.Data.Folders.Setter);
    api.GetVideoList().then((data) => {
      config.Api.Data.Videos.Setter(data);
      api.GetPlaylistList().then(config.Api.Data.Playlists.Setter);
      api.GetTagList().then(config.Api.Data.Tags.Setter);
    });
  }, [])
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }>
      <AppSidebar
        Config={config}
        SidebarProps={{ variant: "inset" }}
      />
      <SidebarInset>
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">{config.Sidebar.Title.Getter}</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:py-6">

              {config.VideoPlayer.Selected.Getter != undefined && (
                <div className="grid min-h-0 h-[50vh] grid-cols-4">
                  <Typography kind="h2" className="col-span-4 text-center">{config.VideoPlayer.Selected.Getter.filename}</Typography>
                  <div></div>
                  <Vp config={config} className="col-span-2" />

                  {
                    false && (config.Api.Data.Playlists.Getter ?? []).filter(p => (config.VideoPlayer.Selected.Getter?.playlists ?? []).map(x => x.id).includes(p.id)).length > 0
                      ? <>
                        <ScrollArea className="min-h-0 border border-primary rounded-md px-4">
                          <Typography kind="h3" className="mt-4 mb-2 text-center">Playlists</Typography>
                          <div className="flex flex-col gap-2">
                            {
                              (config.Api.Data.Playlists.Getter ?? []).filter(p => (config.VideoPlayer.Selected.Getter?.playlists ?? []).map(x => x.id).includes(p.id)).map(p => (
                                <Attachment key={p.id} className="w-full">
                                  <AttachmentMedia>
                                    <Film />
                                  </AttachmentMedia>
                                  <AttachmentContent>
                                    <AttachmentTitle className="overflow-x-clip text-ellipsis">{p.name}</AttachmentTitle>
                                    <AttachmentDescription>{config.Api.Data.Videos.Getter?.filter(x => x.playlists?.map(x => x.id).includes(p.id)).length} videos</AttachmentDescription>
                                  </AttachmentContent>
                                  <AttachmentActions>
                                    <AttachmentAction asChild className="size-auto">
                                      <Button
                                        onClick={() => { config.Filters.Playlist.Setter(p) }}
                                      >
                                        Filter
                                      </Button>
                                    </AttachmentAction>
                                  </AttachmentActions>

                                </Attachment>
                              ))
                            }
                          </div>
                          <Typography kind="h3" className="mt-4 mb-2 text-center">Tags</Typography>
                          <div className="flex flex-col gap-2">
                            {
                              (config.Api.Data.Tags.Getter ?? []).filter(p => (config.VideoPlayer.Selected.Getter?.tags ?? []).map(x => x.id).includes(p.id)).map(p => (
                                <Attachment key={p.id} className="w-full">
                                  <AttachmentMedia>
                                    <Hash />
                                  </AttachmentMedia>
                                  <AttachmentContent>
                                    <AttachmentTitle>{p.name}</AttachmentTitle>
                                    <AttachmentDescription>{config.Api.Data.Videos.Getter?.filter(x => x.tags?.map(x => x.id).includes(p.id)).length} videos</AttachmentDescription>
                                  </AttachmentContent>
                                  <AttachmentActions>
                                    <AttachmentAction asChild className="size-auto">
                                      <Button
                                        onClick={() => { config.Filters.Tag.Setter(p) }}
                                      >
                                        Filter
                                      </Button>
                                    </AttachmentAction>
                                  </AttachmentActions>

                                </Attachment>
                              ))
                            }
                          </div>
                        </ScrollArea>
                      </>
                      : <div></div>
                  }

                </div>
              )}
              <Explore config={config} />
            </div>

          </div>
        </div>
        <ModalImportFromFile Config={config} />
        <ModalImportFromUrl Config={config} />
        <ModalAudioContext Config={config} />
        <ModalThemeSelector Config={config} />
        <ModalKeybinds Config={config} />
        <ModalSettings Config={config} />
        <ModalSyncVideos Config={config} />
        <ModalApplyAutomaticRules Config={config} />
        <ModalSyncData Config={config} />

        <PlaylistSelector Config={config} />
        <TagSelector Config={config} />

      </SidebarInset>
    </ SidebarProvider >
  )
}
