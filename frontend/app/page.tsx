"use client";

import { ErrorModal, ModalApplyAutomaticRules, ModalAudioContext, ModalImportFromFile, ModalImportFromUrl, ModalKeybinds, ModalSettings, ModalSyncData, ModalSyncVideos, ModalThemeSelector, PlaylistSelector, TagSelector } from "@/components/modals";
import { Explore } from "@/components/explore";
import { AppSidebar } from "@/components/sidebar";
import { Attachment, AttachmentAction, AttachmentActions, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Typography } from "@/components/utility";
import { Vp } from "@/components/video-player";
import { ApiRequest } from "@/lib/api";
import { GlobalConfig, GlobalConfigType } from "@/lib/globals";
import { Film, Hash } from "lucide-react";
import { useEffect } from "react";
import { Hero } from "@/components/hero";
import { SystemLogTable } from "@/components/systemlog-table";

export default function Page() {
  const api = new ApiRequest();
  let config = GlobalConfig(api);

  useEffect(() => {
    api.addGlobalConfigs(config);
    api.GetFolderList()
      .then(
        (folders) => config.Api.Data.Folders.Setter(folders),
        (error) => config.Errors.Setter(errs => [...errs, error]),
      );

    api.GetVideoList()
      .then(
        (data) => {
          config.Api.Data.Videos.Setter(data);
          api.GetPlaylistList()
            .then(
              (playlists) => config.Api.Data.Playlists.Setter(playlists),
              (error) => config.Errors.Setter(errs => [...errs, error]),

            );
          api.GetTagList()
            .then(
              (tags) => config.Api.Data.Tags.Setter(tags),
              (error) => config.Errors.Setter(errs => [...errs, error]),

            );
          api.GetRuleList()
            .then(
              (rules) => config.Api.Data.Rules.Setter(rules),
              (error) => config.Errors.Setter(errs => [...errs, error]),
            );
          api.GetSystemLogList()
            .then(
              (systemLogs) => config.Api.Data.SystemLogs.Setter(systemLogs),
              (error) => config.Errors.Setter(errs => [...errs, error]),
            );
        },
        (error) => config.Errors.Setter(errs => [...errs, error]),
      );
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

              <PageContent Config={config} />
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
        <ErrorModal Config={config} />

        <PlaylistSelector Config={config} />
        <TagSelector Config={config} />

      </SidebarInset>
    </ SidebarProvider >
  )
}


type PageContentProps = {
  Config: GlobalConfigType;
}
function PageContent(props: PageContentProps) {
  switch (props.Config.Pages.Current.Getter) {
    case 'homepage':
      return <>
        <Hero Config={props.Config} />
      </>
    case 'videos':
      return <>
        {props.Config.VideoPlayer.Selected.Getter != undefined && (
          <div className="grid min-h-0 h-[50vh] grid-cols-4">
            <Typography kind="h2" className="col-span-4 text-center">{props.Config.VideoPlayer.Selected.Getter.filename}</Typography>
            <div></div>
            <Vp config={props.Config} className="col-span-2" />

            {
              false && (props.Config.Api.Data.Playlists.Getter ?? []).filter(p => (props.Config.VideoPlayer.Selected.Getter?.playlists ?? []).map(x => x.id).includes(p.id)).length > 0
                ? <>
                  <ScrollArea className="min-h-0 border border-primary rounded-md px-4">
                    <Typography kind="h3" className="mt-4 mb-2 text-center">Playlists</Typography>
                    <div className="flex flex-col gap-2">
                      {
                        (props.Config.Api.Data.Playlists.Getter ?? []).filter(p => (props.Config.VideoPlayer.Selected.Getter?.playlists ?? []).map(x => x.id).includes(p.id)).map(p => (
                          <Attachment key={p.id} className="w-full">
                            <AttachmentMedia>
                              <Film />
                            </AttachmentMedia>
                            <AttachmentContent>
                              <AttachmentTitle className="overflow-x-clip text-ellipsis">{p.name}</AttachmentTitle>
                              <AttachmentDescription>{props.Config.Api.Data.Videos.Getter?.filter(x => x.playlists?.map(x => x.id).includes(p.id)).length} videos</AttachmentDescription>
                            </AttachmentContent>
                            <AttachmentActions>
                              <AttachmentAction asChild className="size-auto">
                                <Button
                                  onClick={() => { props.Config.Filters.Playlist.Setter(p) }}
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
                        (props.Config.Api.Data.Tags.Getter ?? []).filter(p => (props.Config.VideoPlayer.Selected.Getter?.tags ?? []).map(x => x.id).includes(p.id)).map(p => (
                          <Attachment key={p.id} className="w-full">
                            <AttachmentMedia>
                              <Hash />
                            </AttachmentMedia>
                            <AttachmentContent>
                              <AttachmentTitle>{p.name}</AttachmentTitle>
                              <AttachmentDescription>{props.Config.Api.Data.Videos.Getter?.filter(x => x.tags?.map(x => x.id).includes(p.id)).length} videos</AttachmentDescription>
                            </AttachmentContent>
                            <AttachmentActions>
                              <AttachmentAction asChild className="size-auto">
                                <Button
                                  onClick={() => { props.Config.Filters.Tag.Setter(p) }}
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
        <Explore config={props.Config} />
      </>
    case 'systemlogs':
      return <>
        <SystemLogTable Config={props.Config} />
      </>
    default:
      return <>Page not found</>
  }
}