import { useState, useEffect, useRef } from "react";
import { Switch, Route, Link, useLocation, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";
import StarfieldBackground from "@/components/StarfieldBackground";
import NotFound from "@/pages/not-found";
import Register from "@/pages/register";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Applications from "@/pages/applications";
import ApplicationManager from "@/pages/application-manager";
import Directory from "@/pages/directory";
import Logs from "@/pages/logs";
import SubmitLog from "@/pages/submit-log";
import Admin from "@/pages/admin";
import Management from "@/pages/management";
import Head from "@/pages/head";
import StaffHub from "@/pages/staff-hub";
import StaffManagement from "@/pages/staff-management";
import DeveloperPortal from "@/pages/developer-portal";
import AccountSettings from "@/pages/account-settings";
import Statistics from "@/pages/statistics";
import RobloxWarnings from "@/pages/roblox-warnings";
import DiscordLookup from "@/pages/discord-lookup";
import RobloxLookup from "@/pages/roblox-lookup";
import UserModerationsReport from "@/pages/user-moderations-report";
import ModeratorReport from "@/pages/moderator-report";
import GlobalModerationBreakdown from "@/pages/global-moderation-breakdown";
import InfractionReport from "@/pages/infraction-report";
import DiscordBans from "@/pages/discord-bans";
import DiscordModerations from "@/pages/discord-moderations";
import RobloxModerations from "@/pages/roblox-moderations";
import PunishmentDocument from "@/pages/punishment-document";
import CompleteProfile from "@/pages/complete-profile";
import { ModerationLayout } from "@/components/moderation-layout";

function isProfileIncomplete(user: {
  email?: string;
  discordUsername?: string;
  discordId?: string;
  hasPassword?: boolean;
}): boolean {
  return (
    !user.email?.trim() ||
    !user.discordUsername?.trim() ||
    !user.discordId?.trim() ||
    user.hasPassword === false
  );
}

function RequireCompleteProfile({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const prevUserIdRef = useRef<string | null>(null);
  const redirectInProgressRef = useRef(false);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      redirectInProgressRef.current = false;
      prevUserIdRef.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    if (location === "/complete-profile" || location === "/login") {
      redirectInProgressRef.current = false;
    }
  }, [location]);

  useEffect(() => {
    if (isLoading || redirectInProgressRef.current) return;
    let target: string | null = null;
    if (!user) target = "/login";
    else if (isProfileIncomplete(user) && location !== "/complete-profile")
      target = "/complete-profile";
    if (target) {
      redirectInProgressRef.current = true;
      setLocation(target);
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!user || (isProfileIncomplete(user) && location !== "/complete-profile"))
    return (
      <div className="min-h-screen flex items-center justify-center">
        Redirecting...
      </div>
    );
  return <>{children}</>;
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  function openAuthModal(tab: "login" | "register") {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex items-center justify-between px-6 py-3 bg-black text-white sticky top-0 z-20 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-xs font-display font-bold text-primary">
            GAW
          </div>
          <h1 className="font-display text-sm font-semibold tracking-wide">
            GALAXY AT WAR | DASHBOARD
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          {user && (
            <>
              <button
                onClick={() => toast({ title: "Coming soon", description: "The Jedi Order page isn't set up yet." })}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                The Jedi Order
              </button>
              <button
                onClick={() => toast({ title: "Coming soon", description: "The Sith Order page isn't set up yet." })}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                The Sith Order
              </button>
              <button
                onClick={() => toast({ title: "Coming soon", description: "The Community page isn't set up yet." })}
                className="hover:text-amber-500 transition-colors cursor-pointer"
              >
                Community
              </button>
            </>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-white/10 rounded-md px-2 py-1 transition-colors">
                  <img
                    src={user.robloxAvatar}
                    alt={user.robloxUsername}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-right">
                    <div className="font-semibold text-xs">
                      {user.robloxUsername}
                    </div>
                    {user.rankName && (
                      <div className="text-[10px] text-gray-400">
                        {user.rankName}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() => setLocation("/dashboard")}
                  className="cursor-pointer"
                >
                  Dashboard
                </DropdownMenuItem>
                {user.rank >= 97 && (
                  <DropdownMenuItem
                    onSelect={() => setLocation("/staff-hub")}
                    className="cursor-pointer"
                  >
                    Staff Hub
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => setLocation("/staff-management")}
                  className="cursor-pointer"
                >
                  Staff Management
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setLocation("/developer-portal")}
                  className="cursor-pointer"
                >
                  Developer Portal
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setLocation("/settings")}
                  className="cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal("login")}
                className="text-white hover:text-amber-500 px-3 py-2 font-medium transition-colors"
                data-testid="button-open-login"
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal("register")}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded-md font-semibold transition-colors"
                data-testid="button-open-register"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-auto bg-transparent">{children}</main>
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} defaultTab={authModalTab} />
    </div>
  );
}

function AppRouter() {
  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <RequireCompleteProfile>
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </RequireCompleteProfile>
  );
  const WrapMod = ({ children }: { children: React.ReactNode }) => (
    <RequireCompleteProfile>
      <AuthenticatedLayout>
        <ModerationLayout>{children}</ModerationLayout>
      </AuthenticatedLayout>
    </RequireCompleteProfile>
  );

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/complete-profile">{() => <CompleteProfile />}</Route>
      <Route path="/">{() => <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>}</Route>
      <Route path="/dashboard">{() => <AuthenticatedLayout><Dashboard /></AuthenticatedLayout>}</Route>
      <Route path="/applications">{() => <Wrap><Applications /></Wrap>}</Route>
      <Route path="/application-manager">{() => <Wrap><ApplicationManager /></Wrap>}</Route>
      <Route path="/directory">{() => <Wrap><Directory /></Wrap>}</Route>
      <Route path="/logs">{() => <Wrap><Logs /></Wrap>}</Route>
      <Route path="/submit-log">{() => <Wrap><SubmitLog /></Wrap>}</Route>
      <Route path="/admin">{() => <Wrap><Admin /></Wrap>}</Route>
      <Route path="/management">{() => <Wrap><Management /></Wrap>}</Route>
      <Route path="/head">{() => <Wrap><Head /></Wrap>}</Route>
      <Route path="/staff-hub">{() => <Wrap><StaffHub /></Wrap>}</Route>
      <Route path="/staff-management">{() => <Wrap><StaffManagement /></Wrap>}</Route>
      <Route path="/developer-portal">{() => <Wrap><DeveloperPortal /></Wrap>}</Route>
      <Route path="/statistics">{() => <WrapMod><Statistics /></WrapMod>}</Route>
      <Route path="/moderation/discord">{() => <WrapMod><DiscordModerations /></WrapMod>}</Route>
      <Route path="/moderation/roblox">{() => <WrapMod><RobloxModerations /></WrapMod>}</Route>
      <Route path="/moderation/discord/lookup">{() => <WrapMod><DiscordLookup /></WrapMod>}</Route>
      <Route path="/moderation/roblox/lookup">{() => <WrapMod><RobloxLookup /></WrapMod>}</Route>
      <Route path="/discord-moderations" component={DiscordModerations} />
      <Route path="/roblox-moderations" component={RobloxModerations} />
      <Route path="/user-moderations-report" component={UserModerationsReport} />
      <Route path="/moderator-report" component={ModeratorReport} />
      <Route path="/global-moderation-breakdown" component={GlobalModerationBreakdown} />
      <Route path="/infraction-report" component={InfractionReport} />
      <Route path="/discord-bans" component={DiscordBans} />
      <Route path="/roblox-warnings" component={RobloxWarnings} />
      <Route path="/discord-lookup" component={DiscordLookup} />
      <Route path="/roblox-lookup" component={RobloxLookup} />
      <Route path="/settings">{() => <Wrap><AccountSettings /></Wrap>}</Route>
      <Route path="/punishment-document">{() => <PunishmentDocument />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <div className="dark">
              <StarfieldBackground />
              <Toaster />
              <AppRouter />
            </div>
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
