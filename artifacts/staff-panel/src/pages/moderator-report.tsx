import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface ModeratorStats {
  moderatorId: string;
  moderatorName: string;
  totalActions: number;
  discordActions: number;
  robloxActions: number;
  actionBreakdown: {
    ban: number;
    kick: number;
    timeout: number;
    warning: number;
  };
}

export default function ModeratorReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: moderatorStats, isLoading } = useQuery<ModeratorStats[]>({
    queryKey: ["/api/moderator-report", startDate, endDate],
  });

  const filteredStats = moderatorStats?.filter((stat) =>
    stat.moderatorName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Moderator Report</h1>
        <p className="text-muted-foreground">View moderation statistics by staff member with date filtering</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                data-testid="input-start-date"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                data-testid="input-end-date"
              />
            </div>
            <div>
              <Label htmlFor="search-moderator">Search Moderator</Label>
              <Input
                id="search-moderator"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-moderator"
              />
            </div>
          </div>
          {startDate && endDate && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading moderator statistics...</div>
      ) : filteredStats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {searchTerm || (startDate && endDate) 
              ? "No moderators found matching your filters"
              : "Set a date range to view moderator statistics"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStats.map((stat) => (
            <Card key={stat.moderatorId} className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-lg">{stat.moderatorName}</CardTitle>
                <p className="text-xs text-muted-foreground">ID: {stat.moderatorId}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Total Actions</span>
                    <Badge className="bg-amber-500/10 text-amber-500">{stat.totalActions}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Discord</span>
                      <span className="font-medium">{stat.discordActions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Roblox</span>
                      <span className="font-medium">{stat.robloxActions}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Action Breakdown</p>
                  <div className="space-y-1">
                    {stat.actionBreakdown.ban > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <Badge className="bg-red-500/10 text-red-500 text-xs">Bans</Badge>
                        <span className="font-medium">{stat.actionBreakdown.ban}</span>
                      </div>
                    )}
                    {stat.actionBreakdown.kick > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <Badge className="bg-orange-500/10 text-orange-500 text-xs">Kicks</Badge>
                        <span className="font-medium">{stat.actionBreakdown.kick}</span>
                      </div>
                    )}
                    {stat.actionBreakdown.timeout > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <Badge className="bg-amber-500/10 text-amber-500 text-xs">Timeouts</Badge>
                        <span className="font-medium">{stat.actionBreakdown.timeout}</span>
                      </div>
                    )}
                    {stat.actionBreakdown.warning > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <Badge className="bg-blue-500/10 text-blue-500 text-xs">Warnings</Badge>
                        <span className="font-medium">{stat.actionBreakdown.warning}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
