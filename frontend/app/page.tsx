"use client";

import { ErrorModal, ModalApplyAutomaticRules, ModalAudioContext, ModalImportFromFile, ModalImportFromUrl, ModalKeybinds, ModalSettings, ModalSyncData, ModalSyncVideos, ModalThemeSelector, PlaylistSelector, TagSelector } from "@/components/modals";
import { Explore } from "@/components/explore";
import { AppSidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Typography } from "@/components/utility";
import { Vp } from "@/components/video-player";
import { ApiRequest } from "@/lib/api";
import { GlobalConfig, GlobalConfigType } from "@/lib/globals";
import { useEffect } from "react";
import { Hero } from "@/components/hero";
import { SystemLogTable } from "@/components/table-systemlog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ThinkingOrb } from 'thinking-orbs';
import { AutomaticRulesTable } from "@/components/table-rule";

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
        (data) => config.Api.Data.Videos.Setter(data),
        (error) => config.Errors.Setter(errs => [...errs, error]),
      );
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
    api.GetRuleList({ preloadPlaylist: true, preloadTags: true })
      .then(
        (rules) => config.Api.Data.Rules.Setter(rules),
        (error) => config.Errors.Setter(errs => [...errs, error]),
      );
    api.GetSystemLogList()
      .then(
        (systemLogs) => config.Api.Data.SystemLogs.Setter(systemLogs),
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
  useEffect(() => { props.Config.Pages.Current.Setter('homepage') }, [])
  switch (props.Config.Pages.Current.Getter) {
    case undefined:
    case 'homepage':
      return <>
        <Hero Config={props.Config} />
      </>
    case 'videos':
      return <>
        {props.Config.VideoPlayer.Selected.Getter != undefined && (
          <div className="grid min-h-0 h-[50vh] grid-cols-4">
            <Typography kind="h2" className="col-span-4 text-center">{typeof props.Config.VideoPlayer.Selected.Getter === 'string' ? '' : props.Config.VideoPlayer.Selected.Getter.filename}</Typography>
            <div></div>
            <Vp config={props.Config} className="col-span-2" />
          </div>
        )}
        {
          props.Config.Api.Data.Videos.Getter
            ? <Explore config={props.Config} />
            : <Empty>
              <EmptyHeader>
                <ThinkingOrb
                  state="connecting"
                  size={64}
                  speed={2}
                />
                <EmptyTitle>Loading videos</EmptyTitle>
                <EmptyDescription>
                  All videos are currently being loaded.<br />
                  Please wait
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
        }
      </>
    case 'systemlogs':
      return <>
        <SystemLogTable Config={props.Config} />
      </>
    case 'rules':
      return <>
        <AutomaticRulesTable Config={props.Config} />
      </>
    default:
      return <>Page not found</>
  }
}