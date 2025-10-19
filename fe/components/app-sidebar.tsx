"use client"

import { useState, useEffect, useMemo } from 'react';
import type { ComponentProps } from 'react';
import { File, Link, Volume2, ChevronDown, AudioLines, RefreshCcw, RefreshCw, Settings } from "lucide-react";
import { useTheme } from 'next-themes';

import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenuBadge, SidebarMenuSub, SidebarRail } from "@/components/ui/sidebar";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

import { GetCommands } from "@/lib/commands";
import { Configs } from "@/lib/consts";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";




type Props = {
  commands: ReturnType<typeof GetCommands>
} & ComponentProps<typeof Sidebar>

export function AppSidebar({ commands, ...props }: Props) {
  const [openCollapsableMenu1, setOpenCollapsableMenu1] = useState(false);
  const [open, setOpen] = useState(false);

  const [resetAnimation, setResetAnimation] = useState(false);

  const [videoFromUrlDialog, setVideoFromUrlDialog] = useState(false);
  const [importVideoUrl, setImportVideoUrl] = useState<string>("");
  const importVideoUrlValid = useMemo<boolean>(() => {
    if (!importVideoUrl) return false;
    try { new URL(importVideoUrl); }
    catch { return false }
    return true;
  }, [importVideoUrl])

  async function SetVideoFromUrl(url: string) {
    commands.VideoPlayer.Commands.Video.Updates.Setter({
      customUrl: url,
      id: '', title: '',
      filePath: '',
      duration: -1, size: -1,
      attributes: { exists: true, watched: true },
    })
  }

  async function SetVideoFromFile(input: HTMLInputElement) {
    let files = input.files;
    if (!files) return;
    let file = files[0];
    console.log(file);
    let url = URL.createObjectURL(file);
    commands.VideoPlayer.Commands.Video.Updates.Setter({
      customUrl: url,
      id: '', title: file.name,
      filePath: '',
      duration: -1, size: -1,
      attributes: { exists: true, watched: true },
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

    if (typeof sidebarState == 'boolean' && sidebarState != commands.Configs.Commands.TriggerSideBar.Updates.Getter) {
      commands.Configs.Commands.TriggerSideBar.Updates.Setter(sidebarState)
    }

    commands.AudioContext.Commands.Limit.Updates?.Setter(Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]);
    const down = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        commands.Configs.Commands.Settings.Updates.Setter(!commands.Configs.Commands.Settings.Updates.Getter);
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, []);

  useEffect(() => {
    if (window !== undefined) {
      localStorage.setItem('sidebar-state', (commands.Configs.Commands.TriggerSideBar.Updates.Getter ? 1 : 0).toString());
    }
  }, [commands.Configs.Commands.TriggerSideBar.Updates.Getter])

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
                  setResetAnimation(true);
                  const url = new URL(Configs.ApiEndpoint);
                  url.pathname = '/api/v1/reload-data'
                  fetch(url)
                    .then(_ => location.reload())
                    .catch(console.error);
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
                onClick={() => { commands.AudioContext.Commands.EnableAudioContext.Callback() }}
                disabled={commands.AudioContext.Commands.EnableAudioContext.Updates?.Getter}
                className="hover:cursor-pointer disabled:cursor-not-allowed"
              >
                <Volume2 />
                Enable Audio Context
              </SidebarMenuButton>
            </SidebarMenu>
            {
              commands.AudioContext.Commands.EnableAudioContext.Updates?.Getter && <SidebarMenu>
                <Collapsible defaultOpen={openCollapsableMenu1} open={openCollapsableMenu1} onOpenChange={setOpenCollapsableMenu1} className="group/collapsible" disabled={!commands.AudioContext.Commands.EnableAudioContext.Updates?.Getter}>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <AudioLines />
                        Limit
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        <SidebarMenuBadge className="pr-8">{commands.AudioContext.Commands.Limit.Updates?.Getter || Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]}%</SidebarMenuBadge>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <RadioGroup defaultValue={`option-${Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]}`} value={`option-${commands.AudioContext.Commands.Limit.Updates?.Getter}`} onValueChange={(v) => {
                          const int = parseInt(v.split('-').at(-1)!);
                          commands.AudioContext.Commands.Limit.Updates?.Setter(int);
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
                    commands.Configs.Commands.Settings.Updates.Setter(!commands.Configs.Commands.Settings.Updates.Getter);
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
      <CommandDialog open={commands.Configs.Commands.Settings.Updates.Getter} onOpenChange={commands.Configs.Commands.Settings.Updates.Setter}>
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
      </CommandDialog>
    </>
  )
}
