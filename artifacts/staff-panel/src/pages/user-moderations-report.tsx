import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, Shield, MessageSquare, AlertTriangle } from "lucide-react";

interface ModerationRecord {
  id: string;
  platform: string;
  action: string;
  targetId: string;
  targetName?: string;
  reason: string;
  evidence?: string;
  details?: string;
  createdAt: string;
}

interface UserModerationsData {
  moderatorName: string;
  moderatorId: string;
  totalModerations: number;
  discordModerations: number;
  robloxModerations: number;
  moderations: ModerationRecord[];
}

export default function UserModerationsReport() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");

  const { data: staffList } = useQuery<Array<{ id: string; name: string }>>({
    queryKey: ["/api/staff-list"],
  });

  const { data, isLoading } = useQuery<UserModerationsData>({
    queryKey: ["/api/user-moderations-report", selectedStaff],
    enabled: !!selectedStaff,
  });

  const filteredModerations = data?.moderations.filter((mod) =>
    mod.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "ban": return "bg-red-500/10 text-red-500";
      case "kick": return "bg-orange-500/10 text-orange-500";
      case "timeout": return "bg-amber-500/10 text-amber-500";
      case "warning": return "bg-blue-500/10 text-blue-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Moderations Report</h1>
        <p className="text-muted-foreground">View all moderation actions performed by a specific staff member</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Staff Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="staff-select">Staff Member</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger id="staff-select" data-testid="select-staff-member">
                  <SelectValue placeholder="Choose a staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList?.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedStaff && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Moderations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{data.totalModerations}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Discord Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div className="text-3xl font-bold">{data.discordModerations}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Roblox Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  <div className="text-3xl font-bold">{data.robloxModerations}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Moderator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{data.moderatorName}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Moderation History</CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter moderations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                    data-testid="input-filter-moderations"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredModerations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No moderations match your search" : "No moderation actions found"}
                  </div>
                ) : (
                  filteredModerations.map((mod) => (
                    <Card key={mod.id} className="border-l-4 border-l-amber-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Platform</p>
                            <Badge className={mod.platform === "discord" ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500"}>
                              {mod.platform === "discord" ? (
                                <><MessageSquare className="w-3 h-3 mr-1" /> Discord</>
                              ) : (
                                <><Shield className="w-3 h-3 mr-1" /> Roblox</>
                              )}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Action</p>
                            <Badge className={getActionColor(mod.action)}>
                              {mod.action.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Target</p>
                            <p className="font-medium">{mod.targetName || mod.targetId}</p>
                            <p className="text-xs text-muted-foreground">ID: {mod.targetId}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">Reason</p>
                            <p className="font-medium">{mod.reason}</p>
                            {mod.details && (
                              <p className="text-xs text-muted-foreground mt-1">{mod.details}</p>
                            )}
                            {mod.evidence && (
                              <a 
                                href={mod.evidence} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-1 block"
                              >
                                View Evidence
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {format(new Date(mod.createdAt), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedStaff && isLoading && (
        <div className="text-center py-8 text-muted-foreground">Loading moderations...</div>
      )}
    </div>
  );
}
