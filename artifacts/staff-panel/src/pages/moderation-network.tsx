import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Construction, Shield, AlertTriangle, Ban, Edit2, Trash2, Eye, Plus } from "lucide-react";

interface RobloxModeration {
  id: string;
  platform: string;
  actionType: string;
  targetId: string;
  targetName: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  evidence?: string | null;
  createdAt: string;
  metadata?: {
    warningId: string;
    acknowledged: boolean;
  };
}

interface DiscordModeration {
  id: string;
  platform: string;
  actionType: string;
  targetId: string;
  targetName: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  evidence: any;
  createdAt: string;
}

export default function ModerationNetwork() {
  const [activeTab, setActiveTab] = useState("roblox");
  const [selectedRobloxMod, setSelectedRobloxMod] = useState<RobloxModeration | null>(null);
  const [editingRobloxMod, setEditingRobloxMod] = useState<RobloxModeration | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newModeration, setNewModeration] = useState({
    actionType: "warning",
    targetRobloxId: "",
    targetRobloxUsername: "",
    reason: "",
    duration: "",
  });
  const { toast } = useToast();

  const { data: robloxModerations = [], isLoading: robloxLoading, refetch: refetchRoblox } = useQuery<RobloxModeration[]>({
    queryKey: ["/api/moderations/roblox"],
    refetchInterval: 5000,
    staleTime: 4000,
  });

  const { data: discordModerations = [], isLoading: discordLoading } = useQuery<DiscordModeration[]>({
    queryKey: ["/api/moderations/discord"],
    refetchInterval: 5000,
    staleTime: 4000,
  });

  const createRobloxMutation = useMutation({
    mutationFn: async (data: typeof newModeration) => {
      return await apiRequest("POST", "/api/moderations/roblox", {
        ...data,
        duration: data.duration ? parseInt(data.duration) : undefined,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Moderation created successfully" });
      setShowAddDialog(false);
      setNewModeration({ actionType: "warning", targetRobloxId: "", targetRobloxUsername: "", reason: "", duration: "" });
      refetchRoblox();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create moderation", variant: "destructive" });
    },
  });

  const updateRobloxMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { actionType?: string; reason?: string; duration?: number } }) => {
      return await apiRequest("PATCH", `/api/moderations/roblox/${id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Moderation updated successfully" });
      setEditingRobloxMod(null);
      refetchRoblox();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update moderation", variant: "destructive" });
    },
  });

  const deleteRobloxMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/moderations/roblox/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Moderation deleted successfully" });
      setSelectedRobloxMod(null);
      refetchRoblox();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete moderation", variant: "destructive" });
    },
  });

  const handleDeleteRoblox = (mod: RobloxModeration) => {
    if (window.confirm(`Are you sure you want to delete this ${mod.actionType} for ${mod.targetName}?`)) {
      deleteRobloxMutation.mutate(mod.id);
    }
  };

  const getDuration = (evidence: string | null | undefined): number | undefined => {
    if (!evidence) return undefined;
    try {
      const parsed = JSON.parse(evidence);
      return parsed.duration;
    } catch {
      return undefined;
    }
  };

  const handleSaveEdit = () => {
    if (!editingRobloxMod) return;
    const duration = getDuration(editingRobloxMod.evidence);
    updateRobloxMutation.mutate({
      id: editingRobloxMod.id,
      data: {
        actionType: editingRobloxMod.actionType,
        reason: editingRobloxMod.reason,
        duration,
      },
    });
  };

  const getActionIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "ban":
      case "gameban":
        return <Ban className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "ban":
      case "gameban":
        return "text-red-500 bg-red-500/10";
      case "warning":
        return "text-yellow-500 bg-yellow-500/10";
      case "kick":
        return "text-orange-500 bg-orange-500/10";
      default:
        return "text-amber-500 bg-amber-500/10";
    }
  };

  const robloxStats = [
    { label: "Total Actions", value: robloxModerations.length.toString(), color: "text-amber-500" },
    { label: "Bans", value: robloxModerations.filter(m => m.actionType.toLowerCase().includes("ban")).length.toString(), color: "text-red-500" },
    { label: "Warnings", value: robloxModerations.filter(m => m.actionType.toLowerCase() === "warning").length.toString(), color: "text-yellow-500" },
  ];

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Moderation Network</h1>
          <p className="text-muted-foreground">Manage moderation records across platforms</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="roblox" className="flex items-center gap-2" data-testid="tab-roblox">
            <Shield className="w-4 h-4" />
            Roblox
          </TabsTrigger>
          <TabsTrigger value="discord" className="flex items-center gap-2" data-testid="tab-discord">
            <Construction className="w-4 h-4" />
            Discord
            <Badge variant="secondary" className="text-xs">WIP</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roblox" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {robloxStats.map((stat, idx) => (
              <Card key={idx} data-testid={`roblox-stat-${idx}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>Roblox Moderations</CardTitle>
                <CardDescription>Game moderation records - click to view details</CardDescription>
              </div>
              <Button onClick={() => setShowAddDialog(true)} size="sm" data-testid="button-add-roblox-moderation">
                <Plus className="w-4 h-4 mr-2" />
                Add Moderation
              </Button>
            </CardHeader>
            <CardContent>
              {robloxLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : robloxModerations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No Roblox moderations recorded</div>
              ) : (
                <div className="space-y-3">
                  {robloxModerations.map((mod) => (
                    <div
                      key={mod.id}
                      onClick={() => setSelectedRobloxMod(mod)}
                      className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition flex items-center justify-between"
                      data-testid={`roblox-moderation-${mod.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getActionColor(mod.actionType)}`}>
                          {getActionIcon(mod.actionType)}
                        </div>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {mod.actionType.toUpperCase()}
                            {getDuration(mod.evidence) && <span className="text-xs text-muted-foreground">({getDuration(mod.evidence)} days)</span>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {mod.targetName} (ID: {mod.targetId})
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">by {mod.moderatorName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">{new Date(mod.createdAt).toLocaleDateString()}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRobloxMod(mod);
                          }}
                          data-testid={`edit-roblox-${mod.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRoblox(mod);
                          }}
                          data-testid={`delete-roblox-${mod.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discord" className="space-y-4">
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Construction className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Work in Progress</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Discord moderation management is currently under development. 
                The Discord bot continues to log all moderation actions automatically.
              </p>
              {discordModerations.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  {discordModerations.length} Discord moderations logged
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={selectedRobloxMod !== null} onOpenChange={() => setSelectedRobloxMod(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Moderation Details</SheetTitle>
            <SheetDescription>View complete moderation information</SheetDescription>
          </SheetHeader>
          {selectedRobloxMod && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${getActionColor(selectedRobloxMod.actionType)}`}>
                  {getActionIcon(selectedRobloxMod.actionType)}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedRobloxMod.actionType.toUpperCase()}</div>
                  {getDuration(selectedRobloxMod.evidence) && (
                    <div className="text-sm text-muted-foreground">{getDuration(selectedRobloxMod.evidence)} day duration</div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Target User</Label>
                  <div className="font-medium">{selectedRobloxMod.targetName}</div>
                  <div className="text-sm text-muted-foreground">Roblox ID: {selectedRobloxMod.targetId}</div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Moderator</Label>
                  <div className="font-medium">{selectedRobloxMod.moderatorName}</div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Reason</Label>
                  <div className="p-3 bg-muted rounded-md text-sm">{selectedRobloxMod.reason}</div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <div>{new Date(selectedRobloxMod.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedRobloxMod(null);
                    setEditingRobloxMod(selectedRobloxMod);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDeleteRoblox(selectedRobloxMod)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={editingRobloxMod !== null} onOpenChange={() => setEditingRobloxMod(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Moderation</DialogTitle>
            <DialogDescription>Update the moderation record</DialogDescription>
          </DialogHeader>
          {editingRobloxMod && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Action Type</Label>
                <Select
                  value={editingRobloxMod.actionType}
                  onValueChange={(value) => setEditingRobloxMod({ ...editingRobloxMod, actionType: value })}
                >
                  <SelectTrigger data-testid="select-edit-action-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="kick">Kick</SelectItem>
                    <SelectItem value="ban">Ban</SelectItem>
                    <SelectItem value="gameban">Game Ban</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={editingRobloxMod.reason}
                  onChange={(e) => setEditingRobloxMod({ ...editingRobloxMod, reason: e.target.value })}
                  data-testid="input-edit-reason"
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (days, optional)</Label>
                <Input
                  type="number"
                  value={getDuration(editingRobloxMod.evidence) || ""}
                  onChange={(e) => setEditingRobloxMod({ 
                    ...editingRobloxMod, 
                    evidence: e.target.value ? JSON.stringify({ duration: parseInt(e.target.value) }) : null 
                  })}
                  placeholder="Leave empty for permanent"
                  data-testid="input-edit-duration"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRobloxMod(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateRobloxMutation.isPending} data-testid="button-save-edit">
              {updateRobloxMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Roblox Moderation</DialogTitle>
            <DialogDescription>Create a new moderation record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select
                value={newModeration.actionType}
                onValueChange={(value) => setNewModeration({ ...newModeration, actionType: value })}
              >
                <SelectTrigger data-testid="select-new-action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                  <SelectItem value="gameban">Game Ban</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Roblox ID</Label>
                <Input
                  value={newModeration.targetRobloxId}
                  onChange={(e) => setNewModeration({ ...newModeration, targetRobloxId: e.target.value })}
                  placeholder="e.g. 123456789"
                  data-testid="input-new-target-id"
                />
              </div>
              <div className="space-y-2">
                <Label>Target Username</Label>
                <Input
                  value={newModeration.targetRobloxUsername}
                  onChange={(e) => setNewModeration({ ...newModeration, targetRobloxUsername: e.target.value })}
                  placeholder="e.g. PlayerName"
                  data-testid="input-new-target-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea
                value={newModeration.reason}
                onChange={(e) => setNewModeration({ ...newModeration, reason: e.target.value })}
                placeholder="Describe the reason for this moderation action"
                data-testid="input-new-reason"
              />
            </div>

            <div className="space-y-2">
              <Label>Duration (days, optional)</Label>
              <Input
                type="number"
                value={newModeration.duration}
                onChange={(e) => setNewModeration({ ...newModeration, duration: e.target.value })}
                placeholder="Leave empty for permanent"
                data-testid="input-new-duration"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createRobloxMutation.mutate(newModeration)}
              disabled={createRobloxMutation.isPending || !newModeration.targetRobloxId || !newModeration.targetRobloxUsername || !newModeration.reason}
              data-testid="button-create-moderation"
            >
              {createRobloxMutation.isPending ? "Creating..." : "Create Moderation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
