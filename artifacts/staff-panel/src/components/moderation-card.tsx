import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface Moderation {
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
  metadata?: any;
}

interface ModerationCardProps {
  moderation: Moderation;
}

export function ModerationCard({ moderation }: ModerationCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'ban':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'kick':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'timeout':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getEvidenceUrl = () => {
    if (typeof moderation.evidence === 'string') return moderation.evidence;
    if (moderation.evidence?.url) return moderation.evidence.url;
    if (moderation.evidence?.proof) return moderation.evidence.proof;
    return null;
  };

  const evidenceUrl = getEvidenceUrl();

  return (
    <>
      <Card
        className="p-4 hover-elevate active-elevate-2 cursor-pointer"
        onClick={() => setIsOpen(true)}
        data-testid={`card-moderation-${moderation.id}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Badge className={getActionColor(moderation.actionType)}>
              {moderation.actionType.toUpperCase()}
            </Badge>
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate text-foreground">
                {moderation.targetName}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                by {moderation.moderatorName}
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {format(new Date(moderation.createdAt), 'MMM d, yyyy')}
          </div>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-moderation-details">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Moderation Details</DialogTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-dialog"
              >
                Close
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {moderation.platform === 'Discord' ? 'Discord ID' : 'Roblox ID'}
                </Label>
                <div className="p-3 rounded-md bg-muted">
                  <span className="font-mono text-sm">{moderation.targetId}</span>
                  <p className="text-xs text-muted-foreground mt-1">* info is read only</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Moderator ID</Label>
                <div className="p-3 rounded-md bg-muted">
                  <span className="font-mono text-sm">{moderation.moderatorId}</span>
                  <p className="text-xs text-muted-foreground mt-1">* info is read only</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Reason</Label>
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm">{moderation.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">* info is read only</p>
              </div>
            </div>

            {evidenceUrl && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Evidence</Label>
                <div className="p-3 rounded-md bg-muted">
                  <a
                    href={evidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all"
                  >
                    {evidenceUrl}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">* info is read only</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Action Type</p>
                <Badge className={`${getActionColor(moderation.actionType)} mt-1`}>
                  {moderation.actionType}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium mt-1">
                  {format(new Date(moderation.createdAt), 'PPpp')}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
