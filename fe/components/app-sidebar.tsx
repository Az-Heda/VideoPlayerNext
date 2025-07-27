"use client"

import * as React from "react";
import { useState, useEffect } from 'react';
import { File, Link, Volume2, ChevronDown, AudioLines, RefreshCcw } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenuBadge, SidebarMenuSub, SidebarRail } from "@/components/ui/sidebar";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

import { Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { GetCommands } from "@/lib/commands";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Configs } from "@/lib/consts";
import { Label } from "@/components/ui/label";


type Props = {
  commands: ReturnType<typeof GetCommands>
} & React.ComponentProps<typeof Sidebar>

export function AppSidebar({ commands, ...props }: Props) {
  // const commands = GetCommands();
  const [openCollapsableMenu1, setOpenCollapsableMenu1] = useState(false);

  const [open, setOpen] = useState(false);
  useEffect(() => {
    commands.AudioContext.Commands.Limit.Updates?.Setter(Configs.VolumeLimits[Configs.VolumeLimitsDefaultIdx]);
    const down = (e: KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, []);
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup >
          <SidebarGroupLabel>Input</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuButton >
              <File />
              File
            </SidebarMenuButton >
            <SidebarMenuButton >
              <Link />
              Url
            </SidebarMenuButton >
            <SidebarMenuButton
              className="hover:cursor-pointer"
              onClick={() => {
                const url = new URL(Configs.ApiEndpoint);
                url.pathname = '/api/v1/reload-data'
                fetch(url)
                  .then(_ => location.reload())
                  .catch(console.error);
              }}
            >
              <RefreshCcw />
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
          <SidebarMenu>
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
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg" onClick={() => { setOpen(!open) }}>
                    <AvatarFallback className="rounded-lg"><Settings /></AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight" onClick={() => { setOpen(!open) }}>
                    Settings
                  </div>

                  <CommandDialog open={open} onOpenChange={setOpen}>
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

                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar >
  )
}
