import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Shield, MessageSquare, AlertTriangle, Users } from "lucide-react";

interface GlobalStats {
  totalModerations: number;
  discordTotal: number;
  robloxTotal: number;
  actionBreakdown: {
    ban: number;
    kick: number;
    timeout: number;
    warning: number;
  };
  platformBreakdown: Array<{ name: string; value: number }>;
  topModerators: Array<{ name: string; count: number }>;
  dailyStats: Array<{ date: string; discord: number; roblox: number }>;
}

const COLORS = ['#EAB308', '#3B82F6', '#EF4444', '#10B981'];

export default function GlobalModerationBreakdown() {
  const { data: stats, isLoading } = useQuery<GlobalStats>({
    queryKey: ["/api/global-moderation-breakdown"],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-muted-foreground">Loading global statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No moderation data available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Global Moderation Breakdown</h1>
        <p className="text-muted-foreground">Complete overview of all moderation actions across platforms</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Moderations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{stats.totalModerations}</div>
            <p className="text-xs text-muted-foreground mt-1">All platforms combined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Discord Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <div className="text-3xl font-bold">{stats.discordTotal}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalModerations > 0 
                ? `${((stats.discordTotal / stats.totalModerations) * 100).toFixed(1)}% of total`
                : "0% of total"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Roblox Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-500" />
              <div className="text-3xl font-bold">{stats.robloxTotal}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalModerations > 0 
                ? `${((stats.robloxTotal / stats.totalModerations) * 100).toFixed(1)}% of total`
                : "0% of total"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Moderators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              <div className="text-3xl font-bold">{stats.topModerators.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Staff members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Action Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/10 text-red-500">Bans</Badge>
                  </div>
                  <span className="font-bold">{stats.actionBreakdown.ban}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${(stats.actionBreakdown.ban / stats.totalModerations) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/10 text-orange-500">Kicks</Badge>
                  </div>
                  <span className="font-bold">{stats.actionBreakdown.kick}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ width: `${(stats.actionBreakdown.kick / stats.totalModerations) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500/10 text-amber-500">Timeouts</Badge>
                  </div>
                  <span className="font-bold">{stats.actionBreakdown.timeout}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full" 
                    style={{ width: `${(stats.actionBreakdown.timeout / stats.totalModerations) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500/10 text-blue-500">Warnings</Badge>
                  </div>
                  <span className="font-bold">{stats.actionBreakdown.warning}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(stats.actionBreakdown.warning / stats.totalModerations) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.platformBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.platformBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Moderators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.topModerators.map((mod, index) => (
              <div key={mod.name} className="flex items-center justify-between p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-500/10 text-amber-500">#{index + 1}</Badge>
                  <span className="font-semibold">{mod.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold">{mod.count}</div>
                  <div className="text-xs text-muted-foreground">actions</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {stats.dailyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="discord" fill="#3B82F6" name="Discord" />
                <Bar dataKey="roblox" fill="#EF4444" name="Roblox" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
