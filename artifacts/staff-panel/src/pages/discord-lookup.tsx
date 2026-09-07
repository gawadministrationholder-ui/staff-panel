import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DiscordModerationLog } from "@shared/schema";
import { format } from "date-fns";

export default function DiscordLookup() {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [moderations, setModerations] = useState<DiscordModerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast({ title: "Error", description: "Please enter a Discord User ID", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSearched(true);
    try {
      const response = await fetch(`/api/user-lookup/discord/${userId.trim()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setModerations(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch moderation history", variant: "destructive" });
      setModerations([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (user && user.rank < 7) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-8">
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

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "ban": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "kick": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "timeout": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "warning": return "bg-amber-500/20 text-yellow-400 border-amber-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="p-8 space-y-6 bg-background min-h-screen">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardHeader className="bg-muted/30 border-b border-border">
            <CardTitle className="text-xl flex items-center gap-2 justify-center">
              <Search className="w-5 h-5" />
              Discord User Lookup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-3">
              <Input
                placeholder="Enter Discord User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
                data-testid="input-discord-user-id"
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-yellow-600 hover:bg-yellow-700"
                data-testid="button-search"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter a Discord User ID to view their moderation history
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading moderation history...</p>
        </div>
      )}

      {searched && !isLoading && moderations.length === 0 && (
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-4xl">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No moderation history found for this Discord User ID
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {moderations.length > 0 && (
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-4xl">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-lg">
                Moderation History ({moderations.length} record{moderations.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {moderations.map((mod) => (
                  <div key={mod.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge className={getActionColor(mod.action)}>
                            {mod.action}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(mod.createdAt), 'MMM dd, yyyy - hh:mm a')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Target:</span>
                            <span className="ml-2 font-mono">{mod.targetName} ({mod.targetId})</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Moderator:</span>
                            <span className="ml-2 font-mono">{mod.moderatorName} ({mod.moderatorId})</span>
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Reason:</span>
                          <p className="mt-1 text-foreground">{mod.reason}</p>
                        </div>

                        {mod.details && (
                          <div className="text-xs text-muted-foreground">
                            <span>Additional details available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
