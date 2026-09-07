import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, Shield, User, Clock } from "lucide-react";

interface DiscordBan {
  id: string;
  targetId: string;
  targetName: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  details?: string;
  createdAt: string;
}

export default function DiscordBans() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bans, isLoading } = useQuery<DiscordBan[]>({
    queryKey: ["/api/discord-bans"],
    refetchInterval: 5000,
  });

  const filteredBans = bans?.filter((ban) =>
    ban.targetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ban.targetId.includes(searchTerm) ||
    ban.moderatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ban.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Shield className="w-8 h-8 text-red-500" />
          Discord Bans
        </h1>
        <p className="text-muted-foreground">View all Discord ban actions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Bans ({filteredBans.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search bans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
                data-testid="input-search-bans"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading bans...</div>
          ) : filteredBans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No bans match your search" : "No Discord bans recorded"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBans.map((ban) => (
                <Card key={ban.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Banned User</p>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-semibold">{ban.targetName}</p>
                            <p className="text-xs text-muted-foreground">ID: {ban.targetId}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Moderator</p>
                        <p className="font-medium">{ban.moderatorName}</p>
                        <p className="text-xs text-muted-foreground">ID: {ban.moderatorId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Reason</p>
                        <p className="font-medium">{ban.reason}</p>
                        {ban.details && (
                          <p className="text-xs text-muted-foreground mt-1">{ban.details}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {format(new Date(ban.createdAt), "MMM d, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(ban.createdAt), "h:mm a")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Badge className="bg-red-500/10 text-red-500">
                        <Shield className="w-3 h-3 mr-1" />
                        PERMANENT BAN
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
