import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { Pencil, Trash2 } from "lucide-react";

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

interface ModerationDetailSheetProps {
  moderation: Moderation | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (moderation: Moderation) => void;
  onDelete?: (moderation: Moderation) => void;
}

export function ModerationDetailSheet({ moderation, open, onClose, onEdit, onDelete }: ModerationDetailSheetProps) {
  const { user } = useAuth();
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto" data-testid="sheet-moderation-details">
        <SheetHeader className="border-b border-zinc-700 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Moderation Details</SheetTitle>
            <div className="flex gap-2">
              {user && user.rank >= 7 && onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(moderation)}
                  className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                  data-testid="button-edit-moderation"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              )}
              {user && user.rank >= 7 && onDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(moderation)}
                  data-testid="button-delete-moderation"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                data-testid="button-close-sheet"
              >
                Close
              </Button>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Discord/Roblox ID and Moderator ID Section */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <div className="font-semibold text-zinc-300">{moderation.platform} ID</div>
              <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700">
                <p className="font-mono text-sm text-zinc-400">{moderation.targetId}</p>
                <p className="text-xs text-zinc-500 mt-2">* info is read only</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-zinc-300">Moderator ID</div>
              <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700">
                <p className="font-mono text-sm text-zinc-400">{moderation.moderatorId}</p>
                <p className="text-xs text-zinc-500 mt-2">* info is read only</p>
              </div>
            </div>
          </div>

          {/* Reason Section */}
          <div className="space-y-2">
            <div className="font-semibold text-zinc-300">Reason</div>
            <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700">
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{moderation.reason}</p>
              <p className="text-xs text-zinc-500 mt-2">* info is read only</p>
            </div>
          </div>

          {/* Evidence Section */}
          {evidenceUrl && (
            <div className="space-y-2">
              <div className="font-semibold text-zinc-300">Evidence</div>
              <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700">
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {evidenceUrl}
                </a>
                <p className="text-xs text-zinc-500 mt-2">* info is read only</p>
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-1 gap-4 pt-4 border-t border-zinc-700">
            <div>
              <p className="text-xs text-zinc-500">Action Type</p>
              <Badge className={`${getActionBadgeStyle(moderation.actionType)} mt-1`}>
                {moderation.actionType}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Moderated Date</p>
              <p className="text-sm text-zinc-300 font-medium mt-1">
                {format(new Date(moderation.createdAt), 'MM/dd/yyyy')}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Moderation ID</p>
              <p className="text-sm text-zinc-400 font-mono mt-1">{moderation.id}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
