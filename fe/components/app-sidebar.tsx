"use client"

import { useState, useEffect, useMemo } from 'react';
import type { ComponentProps } from 'react';
import { File, Link, Volume2, ChevronDown, AudioLines, RefreshCcw, RefreshCw, Settings, X, Check } from "lucide-react";
import { useTheme } from 'next-themes';

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenuBadge, SidebarMenuSub, SidebarRail } from "@/components/ui/sidebar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

import { CallCallback, GetCommands, GetCommands2, GetGroups } from "@/lib/commands";
import { Configs } from "@/lib/consts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Config } from '@/lib/config';
import { Spinner } from './ui/spinner';
import { KeyKeyboard } from './key-binds';




type Props = {
  commands: ReturnType<typeof GetCommands2>
} & ComponentProps<typeof Sidebar>

export function AppSidebar({ commands, ...props }: Props) {
  const [openCollapsableMenu1, setOpenCollapsableMenu1] = useState(false);

  const resetAnimation = useMemo(() => {
    if (['string', 'boolean'].includes(typeof commands.ReloadDataStatus.Getter)) return false;
    if (commands.ReloadData.Getter) return true;
    return false;
  }, [commands.ReloadData.Getter, commands.ReloadDataStatus.Getter])

  const [videoFromUrlDialog, setVideoFromUrlDialog] = useState(false);
  const [importVideoUrl, setImportVideoUrl] = useState<string>("");
  const importVideoUrlValid = useMemo<boolean>(() => {
    if (!importVideoUrl) return false;
    try { new URL(importVideoUrl); }
    catch { return false }
    return true;
  }, [importVideoUrl])

  async function SetVideoFromUrl(url: string) {
    commands.VideoPlayer.Setter!({
      customUrl: url,
      id: '', title: '',
      filePath: '',
      duration: -1, size: -1,
      attributes: { exists: true, watched: true, favorite: false },
    })
  }

  async function SetVideoFromFile(input: HTMLInputElement) {
    let files = input.files;
    if (!files) return;
    let file = files[0];
    console.log(file);
    let url = URL.createObjectURL(file);
    commands.VideoPlayer.Setter!({
      customUrl: url,
      id: '', title: file.name,
      filePath: '',
      duration: -1, size: -1,
      attributes: { exists: true, watched: true, favorite: false },
    })
  }

  useEffect(() => {
    let sidebarState: boolean | null = null;
    if (window !== undefined) {
      const itemsPerPage = localStorage.getItem('sidebar-state');
      if (itemsPerPage !== null && !isNaN(+itemsPerPage)) {
        sidebarState = +itemsPerPage == 1;
      }
    }

    if (typeof sidebarState == 'boolean' && sidebarState != commands.SidebarTrigger.Getter) {
      commands.SidebarTrigger.Setter!(sidebarState)
    }

    commands.AudioContextLimits.Setter!(Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]);
    const down = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        commands.Settings.Setter!(!commands.Settings.Getter);
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, []);

  useEffect(() => {
    if (window !== undefined) {
      localStorage.setItem('sidebar-state', (commands.SidebarTrigger.Getter ? 1 : 0).toString());
    }
  }, [commands.SidebarTrigger.Getter]);

  const groups = GetGroups();
  const groupedCommands = useMemo(() => {
    const getCommandsFromIds = (...ids: (keyof typeof commands)[]) => {
      const out = [];
      for (const id of ids) {
        out.push(commands[id]);
      }
      return out;
    }
    const otherKey = 'Others';
    const output: { [key: string]: (typeof commands[keyof typeof commands])[] } = {};
    let allKeys = Object.keys(commands) as (keyof typeof commands)[];
    for (const k of Object.keys(groups)) {
      if (Object.keys(output).includes(k)) {
        output[k].push(...getCommandsFromIds(...groups[k]));
        allKeys = allKeys.filter(a => !groups[k].includes(a));
      }
      else {
        output[k] = getCommandsFromIds(...groups[k]);
        allKeys = allKeys.filter(a => !groups[k].includes(a));
      }
    }
    if (allKeys.length > 0) {
      output[otherKey] = getCommandsFromIds(...allKeys);
    }
    return output;
  }, [commands, groups]);

  return (
    <>
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          <Dialog open={videoFromUrlDialog} onOpenChange={setVideoFromUrlDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>View video from link</DialogTitle>
                <DialogDescription>
                  Import video from link<br />
                  [Note]: Audio Context doesn't work for videos imported from url
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="link" className="sr-only">
                    Link
                  </Label>
                  <Input
                    id="video-from-url"
                    autoFocus
                    autoComplete="off"
                    placeholder="https://www.example.com"
                    value={importVideoUrl}
                    onChange={(e) => setImportVideoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key.toUpperCase() == 'ENTER') {
                        if (importVideoUrlValid) SetVideoFromUrl(importVideoUrl);
                        setVideoFromUrlDialog(false)
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter className="justify-end">
                <Button type="button" variant="secondary" onClick={(() => setVideoFromUrlDialog(false))}>
                  Cancel
                </Button>
                <Button type="button" variant="default" disabled={!importVideoUrlValid} onClick={() => {
                  if (importVideoUrlValid) SetVideoFromUrl(importVideoUrl);
                  setVideoFromUrlDialog(false)
                }}>
                  Confirm
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup >
            <SidebarGroupLabel>Input</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuButton className="hover:cursor-pointer" onClick={() => {
                const input = document.querySelector<HTMLInputElement>('input#video-from-file[type="file"]');
                if (!input) return;
                input.click();
              }}>
                <File />
                File
                <Input
                  id="video-from-file"
                  type="file"
                  accept="video/mp4"
                  onChange={(e) => SetVideoFromFile(e.target)}
                  hidden
                />
              </SidebarMenuButton >
              <SidebarMenuButton className="hover:cursor-pointer" onClick={() => setVideoFromUrlDialog(true)}>
                <Link />
                Url
              </SidebarMenuButton >
              <SidebarMenuButton
                className="hover:cursor-pointer"
                onClick={() => {
                  commands.ReloadData.Setter!(true)
                }}
              >
                <RefreshCw className={resetAnimation ? "animate-spin" : ''} />
                Reload data
              </SidebarMenuButton >
            </SidebarMenu>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Audio Context</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuButton
                onClick={() => CallCallback(commands.AudioContext)}
                disabled={commands.AudioContext.Getter}
                className="hover:cursor-pointer disabled:cursor-not-allowed"
              >
                <Volume2 />
                Enable Audio Context
              </SidebarMenuButton>
            </SidebarMenu>
            {
              commands.AudioContext.Getter && <SidebarMenu>
                <Collapsible defaultOpen={openCollapsableMenu1} open={openCollapsableMenu1} onOpenChange={setOpenCollapsableMenu1} className="group/collapsible" disabled={!commands.AudioContext.Getter}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <AudioLines />
                        Limit
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        <SidebarMenuBadge className="pr-8">{commands.AudioContextLimits.Getter || Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]}%</SidebarMenuBadge>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <RadioGroup defaultValue={`option-${Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]}`} value={`option-${commands.AudioContextLimits.Getter}`} onValueChange={(v) => {
                          const int = parseInt(v.split('-').at(-1)!);
                          commands.AudioContextLimits.Setter!(int);
                          setOpenCollapsableMenu1(false);
                        }}>
                          {Configs.VolumeLimits.map(i => (
                            <div className="flex items-center space-x-2 w-full" key={`key-volume-limit-${i}`}>
                              <RadioGroupItem value={`option-${i}`} id={`option-${i}`} />
                              <Label htmlFor={`option-${i}`} className="grow hover:cursor-pointer">{i}%</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            }
          </SidebarGroup>
          {/* <SidebarGroup >
          <SidebarGroupLabel>Pages</SidebarGroupLabel>
          <SidebarMenu>
            {commands.Configs.Commands.Navigation.Updates.Getter.map(p => (
              <SidebarMenuButton key={`page-${p.id}`} className="hover:cursor-pointer" asChild>
                <a href={p.url}>{p.title}</a>
              </SidebarMenuButton >
            ))}
          </SidebarMenu>
        </SidebarGroup> */}
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton className="hover:cursor-pointer" onClick={() => {
                    commands.Settings.Setter!(!commands.Settings.Getter);
                  }}>
                    <Settings />
                    Settings
                  </SidebarMenuButton >
                  {/* <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    onClick={() => {
                      
                    }}
                  >
                    <Settings />
                    { commands.Configs.Commands.TriggerSideBar.Updates.Getter && <span>Settings</span>}
                  </SidebarMenuButton> */}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar >
      {/* <CommandDialog
        open={commands.Settings.Getter}
        onOpenChange={commands.Settings.Setter}
      >
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {
            Object.entries(commands).map(([group, value]) => (
              value.Visible && <CommandGroup heading={value.Label} key={`command-${group}`}>
                {
                  Object.values(value.Commands).filter(i => i.Visible).map(c => (
                    <CommandItem key={`command-${group}-${c.Name}`} >
                      {c.Icon}
                      <Button variant="ghost" className="w-full pr-6 text-left" onClick={() => c.Callback()} disabled={c.Enabled != undefined && !c.Enabled}>
                        {c.Name}
                        <CommandShortcut>{c.ShortCutHint ?? ''}</CommandShortcut>
                      </Button>
                    </CommandItem>
                  ))
                }
              </CommandGroup>
            ))
          }
        </CommandList>
      </CommandDialog> */}

      <CommandDialog open={commands.Settings.Getter} onOpenChange={() => CallCallback(commands.Settings)}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {
            Object.entries(groupedCommands).map(([group, cmd]) => (
              <CommandGroup heading={group} key={`command-${group}`}>
                {cmd.filter(c => c.Visible).map(c => (
                  <CommandItem key={`cmd-${group}-${c.Id}`}>
                    {c.Icon}
                    <Button variant="ghost" className="w-full pr-6 text-left" onClick={() => CallCallback(c)}>
                      {c.Label}
                      <CommandShortcut>
                        {c.HasKeybind && <KeyKeyboard {...(c.CustomStorage ?? c.DefaultStorage)} />}
                      </CommandShortcut>
                    </Button>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          }
        </CommandList>
      </CommandDialog>


      <DataReloader commands={commands} />
    </>
  )
}



function DataReloader({ commands }: { commands: ReturnType<typeof GetCommands2> }) {
  useEffect(() => {
    if (!commands.ReloadData.Getter) return;
    Config.Api.Handler.Get_ApiV1ReloadData()
      .then(x => { commands.ReloadDataStatus.Setter!(x) })
      .catch(err => commands.ReloadDataStatus.Setter!(err))
  }, [commands.ReloadData.Getter])

  return (
    <Dialog
      open={commands.ReloadData.Getter}
      onOpenChange={commands.ReloadData.Setter}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reloading data</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        {commands.ReloadDataStatus.Getter == undefined && (
          <div className="flex items-center gap-3">
            <Spinner />
            <div className="col-span-3">The server is reloading the data...</div>
          </div>
        )}
        {typeof commands.ReloadData.Getter == 'string' && (
          <div className="flex items-center gap-3">
            <X className="text-destructive" />
            <div className="col-span-3">{commands.ReloadDataStatus.Getter}</div>
          </div>
        )}
        {typeof commands.ReloadDataStatus.Getter == 'boolean' && (
          <div className="flex items-center gap-3">
            {
              commands.ReloadDataStatus.Getter
                ? <Check className="text-emerald-500" />
                : <X className="text-destructive" />
            }
            <div className="col-span-3">{
              commands.ReloadDataStatus.Getter
                ? 'Data updated correctly'
                : 'Cannot update data'
            }</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}