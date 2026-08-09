'use client';

import { AppSidebar } from "@/components/app-sidebar"
import { KeybindDialog } from "@/components/key-binds";
import { VideoTable } from "@/components/main-table";
import { ThemeSelector } from "@/components/theme-selector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Vp from "@/components/video-player";
import { ApiRequest, ApiVideo } from "@/lib/api";
import { EnableCommandTriggers, GetCommands, GetCommands2 } from "@/lib/commands"
import { Config } from "@/lib/config";
import { Configs } from "@/lib/consts";
import { Volume2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react";

export default function Page() {
  const commands = GetCommands2();
  const [data, setData] = useState<ApiVideo[]>();


  //! ----------------------------------------------------------------------------------------- !//

  // const [themeSelectorModalOpen, setThemeSelectorModalOpen] = useState<boolean>(false);
  // const [keyBindsModal, setKeyBindsModal] = useState<boolean>(true);
  // const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  //! ----------------------------------------------------------------------------------------- !//

  // function ResetModals() {
  //   setThemeSelectorModalOpen(false);
  //   setKeyBindsModal(false);
  // }

  // const [kb, setKb] = useState<KeyEntity<any>[]>((): KeyEntity<any>[] => {
  //   return [
  //     {
  //       Id: Config.Defaults.KeyboardShortcuts.ThemeSelector.Id,
  //       Label: 'Theme selector',
  //       Icon: Config.Icons.ThemeSelector,
  //       DefaultStorage: Config.Defaults.KeyboardShortcuts.ThemeSelector,
  //       Kind: KeyKinds.CBGetterSetter,
  //       Getter: themeSelectorModalOpen,
  //       Setter: setThemeSelectorModalOpen,
  //       Callback(g, s) {
  //         ResetModals();
  //         s(!g);
  //       },
  //     } as KeyEntity<boolean>,
  //     {
  //       Id: Config.Defaults.KeyboardShortcuts.KeyboardShortcuts.Id,
  //       Label: 'Keyboard shortcuts',
  //       Icon: Config.Icons.KeyBinds,
  //       DefaultStorage: Config.Defaults.KeyboardShortcuts.KeyboardShortcuts,
  //       Kind: KeyKinds.CBGetterSetter,
  //       Getter: keyBindsModal,
  //       Setter: setKeyBindsModal,
  //       Callback(g, s) {
  //         ResetModals();
  //         s(!g);
  //       },
  //     } as KeyEntity<boolean>,
  //     {
  //       Id: Config.Defaults.KeyboardShortcuts.TriggerSidebar.Id,
  //       Label: 'Show/Hide Sidebar',
  //       Icon: Config.Icons.Sidebar,
  //       DefaultStorage: Config.Defaults.KeyboardShortcuts.TriggerSidebar,
  //       Kind: KeyKinds.GetterSetter,
  //       Getter: sidebarOpen,
  //       Setter: setSidebarOpen,
  //     } as KeyEntity<boolean>
  //   ]
  // })

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    function FetchData() {
      Config.Api.Handler.Get_ApiV1PVideos()
        .then((data) => {
          setData(data.sort((a: ApiVideo, b: ApiVideo): number => {
            if (a.filePath.includes(Configs.PriorityFolder) && !b.filePath.includes(Configs.PriorityFolder)) { return -1 }
            if (b.filePath.includes(Configs.PriorityFolder) && !a.filePath.includes(Configs.PriorityFolder)) { return 1 }
            return (a.filePath < b.filePath) ? -1 : 1;
          }));
          
          setTimeout(() => {
            // const status = commands.Utility.Commands.ReloadDataStatus.Updates.Getter;
            const status = commands.ReloadData.Getter;
            if (typeof status == 'boolean' && status) {
              // if (commands.Utility.Commands.ReloadDataOpenModal.Updates.Getter) {
              //   commands.Utility.Commands.ReloadDataOpenModal.Updates.Setter(false);
              //   commands.Utility.Commands.ReloadDataStatus.Updates.Setter(undefined);
              // }
              if (commands.ReloadData.Getter) {
                commands.ReloadData.Setter(false);
                commands.ReloadDataStatus.Setter!(undefined);
              }
            }
          }, 1000 * 5)
        })
        .catch(console.error)
    }

    FetchData()
    intervalId = setInterval(FetchData, 1000 * 60 * 10);

    return () => clearInterval(intervalId);
  }, [commands.ReloadDataStatus.Getter]);

  EnableCommandTriggers(commands);
  useEffect(() => {
    // const down = (e: KeyboardEvent) => {
    //   const params = {
    //     isAltPressed: e.altKey,
    //     isCtrlPressed: e.ctrlKey,
    //     isMetaPressed: e.metaKey,
    //     isShiftPressed: e.shiftKey,
    //   };
    //   for (const cmds of Object.values(commands).flat(1)) {
    //     for (const cmd of Object.values(cmds.Commands)) {
    //       if (cmd.ShortCut === undefined) continue;
    //       if (cmd.ShortCut(e.key, params)) {
    //         e.preventDefault();
    //         cmd.Callback();
    //       }
    //     }
    //   }
    // }

    // document.addEventListener("keydown", down)
    // return () => document.removeEventListener("keydown", down)
  }, [
    commands.SidebarTrigger.Getter,
    commands.AudioContext.Getter,
    commands.AudioContextLimits.Getter,
    // commands.Configs.Commands.TriggerSideBar.Updates.Getter,
    // commands.AudioContext.Commands.EnableAudioContext.Updates.Getter,
    // commands.AudioContext.Commands.Limit.Updates.Getter,
  ]);

  // const commandInputName = "command-input"

  // const commands: { [key: string]: typeof kb } = useMemo(() => {
  //   return {
  //     ...Object.fromEntries(Object.entries(Config.Defaults.CommandsSections).map(i => {
  //       return [i[0], kb.filter(k => i[1].includes(k.Id))]
  //     })),
  //     Others: Object.values(kb).filter(i => !Object.values(Config.Defaults.CommandsSections).flat().includes(i.Id))
  //   };
  // }, [kb])

  // useEffect(() => {
  //   const down = (e: KeyboardEvent) => {
  //     if ((e.target as HTMLElement).tagName == 'INPUT' && (e.target as HTMLInputElement).name != commandInputName) return;

  //     for (const cmd of Object.values(commands).flat()) {
  //       const stor = cmd.CustomStorage ?? cmd.DefaultStorage;
  //       if (stor == undefined) continue;
  //       if (stor.Key == undefined) continue;
  //       const conditions: boolean[] = [
  //         e.key.toUpperCase() == stor.Key.toUpperCase(),
  //         e.ctrlKey == (!!stor.Ctrl),
  //         e.shiftKey == (!!stor.Shift),
  //         e.altKey == (!!stor.Alt),
  //         e.metaKey == (!!stor.Meta),
  //       ];

  //       if (conditions.every(Boolean)) {
  //         e.preventDefault();
  //         const cb = GetKeyCallback(cmd);
  //         if (cb !== undefined) cb();
  //         return;
  //       }
  //     }

  //   }
  //   document.addEventListener('keydown', down);
  //   return () => document.removeEventListener('keydown', down);
  // }, [commands])

  return (
    <SidebarProvider
      // open={sidebarOpen}
      // onOpenChange={setSidebarOpen}
      open={commands.SidebarTrigger.Getter}
      onOpenChange={commands.SidebarTrigger.Setter}
      style={
        {
          "--sidebar-width": "250px",
        } as React.CSSProperties
      }
    >
      <AppSidebar commands={commands} />
      <SidebarInset >
        <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4 z-1">
          <SidebarTrigger className="-ml-1 cursor-pointer" />
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
                  className={commands.VideoPlayer.Getter !== undefined ? "hover:cursor-pointer" : ''}
                  onClick={() => commands.VideoPlayer.Setter!(undefined)}
                >
                  Video Player
                </BreadcrumbPage>
              </BreadcrumbItem>
              {commands.VideoPlayer.Getter != undefined && <>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{commands.VideoPlayer.Getter.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </>}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">

          <ThemeSelector
            getter={commands.ThemeSelector.Getter!}
            setter={commands.ThemeSelector.Setter!}
            {...Config.Defaults.ThemeSelector}
          />



          {/* <Dialog open={keyBindsModal} onOpenChange={setKeyBindsModal}>
            <DialogTrigger></DialogTrigger>
            <DialogContent className="min-md:!max-w-175">
              <DialogHeader>
                <DialogTitle>Keyboard shortcuts</DialogTitle>
                <DialogDescription>
                  This is the list of all keyboard shortcuts for this application, you can even customize them as you like.
                  <br /><br />
                  <span className="text-destructive">Caution: You can even overwrite some of the browser one, be careful</span>
                </DialogDescription>
              </DialogHeader>
              <KeyBinds
                Getter={kb}
                Setter={setKb}
                LocalStorageKey={Config.LocalStorageKeys.KeyBinds}
                Pagination={false}
                EditIcon={Config.Icons.KeyBindsEdit}
                ResetIcon={Config.Icons.KeyBindsReset}
                DeleteIcon={Config.Icons.KeyBindsDelete}
              />
            </DialogContent>
          </Dialog> */}

          {
            commands.AudioContext.Getter && <Alert variant="default">
              <Volume2 />
              <AlertTitle>Audio Context</AlertTitle>
              <AlertDescription>
                Audio context is enabled with a {commands.AudioContextLimits.Getter}% boost
              </AlertDescription>
            </Alert>
          }
          {commands.VideoPlayer.Getter != undefined && <Vp allData={data} allDataSetter={setData} commands={commands} />}
          {data != undefined && <VideoTable data={data} setData={setData} videoData={commands.VideoPlayer.Getter} videoSetter={commands.VideoPlayer.Setter!} />}
          
          <Dialog open={commands.KeyboardShortcuts.Getter} onOpenChange={commands.KeyboardShortcuts.Setter}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Keyboard shortcuts</DialogTitle>
                <DialogDescription>Here you can view/set/remove your keyboard shortcuts</DialogDescription>
                <KeybindDialog commands={commands} order="asc" />
              </DialogHeader>
            </DialogContent>
          </Dialog>

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
