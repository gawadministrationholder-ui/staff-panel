import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, User, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface StaffMember {
  id: string;
  robloxUsername: string;
  robloxUserId: string;
  robloxAvatar: string;
  rank: number;
  rankName: string;
  discordUsername: string;
  email: string;
  createdAt: string;
}

interface ModerationLog {
  id: string;
  staffMemberId: string;
  targetUserId: string;
  actionType: string;
  reason: string;
  createdAt: string;
}

export default function Directory() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: staffMembers = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["/api/staff"],
  });

  const { data: logs = [] } = useQuery<ModerationLog[]>({
    queryKey: ["/api/logs"],
  });

  const filteredStaff = staffMembers.filter(staff =>
    staff.robloxUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (staff.discordUsername || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group staff by department based on rank
  const leadership = filteredStaff.filter(s => s.rank >= 200);
  const humanResources = filteredStaff.filter(s => s.rank >= 180 && s.rank < 200);
  const regularStaff = filteredStaff.filter(s => s.rank >= 140 && s.rank < 180);

  const StaffRow = ({ staff, idx }: { staff: StaffMember; idx: number }) => {
    const clearanceLevel = staff.rank >= 255 ? "Executive" :
                          staff.rank >= 200 ? "Senior" :
                          staff.rank >= 180 ? "Senior" :
                          "Standard";
    
    const department = staff.rank >= 200 ? "Leadership" :
                      staff.rank >= 180 ? "Human Resources" :
                      "Staff";

    return (
      <Card key={staff.id} className="hover-elevate" data-testid={`staff-row-${idx}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <Avatar className="w-12 h-12">
                <AvatarImage src={staff.robloxAvatar} alt={staff.robloxUsername} />
                <AvatarFallback>{staff.robloxUsername.charAt(0)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="font-medium" data-testid={`text-username-${idx}`}>{staff.robloxUsername}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium" data-testid={`text-role-${idx}`}>{staff.rankName || `Rank ${staff.rank}`}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="font-medium" data-testid={`text-department-${idx}`}>{department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Clearance</p>
                  <p className="font-medium" data-testid={`text-clearance-${idx}`}>{clearanceLevel}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                data-testid={`button-edit-role-${idx}`}
                onClick={() => toast({
                  title: "Feature coming soon",
                  description: "Role editing will be available in a future update"
                })}
              >
                EDIT ROLE
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                data-testid={`button-assignment-${idx}`}
                onClick={() => toast({
                  title: "Feature coming soon",
                  description: "Assignment management will be available in a future update"
                })}
              >
                ASSIGNMENT
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const strikeLogs = logs.filter(log => log.actionType === "strike").slice(0, 5);

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Staff Management</h1>
        <p className="text-muted-foreground">Manage staff members, roles, and view recent moderation actions</p>
      </div>

      <Card data-testid="card-recent-strikes">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            RECENT STRIKE LOGS
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strikeLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4" data-testid="text-no-strikes">No strike records found</p>
          ) : (
            <div className="space-y-2">
              {strikeLogs.map((log, idx) => (
                <div key={log.id} className="p-3 bg-muted/50 rounded-md" data-testid={`strike-log-${idx}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">Target User ID: {log.targetUserId}</p>
                      <p className="text-sm text-muted-foreground">{log.reason}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or Discord..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="input-search"
        />
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading staff members...</p>
        </div>
      )}

      {!isLoading && filteredStaff.length === 0 && searchQuery === "" && (
        <div className="text-center py-12 space-y-2">
          <User className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">No staff members yet</p>
          <p className="text-sm text-muted-foreground">Staff will appear here once they register</p>
        </div>
      )}

      {!isLoading && filteredStaff.length === 0 && searchQuery !== "" && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No staff members found</p>
        </div>
      )}

      {!isLoading && filteredStaff.length > 0 && (
        <>
          {leadership.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold" data-testid="heading-leadership">LEADERSHIP</h2>
              <div className="space-y-2">
                {leadership.map((staff, idx) => (
                  <StaffRow key={staff.id} staff={staff} idx={idx} />
                ))}
              </div>
            </div>
          )}

          {humanResources.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold" data-testid="heading-hr">HUMAN RESOURCES</h2>
              <div className="space-y-2">
                {humanResources.map((staff, idx) => (
                  <StaffRow key={staff.id} staff={staff} idx={idx + leadership.length} />
                ))}
              </div>
            </div>
          )}

          {regularStaff.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold" data-testid="heading-staff">STAFF</h2>
              <div className="space-y-2">
                {regularStaff.map((staff, idx) => (
                  <StaffRow key={staff.id} staff={staff} idx={idx + leadership.length + humanResources.length} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
