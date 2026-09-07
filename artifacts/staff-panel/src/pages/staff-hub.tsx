import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Link as LinkIcon, FileText, Eye, ExternalLink, ScrollText, Check, Shield } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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

interface PolicyAcknowledgment {
  userId: string;
  robloxUsername: string;
  robloxAvatar: string;
  acceptedAt: string;
  viewDuration: number | null;
}

const STAFF_OATH = `I solemnly pledge my loyalty to Roman Parthia Remastered and to its people. I shall uphold the law with fairness, guard the community with vigilance, and carry myself with the honour befitting the Empire. I will serve without favour, act without malice, and hold the trust placed in me as sacred. By my hand and by my seal, I swear this oath.`;

// Wax seal element — stamped, embossed look
function WaxSeal({ size = 64, label = "SPQR", sworn = true }: { size?: number; label?: string; sworn?: boolean }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: sworn
          ? "radial-gradient(circle at 35% 30%, #b91c1c, #7f1d1d 70%, #5c1212)"
          : "radial-gradient(circle at 35% 30%, #4b5563, #374151 70%, #1f2937)",
        boxShadow: "inset 0 2px 4px rgba(255,255,255,.25), inset 0 -3px 6px rgba(0,0,0,.45), 0 3px 8px rgba(0,0,0,.5)",
      }}
    >
      <div className="absolute rounded-full border border-amber-200/30" style={{ inset: size * 0.12 }} />
      <div className="absolute rounded-full border border-amber-200/20" style={{ inset: size * 0.2 }} />
      <span className="font-display font-bold text-amber-100/90 tracking-widest" style={{ fontSize: size * 0.22 }}>
        {label}
      </span>
    </div>
  );
}

