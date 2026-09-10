import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface OrgMember {
  userId: number;
  username: string;
  displayName: string;
  avatar: string | null;
  bio: string;
}

interface OrgTier {
  key: string;
  label: string;
  subtitle?: string;
  description: string;
  members: OrgMember[];
}

interface OrgChartData {
  owners: OrgTier;
  communityManager: OrgTier;
  deputyManager: OrgTier;
  branches: {
    devs: OrgTier;
    networkAdministrator: OrgTier;
    modLadder: OrgTier[];
  };
}

function PersonCard({
  tier,
  member,
  onOpen,
}: {
  tier: OrgTier;
  member: OrgMember;
  onOpen: (tier: OrgTier, member: OrgMember) => void;
}) {
  return (
    <Card
      className="hover-elevate border-amber-500/20 w-[128px] cursor-pointer"
      onClick={() => onOpen(tier, member)}
      data-testid={`org-person-${tier.key}-${member.userId}`}
    >
      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
        {member.avatar ? (
          <img src={member.avatar} alt={member.username} className="w-14 h-14 rounded-full border-2 border-amber-500/30" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-muted" />
        )}
        <div className="w-full">
          <p className="font-bold text-xs truncate">{member.displayName}</p>
          <p className="text-[10px] text-amber-500/80 font-medium leading-tight">{tier.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function VacantCard({ tier }: { tier: OrgTier }) {
  return (
    <Card className="border-dashed border-muted-foreground/30 w-[128px]" data-testid={`org-vacant-${tier.key}`}>
      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
        <div className="w-14 h-14 rounded-full bg-muted/40" />
        <div className="w-full">
          <p className="font-bold text-xs text-muted-foreground">Vacant</p>
          <p className="text-[10px] text-muted-foreground/80 font-medium leading-tight">{tier.label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function TierSection({
  tier,
  onOpen,
}: {
  tier: OrgTier;
  onOpen: (tier: OrgTier, member: OrgMember) => void;
}) {
  return (
    <div className="text-center">
      {tier.subtitle && <p className="text-[11px] text-amber-500/70 mb-2">{tier.subtitle}</p>}
      <div className="flex flex-wrap justify-center gap-3">
        {tier.members.length > 0 ? (
          tier.members.map((m) => <PersonCard key={m.userId} tier={tier} member={m} onOpen={onOpen} />)
        ) : (
          <VacantCard tier={tier} />
        )}
      </div>
    </div>
  );
}

const CONNECTOR = <div className="w-px h-5 bg-amber-500/30 mx-auto my-3" />;

export default function OrgChart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selected, setSelected] = useState<{ tier: OrgTier; member: OrgMember } | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const myClearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const isStaffManager = myClearances.includes("Staff Manager") || (user?.rank ?? 0) >= 150;

  const { data: chart, isLoading } = useQuery<OrgChartData>({
    queryKey: ["/api/org-chart"],
  });

  const saveBioMutation = useMutation({
    mutationFn: async ({ robloxUserId, bio }: { robloxUserId: string; bio: string }) => {
      return await apiRequest("PATCH", `/api/org-chart/bio/${robloxUserId}`, { bio });
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Bio updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
      setSelected(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const saveDescriptionMutation = useMutation({
    mutationFn: async ({ key, description }: { key: string; description: string }) => {
      return await apiRequest("PATCH", `/api/org-chart/${key}`, { description });
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Job description updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/org-chart"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function openPerson(tier: OrgTier, member: OrgMember) {
    setSelected({ tier, member });
    setBioDraft(member.bio);
    setDescriptionDraft(tier.description);
  }

  const isSelf = selected && user?.robloxUserId === String(selected.member.userId);
  const canEditThisBio = isSelf || isStaffManager;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading org chart...</p>
      </div>
    );
  }

  if (!chart) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Org chart unavailable</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <TierSection tier={chart.owners} onOpen={openPerson} />
      {CONNECTOR}
      <TierSection tier={chart.communityManager} onOpen={openPerson} />
      {CONNECTOR}
      <TierSection tier={chart.deputyManager} onOpen={openPerson} />
      {CONNECTOR}

      {/* Three branches under Deputy Manager: devs, network admin, and the moderation ladder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
        <TierSection tier={chart.branches.devs} onOpen={openPerson} />
        <TierSection tier={chart.branches.networkAdministrator} onOpen={openPerson} />
        <div className="space-y-3">
          {chart.branches.modLadder.map((tier, idx) => (
            <div key={tier.key}>
              {idx > 0 && <div className="w-px h-3 bg-amber-500/30 mx-auto mb-3" />}
              <TierSection tier={tier} onOpen={openPerson} />
            </div>
          ))}
        </div>
      </div>

      {/* Slides in from the side when a person's card is clicked */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent data-testid="sheet-person-bio">
          {selected && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  {selected.member.avatar ? (
                    <img
                      src={selected.member.avatar}
                      alt={selected.member.username}
                      className="w-16 h-16 rounded-full border-2 border-amber-500/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted" />
                  )}
                  <div>
                    <SheetTitle>{selected.member.displayName}</SheetTitle>
                    <SheetDescription>{selected.tier.label}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-sm font-medium mb-2">Bio</p>
                  {canEditThisBio ? (
                    <div className="space-y-2">
                      <Textarea
                        value={bioDraft}
                        onChange={(e) => setBioDraft(e.target.value)}
                        placeholder="Write a short bio..."
                        maxLength={500}
                        rows={5}
                        data-testid="textarea-person-bio"
                      />
                      <Button
                        size="sm"
                        onClick={() =>
                          saveBioMutation.mutate({ robloxUserId: String(selected.member.userId), bio: bioDraft })
                        }
                        disabled={saveBioMutation.isPending}
                        data-testid="button-save-bio"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selected.member.bio || "This person hasn't written a bio yet."}
                    </p>
                  )}
                </div>

                {(selected.tier.description || isStaffManager) && (
                  <div>
                    <p className="text-sm font-medium mb-2">About this position</p>
                    {isStaffManager ? (
                      <div className="space-y-2">
                        <Textarea
                          value={descriptionDraft}
                          onChange={(e) => setDescriptionDraft(e.target.value)}
                          placeholder="Describe this position's responsibilities..."
                          maxLength={500}
                          rows={4}
                          data-testid="textarea-position-description"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            saveDescriptionMutation.mutate({ key: selected.tier.key, description: descriptionDraft })
                          }
                          disabled={saveDescriptionMutation.isPending}
                          data-testid="button-save-position-description"
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{selected.tier.description}</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
