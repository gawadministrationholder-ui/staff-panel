import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Home, LogOut, Settings, BarChart3, FileText, AlertTriangle, MessageSquare, Users, Shield, TrendingUp, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RobloxModerationLog } from "@shared/schema";

export default function RobloxWarnings() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data: warnings = [], isLoading } = useQuery<RobloxModerationLog[]>({
    queryKey: ["/api/roblox-moderations"],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async ({ warningId, acknowledged }: { warningId: string; acknowledged: boolean }) => {
      return await apiRequest(`/api/roblox-moderations/${warningId}/acknowledge`, {
        method: "PATCH",
        body: JSON.stringify({ acknowledged }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roblox-moderations"] });
      toast({ title: "Acknowledgment updated successfully" });
    },
  });

  const filteredWarnings = warnings.filter(warning =>
    searchQuery === "" ||
    warning.warningId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warning.targetRobloxId.includes(searchQuery) ||
    warning.moderatorId.includes(searchQuery) ||
    warning.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionLabel = (rank: number): string => {
    if (rank >= 225) return "Owner";
    if (rank >= 9) return "Army Staff";
    if (rank === 8) return "Manager";
    if (rank === 7) return "Supervisor";
    return "Staff";
  };

  if (user && user.rank < 7) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              You need to be rank 7 or higher to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-sm font-bold text-amber-500">Rome Admin Portal</h1>
          <p className="text-xs text-muted-foreground">Rome Staff Technical Services</p>
        </div>

        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-amber-500">
              <AvatarImage src={user?.robloxAvatar} alt={user?.robloxUsername} />
              <AvatarFallback>{user?.robloxUsername?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{user?.robloxUsername}</p>
              <p className="text-xs text-amber-500">{user?.rankName || "Staff"}</p>
              <p className="text-xs text-muted-foreground">
                Permissions: {getPermissionLabel(user?.rank || 0)}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => setLocation("/dashboard")}
            data-testid="nav-home"
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          <div className="pt-4">
            <Button 
              variant="secondary" 
              className="w-full justify-start text-sm bg-green-500/10 text-green-500"
              onClick={() => setLocation("/statistics")}
              data-testid="nav-statistics"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </Button>

            <div className="ml-4 mt-1 space-y-1">
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs"
                onClick={() => toast({ title: "Feature coming soon" })}
                data-testid="nav-global-infractions"
              >
                Global Infractions Report
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs"
                onClick={() => toast({ title: "Feature coming soon" })}
                data-testid="nav-global-moderation"
              >
                Global Moderation Breakdown
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs"
                onClick={() => toast({ title: "Feature coming soon" })}
                data-testid="nav-moderator-report"
              >
                Moderator Report
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-xs"
                onClick={() => toast({ title: "Feature coming soon" })}
                data-testid="nav-user-moderations"
              >
                User Moderations Report
              </Button>
            </div>
          </div>

          <div className="pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">DISCORD SYSTEM</h3>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => toast({ title: "Feature coming soon" })}
            data-testid="nav-discord-bans"
          >
            <Shield className="w-4 h-4 mr-2" />
            Bans
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => toast({ title: "Feature coming soon" })}
            data-testid="nav-discord-moderations"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Moderations
          </Button>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => setLocation("/discord-lookup")}
            data-testid="nav-discord-lookup"
          >
            <Users className="w-4 h-4 mr-2" />
            User Lookup
          </Button>

          <div className="pt-4 pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground px-2 mb-2">ROBLOX SYSTEM</h3>
          </div>
          
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => toast({ title: "Feature coming soon" })}
            data-testid="nav-roblox-bans"
          >
            <Shield className="w-4 h-4 mr-2" />
            Bans
          </Button>
          
          <Button 
            variant="secondary" 
            className="w-full justify-start text-sm bg-amber-500/20 text-amber-500"
            data-testid="nav-roblox-warnings"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Warnings
          </Button>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => setLocation("/roblox-lookup")}
            data-testid="nav-roblox-lookup"
          >
            <Users className="w-4 h-4 mr-2" />
            User Lookup
          </Button>
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm"
            onClick={() => toast({ title: "Feature coming soon" })}
            data-testid="nav-settings"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm text-red-400 hover:text-red-300"
            onClick={handleLogout}
            data-testid="nav-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <h2 className="text-lg font-bold">Roblox Warning Actions</h2>
          </div>
        </div>

        <div className="p-4 flex justify-center">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white"
            onClick={() => toast({ title: "Feature coming soon", description: "Warning creation will be available soon" })}
            data-testid="button-create-warning"
          >
            Create Warning
          </Button>
        </div>

        <div className="px-4">
          <div className="border-b border-border bg-card p-4">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold">Roblox Warnings</h3>
            </div>
          </div>

          <div className="p-4 bg-card/50">
            <Input
              type="text"
              placeholder="Filter Warnings (enter any key or relevant information about the warning)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-4"
              data-testid="input-filter-warnings"
            />

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading warnings...</p>
              </div>
            ) : filteredWarnings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No warnings found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWarnings.map((warning) => (
                  <div 
                    key={warning.id} 
                    className="grid grid-cols-4 gap-4 bg-card border border-border p-4 rounded"
                    data-testid={`warning-${warning.warningId}`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-500">ID: {warning.warningId}</p>
                      <div className="flex items-center gap-2 text-xs text-blue-400">
                        <AlertCircle className="w-3 h-3" />
                        Warned on {new Date(warning.createdAt).toLocaleDateString()}
                      </div>
                      <div className={warning.acknowledged ? "text-xs text-green-500" : "text-xs text-red-500"}>
                        {warning.acknowledged ? "Acknowledged" : "🔴 Not Acknowledged"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-amber-500 font-semibold">
                        RbxID: {warning.targetRobloxId}
                      </p>
                      <p className="text-xs text-amber-500 font-semibold">
                        ModeratorID: {warning.moderatorId}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-500">Reason</p>
                      <p className="text-xs">{warning.reason}</p>
                      <p className="text-xs text-muted-foreground italic">* info is read only</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-amber-500">Evidence</p>
                      {warning.evidence ? (
                        <a 
                          href={warning.evidence} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline break-all"
                        >
                          {warning.evidence.substring(0, 40)}...
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground">No evidence provided</p>
                      )}
                      <p className="text-xs text-muted-foreground italic">* info is read only</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
