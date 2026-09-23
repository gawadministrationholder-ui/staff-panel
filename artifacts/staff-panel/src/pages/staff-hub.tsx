import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Link as LinkIcon, FileText, Eye, ExternalLink, ScrollText, Check, Shield, Radio, Megaphone, Plus, ClipboardCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import brandLogo from "../assets/brand-logo.png";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StaffOfTheMonth {
  id: string;
  staffName: string;
  staffRobloxId: string;
  staffAvatar: string;
  setByName: string;
  createdAt: string;
}

interface StaffPolicy {
  id: string;
  title: string;
  content: string;
  createdByName: string;
  createdAt: string;
  acknowledged?: boolean;
}

interface StaffLink {
  id: string;
  title: string;
  url: string;
  icon: string;
}

interface SystemStatus {
  discordBot: { online: boolean; lastSeenAt: string | null };
  roblox: { online: boolean };
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdByName: string;
  createdAt: string;
}

interface PendingAccessRequest {
  id: string;
}

interface PolicyAcknowledgment {
  userId: string;
  robloxUsername: string;
  robloxAvatar: string;
  acceptedAt: string;
  viewDuration: number | null;
}

const STAFF_OATH = `I solemnly pledge my loyalty to GAW and to its people. I shall uphold the law with fairness, guard the community with vigilance, and carry myself with the honour befitting this office. I will serve without favour, act without malice, and hold the trust placed in me as sacred. By my hand and by my seal, I swear this oath.`;

/**
 * The wax seal is the one deliberately ornamental element on this page —
 * everything else stays quiet so this keeps its weight. It appears exactly
 * twice: once on the letterhead, once on the oath itself.
 */
function WaxSeal({ size = 64, label = "SPQR", sworn = true }: { size?: number; label?: string; sworn?: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: sworn
          ? "radial-gradient(circle at 35% 30%, hsl(var(--accent-foreground)), hsl(var(--accent)) 65%, hsl(var(--accent)))"
          : "radial-gradient(circle at 35% 30%, #4b5563, #374151 70%, #1f2937)",
        boxShadow: "inset 0 2px 4px rgba(255,255,255,.2), inset 0 -3px 6px rgba(0,0,0,.5), 0 3px 10px rgba(0,0,0,.45)",
      }}
    >
      <div className="absolute rounded-full border border-primary-foreground/25" style={{ inset: size * 0.12 }} />
      <div className="absolute rounded-full border border-primary-foreground/15" style={{ inset: size * 0.2 }} />
      <span className="font-display font-bold text-primary-foreground/90 tracking-widest" style={{ fontSize: size * 0.2 }}>
        {label}
      </span>
    </div>
  );
}

/** A single row in the Directory list. Not a button grid — a plain, scannable index. */
function DirectoryRow({ link }: { link: StaffLink }) {
  return (
    <button
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left hover-elevate active-elevate-2 border border-transparent"
      onClick={() => window.open(link.url, "_blank")}
      data-testid={`button-quick-link-${link.id}`}
    >
      <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="flex-1 min-w-0 truncate text-sm">{link.title}</span>
      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    </button>
  );
}

