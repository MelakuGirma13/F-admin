"use client"

import * as React from "react"

import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { NavMain } from "./nav-main"
import { TeamSwitcher } from "./team-switcher"
import { SidebarHeader, SidebarContent, SidebarFooter, SidebarRail, Sidebar } from "../ui/sidebar"
import { AudioWaveform, Bot, Command, Frame, GalleryVerticalEnd, Settings2, SquareTerminal } from "lucide-react"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Fafresh",
      logo: GalleryVerticalEnd,
      plan: "Fashion",
    },
    // {
    //   name: "Fafresh",
    //   logo: AudioWaveform,
    //   plan: "Startup",
    // },
    // {
    //   name: "Evil Corp.",
    //   logo: Command,
    //   plan: "Free",
    // },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Analytics",
          url: "/",
        },
        // {
        //   title: "Starred",
        //   url: "#",
        // },
        // {
        //   title: "Settings",
        //   url: "#",
        // },
      ],
    },
    {
      title: "Products",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Products",
          url: "/admin/products",
        },
        {
          title: "Orders",
          url: "/admin/orders",
        },
        // {
        //   title: "Quantum",
        //   url: "#",
        // },
      ],
    },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Permissions",
          url: "/admin/permissions",
        },
        {
          title: "Roles",
          url: "/admin/roles",
        },
        {
          title: "Users",
          url: "/admin/users",
        },
        {
          title: "Settings",
          url: "/admin/settings",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Store-front",
      url: "#",
      icon: Frame,
    },
    // {
    //   name: "Sales & Marketing",
    //   url: "#",
    //   icon: PieChart,
    // },
    // {
    //   name: "Travel",
    //   url: "#",
    //   icon: Map,
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
