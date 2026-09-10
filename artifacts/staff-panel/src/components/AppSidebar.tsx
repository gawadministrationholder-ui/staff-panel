import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  FileText, 
  Shield, 
  Settings,
  LogOut,
  Users,
  ClipboardList,
  ClipboardCheck,
  Inbox,
  Crown,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AppSidebar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const menuItems = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, minRank: 0, outlined: false },
    { title: "Staff Management", url: "/directory", icon: Users, minRank: 140, outlined: false },
    { title: "View Logs", url: "/logs", icon: FileText, minRank: 140, outlined: false },
    { title: "Submit Log", url: "/submit-log", icon: ClipboardList, minRank: 140, outlined: false },
    { title: "Applications", url: "/applications", icon: Inbox, minRank: 0, outlined: false },
    { title: "Application Manager", url: "/application-manager", icon: ClipboardCheck, minRank: 200, outlined: true },
    { title: "Admin Panel", url: "/admin", icon: Settings, minRank: 200, outlined: true },
    { title: "Management Panel", url: "/management", icon: Shield, minRank: 220, outlined: true },
    { title: "Head of Staff Panel", url: "/head", icon: Crown, minRank: 240, outlined: true },
  ];

  const visibleItems = menuItems.filter(item => !item.minRank || (user && !user.suspended && user.rank >= item.minRank));

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={user?.robloxAvatar} alt={user?.robloxUsername} />
            <AvatarFallback className="bg-amber-500 text-black font-bold">
              {user?.robloxUsername?.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <div className="font-bold text-sm truncate">{user?.robloxUsername}</div>
            {user?.rankName && (
              <div className="text-xs text-muted-foreground truncate">
                {user.rankName}
              </div>
            )}
          </div>
        </div>
        <h2 className="font-display font-bold text-lg">Galaxy at War</h2>
        {user?.suspended && (
          <div className="mt-2 rounded-md border border-red-600/50 bg-red-900/30 px-3 py-2 text-xs text-red-200">
            <span className="font-semibold">Access suspended.</span> Staff features are unavailable.
          </div>
        )}
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className={item.outlined ? "border border-gray-300 mx-2 my-1" : ""}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Link href={item.url}>
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

      <SidebarFooter className="p-4 border-t">
        {user?.email && (
          <div className="text-sm text-muted-foreground mb-3 px-2 truncate">{user.email}</div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="link-settings">
              <Link href="/settings">
                <Settings className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} data-testid="button-sidebar-logout">
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