export default function StaffHub() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showViewers, setShowViewers] = useState<string | null>(null);
  const [showPolicyContent, setShowPolicyContent] = useState<string | null>(null);
  const [showOath, setShowOath] = useState(false);

  const canManage = !!user && user.rank >= 150;
  const hasSworn = !!user?.oathSwornAt;

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
      toast({ title: "Oath Sworn", description: "Your oath has been sealed into the record." });
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

  if (user && user.rank < 97) {
    return (
      <div className="container mx-auto max-w-md p-6">
        <Card className="border-red-500/30">
          <CardHeader className="bg-red-900 text-white py-3">
            <CardTitle className="font-display text-sm tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4" /> RESTRICTED
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 text-center space-y-3">
            <WaxSeal size={56} sworn={false} label="✕" />
            <p className="text-sm text-muted-foreground">
              The Staff Hub is reserved for Trial Moderators and above.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-gradient-to-r from-red-950/40 via-background to-background px-5 py-4">
        <div className="flex items-center gap-3">
          <WaxSeal size={48} />
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide">Staff Hub</h1>
            <p className="text-muted-foreground text-sm">Roman Parthia Remastered · Central Command</p>
          </div>
        </div>
        <img src={brandLogo} alt="Roman Parthia Administration" className="h-16 w-16 md:h-20 md:w-20 object-contain" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left rail */}
        <div className="lg:col-span-1 space-y-5">
          {/* Profile */}
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-red-700 via-amber-500 to-red-700" />
            <CardContent className="pt-5 flex flex-col items-center text-center space-y-3">
              <Avatar className="w-20 h-20 border-4 border-amber-500/30">
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
                  Staff Member Since{(user as any)?.createdAt ? `: ${new Date((user as any).createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Oath of Service */}
          <Card className={`overflow-hidden border ${hasSworn ? "border-amber-500/30 bg-amber-500/5" : "border-red-500/30"}`}>
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-2.5">
              <div className="flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                <CardTitle className="font-display text-sm tracking-wide">OATH OF SERVICE</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center text-center space-y-3">
              {hasSworn ? (
                <>
                  <WaxSeal size={72} sworn />
                  <div>
                    <p className="font-semibold text-sm flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 text-green-500" /> Oath Sworn
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
                  <WaxSeal size={72} sworn={false} label="?" />
                  <p className="text-xs text-muted-foreground">
                    You have not yet sworn the staff oath. All staff are expected to take the oath upon joining the Empire's service.
                  </p>
                  <Button
                    className="w-full bg-red-800 hover:bg-red-700 text-white font-display tracking-wide"
                    onClick={() => setShowOath(true)}
                    data-testid="button-open-oath"
                  >
                    Swear the Oath
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Staff of the Month */}
          {staffOfTheMonth && (
            <Card className="bg-amber-500/10 border-amber-500/20 overflow-hidden">
              <CardHeader className="bg-red-800 text-white py-2.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <CardTitle className="font-display text-sm tracking-wide">STAFF MEMBER OF THE MONTH</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Avatar className="w-14 h-14 border-2 border-amber-500/40">
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
        <div className="lg:col-span-2 space-y-5">
          {/* Quick Links */}
          <Card className="bg-amber-500/5 border-amber-500/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-2.5">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                <CardTitle className="font-display text-sm tracking-wide">QUICK LINKS</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {links.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {links.map((link) => (
                    <Button
                      key={link.id}
                      variant="outline"
                      className="w-full justify-start border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/40"
                      data-testid={`button-quick-link-${link.id}`}
                      onClick={() => window.open(link.url, "_blank")}
                    >
                      <LinkIcon className="w-4 h-4 mr-2 text-amber-500" />
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No quick links yet.{canManage ? " Add them from Staff Management." : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Staff Policies */}
          <Card className="bg-amber-500/5 border-amber-500/20 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-900 to-red-800 text-white py-2.5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <CardTitle className="font-display text-sm tracking-wide">STAFF POLICIES</CardTitle>
              </div>
              {unreadPolicies.length > 0 && (
                <Badge className="bg-amber-500 text-black hover:bg-amber-500">{unreadPolicies.length} to seal</Badge>
              )}
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Pending */}
              {unreadPolicies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-xs uppercase tracking-wider mb-2 text-red-400">Awaiting Your Seal</h3>
                  <div className="space-y-2">
                    {unreadPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 rounded-md border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 cursor-pointer transition-colors flex items-center gap-3"
                        onClick={() => setShowPolicyContent(policy.id)}
                      >
                        <WaxSeal size={36} sworn={false} label="!" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{policy.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{policy.content}</p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-red-800 hover:bg-red-700 text-white whitespace-nowrap"
                          onClick={(e) => { e.stopPropagation(); setShowPolicyContent(policy.id); }}
                          data-testid={`button-read-policy-${policy.id}`}
                        >
                          Read & Seal
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sealed */}
              {readPolicies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-xs uppercase tracking-wider mb-2 text-amber-500/80">Sealed Policies</h3>
                  <div className="space-y-2">
                    {readPolicies.map((policy) => (
                      <div
                        key={policy.id}
                        className="p-3 rounded-md border border-amber-500/20 bg-background hover:bg-amber-500/5 cursor-pointer transition-colors flex items-center gap-3"
                        onClick={() => setShowPolicyContent(policy.id)}
                      >
                        <WaxSeal size={36} sworn label="✓" />
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

      {/* Oath Dialog */}
      <Dialog open={showOath} onOpenChange={setShowOath}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" /> The Staff Oath
            </DialogTitle>
            <DialogDescription>Read carefully before you swear.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative w-full rounded-md border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-5 text-center">
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
                className="w-full bg-red-800 hover:bg-red-700 text-white font-display tracking-wide"
                onClick={() => swearOathMutation.mutate()}
                disabled={swearOathMutation.isPending}
                data-testid="button-swear-oath"
              >
                {swearOathMutation.isPending ? "Sealing..." : "I Swear This Oath"}
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
              <DialogTitle className="font-display tracking-wide">{viewingPolicy.title}</DialogTitle>
              <DialogDescription>By {viewingPolicy.createdByName}</DialogDescription>
            </DialogHeader>
            <div className="bg-background p-4 rounded border max-h-64 overflow-y-auto whitespace-pre-wrap text-sm">
              {viewingPolicy.content}
            </div>
            <div className="flex gap-2 justify-end pt-4 border-t">
              {!viewingPolicy.acknowledged ? (
                <>
                  <Button onClick={() => setShowPolicyContent(null)} variant="outline" data-testid="button-cancel-policy">Cancel</Button>
                  <Button
                    onClick={() => { acknowledgePolicyMutation.mutate(viewingPolicy.id); setShowPolicyContent(null); }}
                    disabled={acknowledgePolicyMutation.isPending}
                    className="bg-red-800 hover:bg-red-700 text-white"
                    data-testid="button-accept-policy-modal"
                  >
                    {acknowledgePolicyMutation.isPending ? "Sealing..." : "Seal & Accept"}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setShowPolicyContent(null)} variant="outline" data-testid="button-close-policy-modal">Close</Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Readers dialog */}
      <Dialog open={!!showViewers} onOpenChange={() => setShowViewers(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display tracking-wide">Who Sealed This Policy</DialogTitle>
            <DialogDescription>Live tracking of policy acknowledgments</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {viewers.map((viewer) => (
              <div key={viewer.userId} className="flex items-center justify-between p-3 bg-background rounded border">
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
                <WaxSeal size={28} sworn label="✓" />
              </div>
            ))}
            {viewers.length === 0 && <p className="text-muted-foreground text-sm">No one has sealed this yet.</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