export default function StaffHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [showViewers, setShowViewers] = useState<string | null>(null);
  const [showPolicyContent, setShowPolicyContent] = useState<string | null>(null);
  const [showOath, setShowOath] = useState(false);
  const [showNewAnnouncement, setShowNewAnnouncement] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");

  const clearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canManage =
    !!user && (clearances.includes("Staff Manager") || clearances.includes("Executive") || clearances.includes("Network Administrator") || clearances.includes("Network Engineer"));
  const hasSworn = !!user?.oathSwornAt;

  const canPostAnnouncements =
    clearances.includes("Executive") ||
    clearances.includes("Network Administrator") ||
    clearances.includes("Network Engineer");
  const canSeeApprovals = clearances.includes("Network Engineer");

  const { data: status } = useQuery<SystemStatus>({
    queryKey: ["/api/status"],
    refetchInterval: 30000,
  });

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const { data: pendingApprovals = [] } = useQuery<PendingAccessRequest[]>({
    queryKey: ["/api/access-requests"],
    enabled: canSeeApprovals,
  });

  const postAnnouncementMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/announcements", { title: announcementTitle, content: announcementContent }),
    onSuccess: () => {
      toast({ title: "Posted" });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      setShowNewAnnouncement(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: staffOfTheMonth = null } = useQuery<StaffOfTheMonth | null>({
    queryKey: ["/api/staff-of-the-month"],
  });

  const { data: policies = [], refetch: refetchPolicies } = useQuery<StaffPolicy[]>({
    queryKey: ["/api/staff-policies"],
    refetchInterval: 5000,
  });

  const { data: links = [] } = useQuery<StaffLink[]>({
    queryKey: ["/api/staff-links"],
  });

  const { data: viewers = [] } = useQuery<PolicyAcknowledgment[]>({
    queryKey: ["/api/staff-policies", showViewers, "acknowledgments"],
    enabled: !!showViewers,
  });

  const acknowledgePolicyMutation = useMutation({
    mutationFn: async (policyId: string) => {
      return await apiRequest("POST", `/api/staff-policies/${policyId}/acknowledge`, { viewDuration: 0 });
    },
    onSuccess: () => {
      toast({ title: "Sealed", description: "Policy acknowledged" });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-policies"] });
      refetchPolicies();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const swearOathMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/swear-oath", {}),
    onSuccess: () => {
      toast({ title: "Oath sworn", description: "Your oath has been sealed into the record." });
      setShowOath(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unreadPolicies = policies.filter((p) => !p.acknowledged);
  const readPolicies = policies.filter((p) => p.acknowledged);
  const viewingPolicy = policies.find((p) => p.id === showPolicyContent);

  if (user && clearances.length === 0) {
    return (
      <div className="container mx-auto max-w-md p-6">
        <Card className="overflow-hidden">
          <div className="h-1 bg-accent" />
          <CardContent className="pt-6 pb-6 text-center space-y-3">
            <Shield className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="font-display text-sm tracking-wide">Restricted</p>
            <p className="text-sm text-muted-foreground">
              The Staff Hub is reserved for Trial Moderators and above.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      {/* Letterhead */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-5 md:px-6">
          <WaxSeal size={52} />
          <div className="flex-1 min-w-0">
            <p className="font-display text-xs tracking-[0.2em] text-muted-foreground">GAW</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Staff Hub</h1>
          </div>
          <img src={brandLogo} alt="GAW Administration" className="h-12 w-12 md:h-14 md:w-14 object-contain shrink-0" />
        </div>
        <div className="h-px bg-border" />
        <div className="h-px bg-accent/60" />
        <p className="px-5 py-2.5 md:px-6 text-xs text-muted-foreground font-serif italic">
          Where GAW's staff take their oath, keep the decrees, and answer the call.
        </p>
      </div>

      {/* Pending approvals — Network Engineers only */}
      {canSeeApprovals && pendingApprovals.length > 0 && (
        <div
          className="flex items-center gap-3 rounded-md border border-accent bg-accent/10 px-4 py-3 cursor-pointer hover-elevate active-elevate-2"
          onClick={() => setLocation("/developer-portal")}
          data-testid="banner-pending-approvals"
        >
          <ClipboardCheck className="w-4 h-4 text-accent-foreground shrink-0" />
          <p className="text-sm flex-1">
            <span className="font-semibold">{pendingApprovals.length}</span>{" "}
            access {pendingApprovals.length === 1 ? "change" : "changes"} awaiting your approval
          </p>
          <span className="text-xs text-muted-foreground">Review in Developer Portal →</span>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left rail */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personal record */}
          <Card className="overflow-hidden">
            <CardContent className="pt-6 flex flex-col items-center text-center space-y-3">
              <Avatar className="w-20 h-20 border-2 border-border">
                <AvatarImage src={user?.robloxAvatar} alt={user?.robloxUsername} />
                <AvatarFallback>{user?.robloxUsername.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold" data-testid="text-profile-username">{user?.robloxUsername}</h2>
                {user?.rankName && (
                  <Badge variant="secondary" className="mt-1.5" data-testid="badge-profile-rank">
                    {user.rankName}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Staff member since{(user as any)?.createdAt ? ` ${new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Oath of service */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <ScrollText className="w-4 h-4" />
                <CardTitle className="font-display text-sm">Oath of service</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center space-y-3">
              {hasSworn ? (
                <>
                  <WaxSeal size={68} sworn />
                  <div>
                    <p className="font-semibold text-sm flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-primary" /> Oath sworn
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sealed on {new Date(user!.oathSwornAt as string).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setShowOath(true)}>
                    Read the oath
                  </Button>
                </>
              ) : (
                <>
                  <WaxSeal size={68} sworn={false} label="?" />
                  <p className="text-xs text-muted-foreground">
                    You have not yet sworn the staff oath. All staff are expected to take the oath upon joining.
                  </p>
                  <Button
                    className="w-full font-display tracking-wide"
                    onClick={() => setShowOath(true)}
                    data-testid="button-open-oath"
                  >
                    Swear the oath
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* System status */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Radio className="w-4 h-4" />
                <CardTitle className="font-display text-sm">Status</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discord bot</span>
                <span className="flex items-center gap-1.5" data-testid="status-discord-bot">
                  <span className={`w-2 h-2 rounded-full ${status?.discordBot.online ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  {status?.discordBot.online ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Roblox</span>
                <span className="flex items-center gap-1.5" data-testid="status-roblox">
                  <span className={`w-2 h-2 rounded-full ${status?.roblox.online ? "bg-primary" : "bg-muted-foreground/40"}`} />
                  {status?.roblox.online ? "Online" : "Offline"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Staff of the month */}
          {staffOfTheMonth && (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <CardTitle className="font-display text-sm">Staff member of the month</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="w-14 h-14 border-2 border-border">
                    <AvatarImage src={staffOfTheMonth.staffAvatar} alt={staffOfTheMonth.staffName} />
                    <AvatarFallback>{staffOfTheMonth.staffName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm" data-testid="text-staff-of-month">{staffOfTheMonth.staffName}</p>
                    <p className="text-xs text-muted-foreground">Set by {staffOfTheMonth.setByName}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Megaphone className="w-4 h-4" />
                <CardTitle className="font-display text-sm">Announcements</CardTitle>
              </div>
              {canPostAnnouncements && (
                <Button size="sm" variant="outline" onClick={() => setShowNewAnnouncement(true)} data-testid="button-new-announcement">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-md border border-border" data-testid={`announcement-${a.id}`}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-muted-foreground shrink-0">{new Date(a.createdAt).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.content}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">— {a.createdByName}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No announcements yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Directory */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <LinkIcon className="w-4 h-4" />
                <CardTitle className="font-display text-sm">Directory</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {links.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-1">
                  {links.map((link) => (
                    <DirectoryRow key={link.id} link={link} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No links yet.{canManage ? " Add them from Staff Management." : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Decrees (staff policies) */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-4 h-4" />
                <CardTitle className="font-display text-sm">Decrees</CardTitle>
              </div>
              {unreadPolicies.length > 0 && (
                <Badge className="bg-accent text-accent-foreground border-accent-border">{unreadPolicies.length} to seal</Badge>
              )}
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Pending */}
              {unreadPolicies.length > 0 && (
                <div>
                  <h3 className="text-xs text-muted-foreground mb-2">Awaiting your seal</h3>
                  <div className="space-y-2">
                    {unreadPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 rounded-md border-l-2 border-accent bg-accent/10 hover-elevate active-elevate-2 cursor-pointer flex items-center gap-3"
                        onClick={() => setShowPolicyContent(policy.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{policy.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{policy.content}</p>
                        </div>
                        <Button
                          size="sm"
                          className="whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); setShowPolicyContent(policy.id); }}
                          data-testid={`button-read-policy-${policy.id}`}
                        >
                          Read &amp; seal
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sealed */}
              {readPolicies.length > 0 && (
                <div>
                  <h3 className="text-xs text-muted-foreground mb-2">Sealed</h3>
                  <div className="space-y-2">
                    {readPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 rounded-md border-l-2 border-border hover-elevate active-elevate-2 cursor-pointer flex items-center gap-3"
                        onClick={() => setShowPolicyContent(policy.id)}
                      >
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{policy.title}</p>
                          <p className="text-xs text-muted-foreground">By {policy.createdByName}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowPolicyContent(policy.id); }} data-testid={`button-view-policy-${policy.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canManage && (
                            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setShowViewers(policy.id); }} data-testid={`button-view-readers-${policy.id}`}>
                              <Users className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {policies.length === 0 && (
                <p className="text-sm text-muted-foreground">No policies have been issued yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Oath dialog */}
      <Dialog open={showOath} onOpenChange={setShowOath}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent-foreground" /> The staff oath
            </DialogTitle>
            <DialogDescription>Read carefully before you swear.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-full rounded-md border border-border bg-accent/5 p-5 text-center">
              <p className="font-display text-sm leading-relaxed italic">&ldquo;{STAFF_OATH}&rdquo;</p>
            </div>
            {hasSworn ? (
              <div className="flex items-center gap-3">
                <WaxSeal size={56} sworn />
                <div className="text-sm">
                  <p className="font-semibold">Already sworn</p>
                  <p className="text-xs text-muted-foreground">Sealed on {new Date(user!.oathSwornAt as string).toLocaleDateString()}</p>
                </div>
              </div>
            ) : (
              <Button
                className="w-full font-display tracking-wide"
                onClick={() => swearOathMutation.mutate()}
                disabled={swearOathMutation.isPending}
                data-testid="button-swear-oath"
              >
                {swearOathMutation.isPending ? "Sealing..." : "I swear this oath"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Policy content / acknowledge dialog */}
      {viewingPolicy && (
        <Dialog open={!!showPolicyContent} onOpenChange={() => setShowPolicyContent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">{viewingPolicy.title}</DialogTitle>
              <DialogDescription>By {viewingPolicy.createdByName}</DialogDescription>
            </DialogHeader>
            <div className="bg-background p-4 rounded border border-border max-h-64 overflow-y-auto whitespace-pre-wrap text-sm">
              {viewingPolicy.content}
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t border-border">
              {!viewingPolicy.acknowledged ? (
                <>
                  <Button onClick={() => setShowPolicyContent(null)} variant="outline" data-testid="button-cancel-policy">Cancel</Button>
                  <Button
                    onClick={() => { acknowledgePolicyMutation.mutate(viewingPolicy.id); setShowPolicyContent(null); }}
                    disabled={acknowledgePolicyMutation.isPending}
                    data-testid="button-accept-policy-modal"
                  >
                    {acknowledgePolicyMutation.isPending ? "Sealing..." : "Seal & accept"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowPolicyContent(null)} variant="outline" data-testid="button-close-policy-modal">Close</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New announcement dialog */}
      <Dialog open={showNewAnnouncement} onOpenChange={setShowNewAnnouncement}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">New announcement</DialogTitle>
            <DialogDescription>Visible to all staff on the Hub.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Title"
              data-testid="input-announcement-title"
            />
            <Textarea
              value={announcementContent}
              onChange={(e) => setAnnouncementContent(e.target.value)}
              placeholder="What's going on?"
              rows={4}
              data-testid="input-announcement-content"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowNewAnnouncement(false)}>Cancel</Button>
            <Button
              onClick={() => postAnnouncementMutation.mutate()}
              disabled={!announcementTitle.trim() || !announcementContent.trim() || postAnnouncementMutation.isPending}
              data-testid="button-post-announcement"
            >
              {postAnnouncementMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Readers dialog */}
      <Dialog open={!!showViewers} onOpenChange={() => setShowViewers(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Who sealed this policy</DialogTitle>
            <DialogDescription>Live tracking of policy acknowledgments</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {viewers.map((viewer) => (
              <div key={viewer.userId} className="flex items-center justify-between p-3 bg-background rounded border border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={viewer.robloxAvatar} alt={viewer.robloxUsername} />
                    <AvatarFallback>{viewer.robloxUsername.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{viewer.robloxUsername}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(viewer.acceptedAt).toLocaleDateString()}
                      {viewer.viewDuration && ` • ${viewer.viewDuration}s`}
                    </p>
                  </div>
                </div>
                <Check className="w-4 h-4 text-primary" />
              </div>
            ))}
            {viewers.length === 0 && <p className="text-muted-foreground text-sm">No one has sealed this yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
