"use client";

import { ComponentProps, useMemo } from "react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { GlobalConfigType, SidebarItem } from "@/lib/globals";


type AppSidebarProps = {
  Config: GlobalConfigType;
  SidebarProps: ComponentProps<typeof Sidebar>;
}

export function AppSidebar(props: AppSidebarProps) {
  const pages = useMemo(() => {
    return props.Config.Pages.All.map(x => {
      return { ...x, Disabled: x.Id != props.Config.Pages.Current.Getter };
    })
  }, [
    props.Config.Pages.Current.Getter,
    props.Config.Pages.All
  ])
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
            <SidebarGroupLabel>Pages</SidebarGroupLabel>
            <SidebarMenu>
              {pages.map(p => <SidebarMenuItem key={p.Id}>
                <SidebarMenuButton disabled={!(p?.Disabled ?? false)} onClick={() => {
                  if (p.Id == 'videos') props.Config.VideoPlayer.Selected.Setter(undefined);
                  props.Config.Pages.Current.Setter(p.Id);
                }}>
                  {p.Icon}
                  <span>{p.Label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarMenu>
              {Object.entries(props.Config.Sidebar.Top).filter(([_, x]) => x.Visibility ?? true).map(([key, rawItem]) => {
                const item = rawItem as any as SidebarItem<unknown>;
                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
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
              {Object.entries(props.Config.Sidebar.Bottom).filter(([_, x]) => x.Visibility ?? true).map(([key, rawItem]) => {
                const item = rawItem as any as SidebarItem<unknown>
                return (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
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