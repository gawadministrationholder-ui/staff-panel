import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertCircle, Trash2, AlertTriangle, X, Award, Link as LinkIcon, Plus, FileText, ScrollText,
  Pencil, Save, Mail, MessageSquare, Hash, Calendar, ChevronRight, ScrollText as OathIcon, Check,
  Ban, UserCheck, KeyRound, SlidersHorizontal,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import RankBadge from "@/components/RankBadge";

interface StaffMember {
  id: string;
  robloxUsername: string;
  robloxUserId: string;
  robloxAvatar: string;
  rank: number;
  rankName: string;
  discordUsername?: string;
  discordId?: string;
  clearance?: string;
  oathSwornAt?: string | null;
  suspended?: boolean;
  suspendedReason?: string | null;
  suspendedAt?: string | null;
  suspendedBy?: string | null;
  createdAt?: string;
  email: string;
}

interface Punishment {
  id: string;
  staffId: string;
  infraction: "strike" | "warning" | "suspension" | "note";
  reason: string;
  issuedBy: string;
  createdAt: string;
}

interface StaffOfTheMonth {
  id: string;
  staffName: string;
  staffRobloxId: string;
  staffAvatar: string;
  setByName: string;
  createdAt: string;
}

const violationTypes = [
  "Failure to Follow Directives given by Superiors",
  "Code of Conduct Violations",
  "Staff Misconduct/Insubordination Violations",
  "Breaking Standing Rules & Regulations",
  "Breach of Staff Confidentiality/Security",
  "Other",
];

// Roman tiers keyed to the real rank hierarchy.
const TIERS: { label: string; min: number; max: number; accent: string }[] = [
  { label: "IMPERIAL COMMAND", min: 200, max: 999, accent: "from-red-800 to-red-950" },
  { label: "ADMINISTRATION", min: 100, max: 199, accent: "from-orange-700 to-red-900" },
  { label: "MODERATION", min: 97, max: 99, accent: "from-amber-700 to-orange-800" },
  { label: "MEMBERS", min: 1, max: 96, accent: "from-neutral-700 to-neutral-900" },
];

