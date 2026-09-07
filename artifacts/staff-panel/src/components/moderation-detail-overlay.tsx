import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
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

interface ModerationDetailOverlayProps {
  moderation: Moderation | null;
  onClose: () => void;
}

export function ModerationDetailOverlay({ moderation, onClose }: ModerationDetailOverlayProps) {
  if (!moderation) return null;

  const getActionBadgeStyle = (action: string) => {
    switch (action.toLowerCase()) {
      case 'ban':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warn':
      case 'warning':
        return 'bg-amber-500/20 text-yellow-400 border-amber-500/30';
      case 'kick':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'timeout':
      case 'mute':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getEvidenceUrl = (evidence: any) => {
    if (typeof evidence === 'string') return evidence;
    if (evidence?.url) return evidence.url;
    if (evidence?.proof) return evidence.proof;
    return null;
  };

  const evidenceUrl = getEvidenceUrl(moderation.evidence);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 overflow-auto">
      <Card className="w-full max-w-4xl m-4 bg-background" data-testid="overlay-moderation-details">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Moderation Details</h3>
            <Button
              variant="destructive"
              size="sm"
              onClick={onClose}
              data-testid="button-close-overlay"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Discord/Roblox ID and Moderator ID Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{moderation.platform} ID</span>
              </div>
              <div className="bg-muted p-4 rounded-md border border-border">
                <p className="font-mono text-sm text-foreground">{moderation.targetId}</p>
                <p className="text-xs text-muted-foreground mt-2">* info is read only</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Moderator ID</span>
              </div>
              <div className="bg-muted p-4 rounded-md border border-border">
                <p className="font-mono text-sm text-foreground">{moderation.moderatorId}</p>
                <p className="text-xs text-muted-foreground mt-2">* info is read only</p>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Reason</span>
            </div>
            <div className="bg-muted p-4 rounded-md border border-border">
              <p className="text-sm text-foreground whitespace-pre-wrap">{moderation.reason}</p>
              <p className="text-xs text-muted-foreground mt-2">* info is read only</p>
            </div>
          </div>

          {/* Evidence Section */}
          {evidenceUrl && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Evidence</span>
              </div>
              <div className="bg-muted p-4 rounded-md border border-border">
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {evidenceUrl}
                </a>
                <p className="text-xs text-muted-foreground mt-2">* info is read only</p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-xs text-muted-foreground">Action Type</p>
              <Badge className={`${getActionBadgeStyle(moderation.actionType)} mt-1`}>
                {moderation.actionType}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Moderated Date</p>
              <p className="text-sm font-medium mt-1">
                {format(new Date(moderation.createdAt), 'MM/dd/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Moderation ID</p>
              <p className="text-sm font-mono mt-1">{moderation.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
