import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { BarChart3, MessageSquare, Shield, Search, Home, FileText, Users, AlertCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { UserLookupDialog } from "./user-lookup-dialog";
import { ModerationReportDialog } from "./moderation-report-dialog";
import { InfractionCriteriaDialog } from "./infraction-criteria-dialog";
import { DateRangeDialog } from "./date-range-dialog";
import brandLogo from "../assets/brand-logo.png";

interface ModerationLayoutProps {
  children: React.ReactNode;
}

export function ModerationLayout({ children }: ModerationLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [userLookupOpen, setUserLookupOpen] = useState(false);
  const [moderationReportOpen, setModerationReportOpen] = useState(false);
  const [infractionCriteriaOpen, setInfractionCriteriaOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);

  const statisticsItems = [
    {
      title: "Global Infractions Report",
      onClick: () => setInfractionCriteriaOpen(true),
      icon: FileText,
    },
    {
      title: "Global Moderation Breakdown",
      onClick: () => setDateRangeOpen(true),
      icon: BarChart3,
    },
    {
      title: "Moderator Report",
      url: "/moderator-report",
      icon: Users,
    },
    {
      title: "User Moderations Report",
      onClick: () => setModerationReportOpen(true),
      url: "/user-moderations-report",
      icon: FileText,
    },
  ];

  const discordItems = [
    {
      title: "Moderations",
      url: "/moderation/discord",
      icon: MessageSquare,
    },
    {
      title: "User Lookup",
      onClick: () => setUserLookupOpen(true),
      icon: Search,
    },
  ];

  const robloxItems = [
    {
      title: "Moderations",
      url: "/moderation/roblox",
      icon: MessageSquare,
      disabled: false,
    },
    {
      title: "User Lookup",
      url: "/moderation/roblox/lookup",
      icon: Search,
      disabled: false,
    },
  ];

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex w-full h-full">
        <Sidebar data-testid="sidebar-moderation" className="border-r border-border">
          <SidebarHeader className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <img src={brandLogo} alt="Galaxy at War" className="w-10 h-10" />
              <div className="space-y-0.5">
                <h1 className="font-display text-sm font-bold text-amber-500">Galaxy at War</h1>
                <p className="text-xs text-muted-foreground">Administration Portal</p>
              </div>
            </div>
          </SidebarHeader>

          {user && (
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-amber-500">
                  <AvatarImage src={user.robloxAvatar} alt={user.robloxUsername} />
                  <AvatarFallback>{user.robloxUsername?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.robloxUsername}</p>
                  <p className="text-xs text-amber-500 truncate">{user.rankName || "Staff"}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <SidebarContent className="px-2">
            {/* Dashboard */}
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/dashboard"}>
                    <Link href="/dashboard">
                      <Home className="w-4 h-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === "/statistics"}
                    className="bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  >
                    <Link href="/statistics">
                      <BarChart3 className="w-4 h-4" />
                      <span>Live Statistics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Statistics Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Statistics</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {statisticsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.onClick ? (
                        <SidebarMenuButton
                          onClick={item.onClick}
                          data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm cursor-pointer"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={location === item.url}
                          data-testid={`sidebar-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm"
                        >
                          <Link href={item.url || "#"}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Discord System Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Discord System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {discordItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      {item.onClick ? (
                        <SidebarMenuButton
                          onClick={item.onClick}
                          data-testid={`sidebar-link-discord-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm cursor-pointer"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={location === item.url}
                          data-testid={`sidebar-link-discord-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-sm"
                        >
                          <Link href={item.url || "#"}>
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Roblox System Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Roblox System</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {robloxItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.url}
                        data-testid={`sidebar-link-roblox-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        className="text-sm"
                      >
                        <Link href={item.url || "#"}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border p-4">
            <p className="text-xs text-blue-400 text-center">
              All actions are logged and processed by Galaxy at War Administrators
            </p>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Dialog Components */}
      <UserLookupDialog open={userLookupOpen} onOpenChange={setUserLookupOpen} />
      <ModerationReportDialog open={moderationReportOpen} onOpenChange={setModerationReportOpen} />
      <InfractionCriteriaDialog open={infractionCriteriaOpen} onOpenChange={setInfractionCriteriaOpen} />
      <DateRangeDialog open={dateRangeOpen} onOpenChange={setDateRangeOpen} />
    </SidebarProvider>
  );
}