export default function StaffManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showStrikeForm, setShowStrikeForm] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [strikeDescription, setStrikeDescription] = useState("");
  const [resolution, setResolution] = useState("");
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newPolicyTitle, setNewPolicyTitle] = useState("");
  const [newPolicyContent, setNewPolicyContent] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editDiscordUsername, setEditDiscordUsername] = useState("");
  const [editDiscordId, setEditDiscordId] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const myClearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const hasStaffManagerAccess = myClearances.includes("Staff Manager");
  const canManageHub = !!user && (user.rank >= 150 || hasStaffManagerAccess);

  const { data: hubLinks = [] } = useQuery<{ id: string; title: string; url: string }[]>({
    queryKey: ["/api/staff-links"],
    enabled: canManageHub,
  });

  const { data: hubPolicies = [] } = useQuery<{ id: string; title: string; createdByName: string }[]>({
    queryKey: ["/api/staff-policies"],
    enabled: canManageHub,
  });

  const addLinkMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/staff-links", { title: newLinkTitle, url: newLinkUrl }),
    onSuccess: () => {
      toast({ title: "Link added", description: "Quick link added to the Staff Hub" });
      setNewLinkTitle(""); setNewLinkUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/staff-links"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/staff-links/${id}`),
    onSuccess: () => {
      toast({ title: "Link removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-links"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addPolicyMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/staff-policies", { title: newPolicyTitle, content: newPolicyContent }),
    onSuccess: () => {
      toast({ title: "Policy added", description: "Staff must now review and seal it" });
      setNewPolicyTitle(""); setNewPolicyContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/staff-policies"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deletePolicyMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/staff-policies/${id}`),
    onSuccess: () => {
      toast({ title: "Policy removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-policies"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const { data: allStaff = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/all-staff"],
    enabled: !!user && user.rank >= 7,
  });

  const { data: punishments = [] } = useQuery<Punishment[]>({
    queryKey: ["/api/punishments"],
    enabled: !!user && user.rank >= 7,
  });

  const { data: staffOfTheMonth = null } = useQuery<StaffOfTheMonth | null>({
    queryKey: ["/api/staff-of-the-month"],
  });

  const addPunishmentMutation = useMutation({
    mutationFn: async (data: { staffId: string; type: string; reason: string }) => {
      return await apiRequest("POST", "/api/punishments", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Strike issued successfully" });
      setShowStrikeForm(false);
      setSelectedViolations([]);
      setStrikeDescription("");
      setResolution("");
      queryClient.invalidateQueries({ queryKey: ["/api/punishments"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to issue strike", variant: "destructive" });
    },
  });

  const deletePunishmentMutation = useMutation({
    mutationFn: async (punishmentId: string) => {
      return await apiRequest("DELETE", `/api/punishments/${punishmentId}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Punishment removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/punishments"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove punishment", variant: "destructive" });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data: { discordUsername: string; discordId: string; email: string }) =>
      apiRequest("PATCH", `/api/users/${selectedStaff!.id}`, data),
    onSuccess: (updated: any) => {
      toast({ title: "Saved", description: "Staff details updated" });
      setSelectedStaff(updated);
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ["/api/all-staff"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const suspendMutation = useMutation({
    mutationFn: async (reason: string) => apiRequest("POST", `/api/users/${selectedStaff!.id}/suspend`, { reason }),
    onSuccess: () => {
      toast({ title: "Staff suspended", description: "Their access has been revoked across the site and bot." });
      setShowSuspend(false); setSuspendReason("");
      setSelectedStaff((s) => (s ? { ...s, suspended: true, suspendedReason: suspendReason, suspendedAt: new Date().toISOString(), suspendedBy: user?.robloxUsername } : s));
      queryClient.invalidateQueries({ queryKey: ["/api/all-staff"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const unsuspendMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/users/${selectedStaff!.id}/unsuspend`, {}),
    onSuccess: () => {
      toast({ title: "Suspension lifted", description: "Access restored." });
      setSelectedStaff((s) => (s ? { ...s, suspended: false, suspendedReason: null, suspendedAt: null, suspendedBy: null } : s));
      queryClient.invalidateQueries({ queryKey: ["/api/all-staff"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/users/${selectedStaff!.id}/reset-password`, {}),
    onSuccess: () => toast({ title: "Password reset", description: "A new temporary password was set; the member must set a new one." }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const setStaffOfTheMonthMutation = useMutation({
    mutationFn: async (staffId: string) => apiRequest("POST", "/api/staff-of-the-month", { staffId }),
    onSuccess: () => {
      toast({ title: "Success", description: "Staff Member of the Month updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-of-the-month"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update Staff Member of the Month", variant: "destructive" });
    },
  });

  const deleteStaffOfTheMonthMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", "/api/staff-of-the-month"),
    onSuccess: () => {
      toast({ title: "Success", description: "Staff Member of the Month removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-of-the-month"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to remove Staff Member of the Month", variant: "destructive" });
    },
  });

  if (user && user.rank < 7 && !hasStaffManagerAccess) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Access Denied
            </CardTitle>
            <CardDescription>
              Staff Management requires rank 7 or higher. Your current rank: {user.rank}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleIssueStrike = (staff: StaffMember) => {
    if (staff.rank > (user?.rank || 0)) {
      toast({ title: "Error", description: "You cannot issue strikes to users with higher rank than you", variant: "destructive" });
      return;
    }
    if (selectedViolations.length === 0 && !strikeDescription.trim()) {
      toast({ title: "Error", description: "Please select violations or provide a description", variant: "destructive" });
      return;
    }
    const reason = selectedViolations.length > 0
      ? selectedViolations.join("; ") + (strikeDescription ? " - " + strikeDescription : "")
      : strikeDescription;
    addPunishmentMutation.mutate({ staffId: staff.id, type: "strike", reason });
  };

  const staffPunishments = (staffId: string) => punishments.filter((p) => p.staffId === staffId);

  const openStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditMode(false);
    setShowStrikeForm(false);
  };

  const startEdit = () => {
    if (!selectedStaff) return;
    setEditDiscordUsername(selectedStaff.discordUsername || "");
    setEditDiscordId(selectedStaff.discordId || "");
    setEditEmail(selectedStaff.email || "");
    setEditMode(true);
  };

  // ─── Staff detail view ────────────────────────────────────────────────
  if (selectedStaff) {
    const info = staffPunishments(selectedStaff.id);
    const sworn = !!selectedStaff.oathSwornAt;
    return (
      <div className="container mx-auto max-w-4xl space-y-5 p-4 md:p-6">
        <Button variant="outline" onClick={() => setSelectedStaff(null)} data-testid="button-back-to-staff">
          ← Back to Staff List
        </Button>

        {/* Header */}
        <Card className="overflow-hidden border-amber-500/20">
          <div className="h-2 bg-gradient-to-r from-red-700 via-amber-500 to-red-700" />
          <CardContent className="pt-5">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-amber-500/30">
                  <AvatarImage src={selectedStaff.robloxAvatar} alt={selectedStaff.robloxUsername} />
                  <AvatarFallback>{selectedStaff.robloxUsername.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-wide">{selectedStaff.robloxUsername}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <RankBadge rank={selectedStaff.rank} />
                    <span className="text-xs text-muted-foreground">Rank {selectedStaff.rank}</span>
                  </div>
                </div>
              </div>
              <div className="text-right space-y-1">
                {sworn ? (
                  <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30 gap-1">
                    <Check className="w-3 h-3" /> Oath Sworn
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Oath Pending</Badge>
                )}
                {info.length > 0 && (
                  <div className="flex items-center justify-end gap-1 text-red-400 text-sm font-semibold">
                    <AlertTriangle className="w-4 h-4" /> {info.length} strike{info.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suspended banner */}
        {selectedStaff.suspended && (
          <Card className="border-red-600/50 bg-red-900/20">
            <CardContent className="py-3 flex items-center gap-3">
              <Ban className="w-5 h-5 text-red-400 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-red-300">Access Suspended</p>
                <p className="text-muted-foreground text-xs">
                  {selectedStaff.suspendedReason || "No reason provided"}
                  {selectedStaff.suspendedBy ? ` · by ${selectedStaff.suspendedBy}` : ""}
                  {selectedStaff.suspendedAt ? ` · ${new Date(selectedStaff.suspendedAt).toLocaleDateString()}` : ""}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Control panel */}
        {user && user.rank >= 150 && (
          <Card className="border-amber-500/20">
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                <CardTitle className="font-display text-sm tracking-wide">CONTROL PANEL</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                {selectedStaff.suspended ? (
                  <Button
                    onClick={() => unsuspendMutation.mutate()}
                    disabled={unsuspendMutation.isPending}
                    className="bg-green-700 hover:bg-green-600 text-white"
                    data-testid="button-unsuspend"
                  >
                    <UserCheck className="w-4 h-4 mr-2" /> Lift Suspension
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowSuspend((v) => !v)}
                    variant="outline"
                    className="border-red-600/40 text-red-400 hover:bg-red-600/10"
                    disabled={selectedStaff.id === user.id || selectedStaff.rank >= user.rank}
                    data-testid="button-suspend"
                  >
                    <Ban className="w-4 h-4 mr-2" /> Suspend
                  </Button>
                )}

                <Button
                  onClick={() => setStaffOfTheMonthMutation.mutate(selectedStaff.id)}
                  disabled={setStaffOfTheMonthMutation.isPending}
                  variant="outline"
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  data-testid="button-set-sotm-detail"
                >
                  <Award className="w-4 h-4 mr-2" /> Set Staff of Month
                </Button>

                {user.rank >= 8 && (
                  <Button
                    onClick={() => { if (window.confirm("Reset this member's password? They'll need to set a new one.")) resetPasswordMutation.mutate(); }}
                    disabled={resetPasswordMutation.isPending}
                    variant="outline"
                    data-testid="button-reset-password"
                  >
                    <KeyRound className="w-4 h-4 mr-2" /> Reset Password
                  </Button>
                )}
              </div>

              {showSuspend && !selectedStaff.suspended && (
                <div className="space-y-2 border-t border-amber-500/15 pt-3">
                  <label className="text-sm font-semibold">Reason for suspension</label>
                  <Textarea
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Why is this member being suspended?"
                    className="min-h-16"
                    data-testid="input-suspend-reason"
                  />
                  <p className="text-xs text-muted-foreground">
                    Suspending revokes this member's staff access on the website and the Discord bot. Their account stays intact and can be restored anytime.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => suspendMutation.mutate(suspendReason)}
                      disabled={suspendMutation.isPending || !suspendReason.trim()}
                      className="bg-red-800 hover:bg-red-700 text-white"
                      data-testid="button-confirm-suspend"
                    >
                      {suspendMutation.isPending ? "Suspending..." : "Confirm Suspension"}
                    </Button>
                    <Button variant="outline" onClick={() => setShowSuspend(false)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Member information / edit */}
        <Card className="border-amber-500/20">
          <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-3 flex flex-row items-center justify-between">
            <CardTitle className="font-display text-sm tracking-wide">MEMBER INFORMATION</CardTitle>
            {!editMode ? (
              <Button size="sm" variant="secondary" className="h-8" onClick={startEdit} data-testid="button-edit-staff">
                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" className="h-8" onClick={() => setEditMode(false)}>Cancel</Button>
                <Button
                  size="sm"
                  className="h-8 bg-amber-500 text-black hover:bg-amber-400"
                  onClick={() => updateStaffMutation.mutate({ discordUsername: editDiscordUsername, discordId: editDiscordId, email: editEmail })}
                  disabled={updateStaffMutation.isPending}
                  data-testid="button-save-staff"
                >
                  <Save className="w-3.5 h-3.5 mr-1" /> {updateStaffMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-5 grid sm:grid-cols-2 gap-4">
            <Field icon={<Hash className="w-4 h-4" />} label="Roblox ID" value={selectedStaff.robloxUserId} />
            <Field icon={<Award className="w-4 h-4" />} label="Clearance" value={selectedStaff.clearance || "—"} />
            <EditableField
              icon={<MessageSquare className="w-4 h-4" />}
              label="Discord Username"
              editing={editMode}
              value={selectedStaff.discordUsername || "—"}
              inputValue={editDiscordUsername}
              onChange={setEditDiscordUsername}
              testid="input-edit-discord-username"
            />
            <EditableField
              icon={<Hash className="w-4 h-4" />}
              label="Discord ID"
              editing={editMode}
              value={selectedStaff.discordId || "—"}
              inputValue={editDiscordId}
              onChange={setEditDiscordId}
              testid="input-edit-discord-id"
            />
            <EditableField
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              editing={editMode}
              value={selectedStaff.email || "—"}
              inputValue={editEmail}
              onChange={setEditEmail}
              testid="input-edit-email"
            />
            <Field
              icon={<Calendar className="w-4 h-4" />}
              label="Member Since"
              value={selectedStaff.createdAt ? new Date(selectedStaff.createdAt).toLocaleDateString() : "—"}
            />
          </CardContent>
        </Card>

        {/* Issue strike */}
        {!showStrikeForm ? (
          <Button
            onClick={() => setShowStrikeForm(true)}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-display tracking-wide"
            data-testid="button-open-strike-form"
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Issue Strike
          </Button>
        ) : (
          <Card className="border-2 border-amber-500/40 bg-amber-500/[0.03] overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold text-center tracking-wide">ADMINISTRATIVE PUNISHMENT</h2>
                  <p className="text-xs text-amber-200/80 text-center">ROMAN PARTHIA STAFF &amp; MODERATION TEAM</p>
                </div>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" onClick={() => setShowStrikeForm(false)} data-testid="button-close-strike-form">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between text-sm">
                <div>
                  <span className="font-semibold">Date:</span>
                  <Badge className="ml-2 bg-red-800 text-white">{new Date().toLocaleDateString()}</Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-semibold">To:</span>
                  <p className="text-muted-foreground mt-1">{selectedStaff.robloxUsername}</p>
                </div>
                <div>
                  <span className="font-semibold">Rank:</span>
                  <p className="text-muted-foreground mt-1">{selectedStaff.rankName}</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex-1">
                  <span className="font-semibold">Re:</span>
                  <div className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded mt-1 text-xs">Administrative Strike</div>
                </div>
                <div className="flex-1">
                  <span className="font-semibold">Action:</span>
                  <div className="bg-red-800 text-white px-3 py-1 rounded mt-1 text-xs font-semibold">Strike</div>
                </div>
              </div>

              <div className="pt-4 border-t border-amber-500/15">
                <p className="font-semibold text-sm mb-3">Dear {selectedStaff.robloxUsername}:</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Pursuant to your actions, you're receiving punishment for the following:
                </p>
                <div className="space-y-2 ml-1 text-sm">
                  {violationTypes.map((violation) => (
                    <div key={violation} className="flex items-center gap-2">
                      <Checkbox
                        id={violation}
                        checked={selectedViolations.includes(violation)}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedViolations([...selectedViolations, violation]);
                          else setSelectedViolations(selectedViolations.filter((v) => v !== violation));
                        }}
                        data-testid={`checkbox-violation-${violation}`}
                      />
                      <label htmlFor={violation} className="text-sm cursor-pointer text-muted-foreground">{violation}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-sm">Description:</label>
                <textarea
                  value={strikeDescription}
                  onChange={(e) => setStrikeDescription(e.target.value)}
                  placeholder="Provide details about the violation..."
                  className="w-full p-2 border rounded text-sm bg-background text-foreground"
                  rows={3}
                  data-testid="input-strike-description"
                />
              </div>

              <div className="space-y-2">
                <label className="font-semibold text-sm">Resolution:</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="What actions must be taken to improve..."
                  className="w-full p-2 border rounded text-sm bg-background text-foreground"
                  rows={2}
                  data-testid="input-strike-resolution"
                />
              </div>

              <div className="pt-4 border-t border-amber-500/15 text-sm">
                <p className="font-semibold mb-2">Sincerely,</p>
                <p className="font-semibold">{user?.robloxUsername}</p>
                <p className="text-muted-foreground">{user?.rankName}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleIssueStrike(selectedStaff)}
                  disabled={addPunishmentMutation.isPending}
                  className="flex-1 bg-red-800 hover:bg-red-700 text-white"
                  data-testid="button-submit-strike"
                >
                  {addPunishmentMutation.isPending ? "Issuing Strike..." : "Issue Strike"}
                </Button>
                <Button variant="outline" onClick={() => setShowStrikeForm(false)} data-testid="button-cancel-strike">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* History */}
        <Card className="border-amber-500/20">
          <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-3">
            <CardTitle className="font-display text-sm tracking-wide">PUNISHMENT HISTORY</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {info.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No punishments on record.</p>
            ) : (
              <div className="space-y-3">
                {info.map((p) => (
                  <div key={p.id} className="flex items-start justify-between p-3 rounded-md border border-red-500/20 bg-red-500/[0.04]" data-testid={`punishment-${p.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-red-800 text-white">{p.infraction.toUpperCase()}</Badge>
                        <span className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm">{p.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">Issued by: {p.issuedBy}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Delete this punishment?")) deletePunishmentMutation.mutate(p.id); }} data-testid={`button-delete-punishment-${p.id}`}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Staff list view ──────────────────────────────────────────────────
  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-1 tracking-wide">Staff Management</h1>
        <p className="text-muted-foreground">Manage staff members, punishments, and the Staff Hub</p>
      </div>

      {canManageHub && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-3">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                <CardTitle className="font-display text-sm tracking-wide">STAFF HUB · QUICK LINKS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                {hubLinks.length === 0 && <p className="text-sm text-muted-foreground">No quick links yet.</p>}
                {hubLinks.map((link) => (
                  <div key={link.id} className="flex items-center gap-2 p-2 rounded border border-amber-500/20 bg-background">
                    <LinkIcon className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteLinkMutation.mutate(link.id)} disabled={deleteLinkMutation.isPending} data-testid={`button-delete-link-${link.id}`}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                <Input placeholder="Link title (e.g. Staff Guidelines)" value={newLinkTitle} onChange={(e) => setNewLinkTitle(e.target.value)} data-testid="input-link-title" />
                <Input placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} data-testid="input-link-url" />
                <Button className="w-full bg-red-800 hover:bg-red-700 text-white" onClick={() => addLinkMutation.mutate()} disabled={addLinkMutation.isPending || !newLinkTitle || !newLinkUrl} data-testid="button-add-link">
                  <Plus className="w-4 h-4 mr-1" /> Add Quick Link
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-amber-500/5 border-amber-500/20">
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-3">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5" />
                <CardTitle className="font-display text-sm tracking-wide">STAFF HUB · POLICIES</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div className="space-y-2">
                {hubPolicies.length === 0 && <p className="text-sm text-muted-foreground">No policies issued yet.</p>}
                {hubPolicies.map((policy) => (
                  <div key={policy.id} className="flex items-center gap-2 p-2 rounded border border-amber-500/20 bg-background">
                    <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{policy.title}</p>
                      <p className="text-xs text-muted-foreground truncate">By {policy.createdByName}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deletePolicyMutation.mutate(policy.id)} disabled={deletePolicyMutation.isPending} data-testid={`button-delete-policy-${policy.id}`}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-4">
                <Input placeholder="Policy title (e.g. Code of Conduct)" value={newPolicyTitle} onChange={(e) => setNewPolicyTitle(e.target.value)} data-testid="input-policy-title" />
                <Textarea placeholder="Full policy content..." value={newPolicyContent} onChange={(e) => setNewPolicyContent(e.target.value)} className="min-h-20" data-testid="textarea-policy-content" />
                <Button className="w-full bg-red-800 hover:bg-red-700 text-white" onClick={() => addPolicyMutation.mutate()} disabled={addPolicyMutation.isPending || !newPolicyTitle || !newPolicyContent} data-testid="button-add-policy">
                  <Plus className="w-4 h-4 mr-1" /> Issue Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {user && user.rank >= 8 && (
        <Card className="bg-amber-500/10 border-amber-500/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              <CardTitle className="font-display text-sm tracking-wide">STAFF MEMBER OF THE MONTH</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {staffOfTheMonth ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 border-2 border-amber-500/40">
                    <AvatarImage src={staffOfTheMonth.staffAvatar} alt={staffOfTheMonth.staffName} />
                    <AvatarFallback>{staffOfTheMonth.staffName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg" data-testid="text-current-sotm">{staffOfTheMonth.staffName}</p>
                    <p className="text-sm text-muted-foreground">
                      Set by {staffOfTheMonth.setByName} on {new Date(staffOfTheMonth.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="destructive" size="sm" onClick={() => deleteStaffOfTheMonthMutation.mutate()} disabled={deleteStaffOfTheMonthMutation.isPending} data-testid="button-remove-sotm">
                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">No staff member of the month selected</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {allStaff.map((staff) => (
                    <Button key={staff.id} variant="outline" className="h-auto flex flex-col items-center py-3 gap-2" onClick={() => setStaffOfTheMonthMutation.mutate(staff.id)} disabled={setStaffOfTheMonthMutation.isPending} data-testid={`button-set-sotm-${staff.id}`}>
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={staff.robloxAvatar} alt={staff.robloxUsername} />
                        <AvatarFallback>{staff.robloxUsername.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="text-center">
                        <p className="text-sm font-medium">{staff.robloxUsername}</p>
                        <p className="text-xs text-muted-foreground">{staff.rankName}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Roster — one card per member */}
      {TIERS.map((tier) => {
        const members = allStaff
          .filter((s) => s.rank >= tier.min && s.rank <= tier.max)
          .sort((a, b) => b.rank - a.rank);
        if (members.length === 0) return null;
        return (
          <div key={tier.label}>
            <h2 className="font-display text-lg font-bold mb-3 flex items-center gap-2 tracking-wide">
              {tier.label}
              <Badge variant="secondary">{members.length}</Badge>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {members.map((staff) => {
                const strikes = staffPunishments(staff.id).length;
                const sworn = !!staff.oathSwornAt;
                return (
                  <Card
                    key={staff.id}
                    className="group relative overflow-hidden border-amber-500/15 hover:border-amber-500/40 transition-colors cursor-pointer"
                    onClick={() => openStaff(staff)}
                    data-testid={`staff-card-${staff.id}`}
                  >
                    <div className={`h-1.5 bg-gradient-to-r ${staff.suspended ? "from-red-600 to-red-900" : tier.accent}`} />
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-14 h-14 border-2 ${staff.suspended ? "border-red-600/40 opacity-70" : "border-amber-500/25"}`}>
                          <AvatarImage src={staff.robloxAvatar} alt={staff.robloxUsername} />
                          <AvatarFallback>{staff.robloxUsername.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{staff.robloxUsername}</p>
                            {staff.suspended && (
                              <Badge className="bg-red-800 text-white text-[10px] px-1.5 py-0 shrink-0">SUSPENDED</Badge>
                            )}
                          </div>
                          <div className="mt-1"><RankBadge rank={staff.rank} /></div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="truncate">{staff.discordUsername || "No Discord linked"}</span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-amber-500/10 flex items-center justify-between text-xs">
                        {sworn ? (
                          <span className="flex items-center gap-1 text-amber-400"><Check className="w-3.5 h-3.5" /> Oath sworn</span>
                        ) : (
                          <span className="text-muted-foreground">Oath pending</span>
                        )}
                        {strikes > 0 ? (
                          <span className="flex items-center gap-1 text-red-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> {strikes} strike{strikes > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Clean record</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Small presentational helpers ────────────────────────────────────────
function Field({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">{icon}{label}</p>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  );
}

function EditableField({
  icon, label, editing, value, inputValue, onChange, testid,
}: {
  icon: ReactNode; label: string; editing: boolean; value: string;
  inputValue: string; onChange: (v: string) => void; testid: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 mb-1">{icon}{label}</p>
      {editing ? (
        <Input value={inputValue} onChange={(e) => onChange(e.target.value)} className="h-8" data-testid={testid} />
      ) : (
        <p className="text-sm font-medium break-all">{value}</p>
      )}
    </div>
  );
}
