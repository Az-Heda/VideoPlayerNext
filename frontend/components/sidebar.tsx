"use client";

import { ComponentProps } from "react"
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { CirclePlusIcon, CommandIcon, Film, MailIcon } from "lucide-react"
import { GlobalConfigType, SidebarItem } from "@/lib/globals"
import { Button } from "@/components/ui/button";


type AppSidebarProps = {
  Config: GlobalConfigType;
  SidebarProps: ComponentProps<typeof Sidebar>;
}

export function AppSidebar(props: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props.SidebarProps}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                {props.Config.Sidebar.Title.Icon}
                <span className="text-base font-semibold">{props.Config.Sidebar.Title.Title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>

        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              {Object.values(props.Config.Sidebar.Top).filter(x => x.Visibility ?? true).map((rawItem) => {
                const item = rawItem as any as SidebarItem<unknown>;
                return (
                  <SidebarMenuItem key={item.Title}>
                    <SidebarMenuButton
                      tooltip={item.Title}
                      onClick={() => {
                        if (item.Action != undefined) item.Action();
                      }}
                    >
                      {item.Icon}
                      <span>{item.Title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {Object.values(props.Config.Sidebar.Bottom).map((rawItem) => {
                const item = rawItem as any as SidebarItem<unknown>
                return (
                  <SidebarMenuItem key={item.Title}>
                    <SidebarMenuButton
                      tooltip={item.Title}
                      onClick={() => {
                        if (item.Action != undefined) item.Action();
                      }}
                    >
                      {item.Icon}
                      <span>{item.Title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  )
}