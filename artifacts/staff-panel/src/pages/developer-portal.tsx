import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { X } from "lucide-react";

interface Stats {
  registeredUsers: number;
  staffMembers: number;
  totalPunishments: number;
  strikes: number;
  warnings: number;
  suspensions: number;
  terminations: number;
  discordLinked: number;
}

const ASSIGNABLE_CLEARANCES = [
  "Staff",
  "Application Reviewer",
  "Staff Manager",
  "Executive",
  "Network Administrator",
  "Network Engineer",
] as const;

interface PendingAccessRequest {
  id: string;
  requestedByUsername: string;
  targetUsername: string;
  changes: { rank?: number; rankName?: string; clearance?: string };
  createdAt: string;
}

export default function DeveloperPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<Omit<User, "password"> | null>(null);
  const [editData, setEditData] = useState({
    discordUsername: "",
    discordId: "",
    email: "",
    rank: 0,
    rankName: "",
    clearance: [] as string[],
  });

  const myClearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const isEngineer = myClearances.includes("Network Engineer");
  const isAdmin = myClearances.includes("Network Administrator");
  const canManageAccess = isEngineer || isAdmin;

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: !!user && user.rank >= 7,
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<Omit<User, "password">[]>({
    queryKey: ["/api/staff"],
    enabled: !!user && user.rank >= 8,
  });

  const { data: pendingRequests } = useQuery<PendingAccessRequest[]>({
    queryKey: ["/api/access-requests"],
    enabled: isEngineer,
    refetchInterval: 15 * 1000,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: {
      discordUsername: string;
      discordId: string;
      email: string;
      rank?: number;
      rankName?: string;
      clearance?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/users/${editingUser?.id}`, data);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data?.pending) {
        toast({ title: "Submitted for approval", description: data.message });
      } else {
        toast({ title: "Success", description: "User updated successfully" });
      }
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/access-requests/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Access change applied" });
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/access-requests/${id}/reject`, {});
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Access change request rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/access-requests"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("POST", `/api/users/${userId}/reset-password`, {});
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Password reset link will be sent via Discord bot" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const statCards = [
    { label: "REGISTERED USERS", value: stats?.registeredUsers ?? 0 },
    { label: "STAFF MEMBERS", value: stats?.staffMembers ?? 0 },
    { label: "TOTAL PUNISHMENTS", value: stats?.totalPunishments ?? 0 },
    { label: "STRIKES ISSUED", value: stats?.strikes ?? 0 },
    { label: "WARNINGS ISSUED", value: stats?.warnings ?? 0 },
    { label: "SUSPENSIONS", value: stats?.suspensions ?? 0 },
    { label: "TERMINATIONS", value: stats?.terminations ?? 0 },
    { label: "SYSTEM POLICIES", value: 0 },
  ];

  const secondaryStats = [
    { label: "QUICK LINKS", value: 1 },
    { label: "POLICY READS", value: 0 },
    { label: "ACTIVE SESSIONS", value: stats?.staffMembers ?? 0 },
    { label: "ROBLOX ACCOUNTS", value: stats?.registeredUsers ?? 0 },
    { label: "DISCORD LINKED", value: stats?.discordLinked ?? 0 },
    { label: "AVG RESPONSE TIME", value: "125ms", isText: true },
  ];

  if (user && user.rank < 7) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Developer Portal requires rank 7 or higher. Your current rank: {user.rank}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">DEVELOPER PORTAL</h1>
        <Button variant="default" data-testid="button-download-csv">
          DOWNLOAD CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} data-testid={`stat-card-${idx}`}>
            <CardHeader className="p-4">
              <CardDescription className="text-xs text-muted-foreground">{stat.label}</CardDescription>
              <CardTitle className="text-3xl font-bold">{statsLoading ? "..." : stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {secondaryStats.map((stat, idx) => (
          <Card key={idx} data-testid={`secondary-stat-${idx}`}>
            <CardHeader className="p-4">
              <CardDescription className="text-xs text-muted-foreground">{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-bold">
                {statsLoading ? "..." : stat.isText ? stat.value : stat.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {editingUser ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Edit User - {editingUser.robloxUsername}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingUser(null)} data-testid="button-close-edit">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Discord Username</label>
              <Input
                value={editData.discordUsername}
                onChange={(e) => setEditData({ ...editData, discordUsername: e.target.value })}
                data-testid="input-discord-username"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Discord ID</label>
              <Input
                value={editData.discordId}
                onChange={(e) => setEditData({ ...editData, discordId: e.target.value })}
                data-testid="input-discord-id"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>

            {canManageAccess && (
              <div className="space-y-4 border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Access ({isEngineer ? "Network Engineer" : "Network Administrator — requires Engineer approval unless you're also Executive"})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Rank</label>
                    <Input
                      type="number"
                      value={editData.rank}
                      onChange={(e) => setEditData({ ...editData, rank: Number(e.target.value) })}
                      data-testid="input-rank"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Rank Title</label>
                    <Input
                      value={editData.rankName}
                      onChange={(e) => setEditData({ ...editData, rankName: e.target.value })}
                      placeholder="e.g. Community Manager"
                      data-testid="input-rank-name"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Clearance</label>
                  <div className="flex flex-wrap gap-2">
                    {ASSIGNABLE_CLEARANCES.map((c) => {
                      const active = editData.clearance.includes(c);
                      // Network Engineers can grant any clearance; everyone
                      // else can only hand out clearance they hold themselves.
                      const disabled = !isEngineer && !myClearances.includes(c);
                      return (
                        <Button
                          key={c}
                          type="button"
                          variant={active ? "default" : "outline"}
                          size="sm"
                          disabled={disabled}
                          onClick={() =>
                            setEditData((prev) => ({
                              ...prev,
                              clearance: active
                                ? prev.clearance.filter((x) => x !== c)
                                : [...prev.clearance, c],
                            }))
                          }
                          data-testid={`toggle-clearance-${c.toLowerCase()}`}
                        >
                          {c}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() =>
                updateUserMutation.mutate(
                  canManageAccess
                    ? {
                        ...editData,
                        clearance: editData.clearance.join(","),
                      }
                    : {
                        discordUsername: editData.discordUsername,
                        discordId: editData.discordId,
                        email: editData.email,
                      },
                )
              }
              disabled={updateUserMutation.isPending}
              data-testid="button-save-user"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {isEngineer && pendingRequests && pendingRequests.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">PENDING ACCESS REQUESTS</h2>
              <div className="space-y-2">
                {pendingRequests.map((req) => (
                  <Card key={req.id} data-testid={`access-request-${req.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">
                            {req.requestedByUsername} → {req.targetUsername}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {req.changes.rank !== undefined && `Rank: ${req.changes.rank} `}
                            {req.changes.rankName !== undefined && `Title: ${req.changes.rankName} `}
                            {req.changes.clearance !== undefined && `Clearance: ${req.changes.clearance || "Member"}`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => approveRequestMutation.mutate(req.id)}
                            disabled={approveRequestMutation.isPending}
                            data-testid={`button-approve-${req.id}`}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectRequestMutation.mutate(req.id)}
                            disabled={rejectRequestMutation.isPending}
                            data-testid={`button-reject-${req.id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {user && user.rank >= 8 && (
        <div>
          <h2 className="text-xl font-bold mb-4">ALL USERS</h2>
          <div className="space-y-2">
            {usersLoading ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">Loading users...</p>
                </CardContent>
              </Card>
            ) : allUsers && allUsers.length > 0 ? (
              allUsers.map((staff, idx) => (
                <Card key={staff.id} className="hover-elevate" data-testid={`user-row-${idx}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={staff.robloxAvatar}
                          alt={staff.robloxUsername}
                          className="w-12 h-12 rounded-full"
                          data-testid={`img-avatar-${idx}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold" data-testid={`text-username-${idx}`}>
                              {staff.robloxUsername}
                            </span>
                            {staff.rank >= 140 && (
                              <Badge variant="default" className="text-xs" data-testid={`badge-status-${idx}`}>
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`text-email-${idx}`}>
                            {staff.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Rank</p>
                          <p className="font-medium" data-testid={`text-role-${idx}`}>
                            {staff.rankName || `Rank ${staff.rank}`}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingUser(staff);
                            setEditData({
                              discordUsername: staff.discordUsername || "",
                              discordId: staff.discordId || "",
                              email: staff.email,
                              rank: staff.rank,
                              rankName: staff.rankName || "",
                              clearance: (staff.clearance || "")
                                .split(",")
                                .map((c) => c.trim())
                                .filter(Boolean),
                            });
                          }}
                          data-testid={`button-edit-${idx}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resetPasswordMutation.mutate(staff.id)}
                          data-testid={`button-reset-password-${idx}`}
                        >
                          Reset Pass
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-muted-foreground">No users found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
}
