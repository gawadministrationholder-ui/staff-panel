import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

interface ModerationStats {
  totalRobloxMods: number;
  totalDiscordMods: number;
  topRobloxModerator: { name: string; count: number };
  topDiscordModerator: { name: string; count: number };
  topActionTaker: { name: string; count: number };
  robloxWeekly: Array<{ week: string; count: number }>;
  discordWeekly: Array<{ week: string; count: number }>;
}

export default function Statistics() {
  const { user } = useAuth();

  // Fetch stats with auto-refresh every 5 seconds
  const { data: stats, isLoading } = useQuery<ModerationStats>({
    queryKey: ["/api/moderation-stats"],
    refetchInterval: 5000,
  });

  // Access control: rank 7+
  if (user && user.rank < 7) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You need to be rank 7 or higher to access the Statistics dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16 border-2 border-amber-500">
              <AvatarImage src={user?.robloxAvatar} alt={user?.robloxUsername} />
              <AvatarFallback className="text-2xl">{user?.robloxUsername?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">Welcome back {user?.robloxUsername}!</h1>
              <p className="text-sm text-muted-foreground">
                Here is an overview of your and your team's recent moderation decisions.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Any questions? Visit <span className="text-amber-500">help.usararmy.info</span>
          </p>
        </div>

        {/* Statistical Outlook */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading statistics...</p>
          </div>
        ) : (
          <>
            <div className="mb-8 bg-card rounded-lg p-6 border border-card-border">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Your Statistical Outlook
              </h2>
              
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-foreground">Your team have made </span>
                  <span className="text-amber-500 font-bold">{stats?.totalRobloxMods || 0}</span>
                  <span className="text-foreground"> Roblox Bans this week - There have been </span>
                  <span className="text-amber-500 font-bold">{stats?.totalDiscordMods || 0}</span>
                  <span className="text-foreground"> Roblox Warnings this week.</span>
                </p>

                <p>
                  <span className="text-foreground">Top Roblox Ban Moderator this week is </span>
                  <span className="text-amber-500 font-bold">{stats?.topRobloxModerator?.name || "N/A"}</span>
                  <span className="text-foreground"> with </span>
                  <span className="text-red-400 font-bold">{stats?.topRobloxModerator?.count || 0}</span>
                  <span className="text-foreground"> bans - Top Roblox Warning Moderator this week is </span>
                  <span className="text-amber-500 font-bold">{stats?.topDiscordModerator?.name || "N/A"}</span>
                  <span className="text-foreground"> with </span>
                  <span className="text-red-400 font-bold">{stats?.topDiscordModerator?.count || 0}</span>
                  <span className="text-foreground"> warnings.</span>
                </p>

                <p>
                  <span className="text-foreground">There have been </span>
                  <span className="text-blue-400 font-bold">0 Discord Bans</span>
                  <span className="text-foreground"> this week - There have been </span>
                  <span className="text-blue-400 font-bold">0 Discord Moderations</span>
                  <span className="text-foreground"> this week.</span>
                </p>

                <p>
                  <span className="text-foreground">There are on discord bans this week so there is </span>
                  <span className="text-blue-400 font-bold">no top moderator yet</span>
                  <span className="text-foreground"> - Top Discord Moderation Moderator this week is </span>
                  <span className="text-blue-400 font-bold">{stats?.topDiscordModerator?.name || "N/A"}</span>
                  <span className="text-foreground"> with </span>
                  <span className="text-blue-400 font-bold">{stats?.topDiscordModerator?.count || 0}</span>
                  <span className="text-foreground"> moderations.</span>
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
              {/* Roblox Chart */}
              <div className="bg-card rounded-lg p-6 border border-card-border">
                <h3 className="text-base font-bold mb-4">
                  Roblox Moderations for the Past 4 Weeks
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Data has only existed since this week so no data is available
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats?.robloxWeekly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="week" 
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #EAB308',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#EAB308" 
                      strokeWidth={2}
                      dot={{ fill: '#EAB308', r: 4 }}
                      name="Moderations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Discord Chart */}
              <div className="bg-card rounded-lg p-6 border border-card-border">
                <h3 className="text-base font-bold mb-4">
                  Discord Moderations for the Past 4 Weeks
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Data has only existed since this week so no data is available
                </p>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats?.discordWeekly || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis 
                      dataKey="week" 
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#18181b', 
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#a1a1aa' }} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      name="Moderations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
