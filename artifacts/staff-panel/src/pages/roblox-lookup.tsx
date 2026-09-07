import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Users, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { RobloxModerationLog } from "@shared/schema";

export default function RobloxLookup() {
  const { user } = useAuth();
  const [userId, setUserId] = useState("");
  const [moderations, setModerations] = useState<RobloxModerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!userId.trim()) {
      toast({ title: "Error", description: "Please enter a Roblox User ID", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setSearched(true);
    try {
      const data = await apiRequest(`/api/user-lookup/roblox/${userId.trim()}`);
      setModerations(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch moderation history", variant: "destructive" });
      setModerations([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.rank < 3) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need rank 3 or higher to access the Moderation Network.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="flex items-center justify-center gap-2">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-bold">Roblox User Lookup</h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4 mb-6">
              <Input
                type="text"
                placeholder="Enter Roblox User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
                data-testid="input-user-id"
              />
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                data-testid="button-search"
              >
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading moderation history...</p>
              </div>
            ) : searched && moderations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No moderation history found for this user</p>
              </div>
            ) : searched && moderations.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Moderation History ({moderations.length} record{moderations.length !== 1 ? "s" : ""})</h3>
                {moderations.map((mod) => (
                  <Card key={mod.id} className="bg-card/50" data-testid={`moderation-${mod.id}`}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Warning ID</p>
                          <p className="text-sm font-semibold text-amber-500">{mod.warningId}</p>
                          <div className={mod.acknowledged ? "text-xs text-green-500 mt-1" : "text-xs text-red-500 mt-1"}>
                            {mod.acknowledged ? "Acknowledged" : "Not Acknowledged"}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Moderator</p>
                          <p className="text-sm font-semibold">{mod.moderatorName || "N/A"}</p>
                          <p className="text-xs text-amber-500">ID: {mod.moderatorId}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Date</p>
                          <p className="text-sm">{new Date(mod.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">{new Date(mod.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground">Reason</p>
                        <p className="text-sm">{mod.reason}</p>
                      </div>
                      {mod.evidence && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Evidence</p>
                          <a 
                            href={mod.evidence} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-400 hover:underline break-all"
                          >
                            {mod.evidence}
                          </a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Enter a Roblox User ID to view their warning history</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
