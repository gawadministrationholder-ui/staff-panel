import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModerationFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ModerationFormData) => void;
  initialData?: ModerationFormData;
  mode: "create" | "edit";
}

export interface ModerationFormData {
  id?: string;
  platform?: string;
  action: string;
  moderatorId: string;
  moderatorName: string;
  targetId: string;
  targetName: string;
  reason: string;
  details?: string;
}

export function ModerationFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ModerationFormDialogProps) {
  const [formData, setFormData] = useState<ModerationFormData>({
    platform: "discord",
    action: "warning",
    moderatorId: "",
    moderatorName: "",
    targetId: "",
    targetName: "",
    reason: "",
    details: "",
    ...initialData,
  });

  useEffect(() => {
    if (!open) return;
    
    if (mode === "create") {
      // Reset to empty state for create mode
      setFormData({
        platform: "discord",
        action: "warning",
        moderatorId: "",
        moderatorName: "",
        targetId: "",
        targetName: "",
        reason: "",
        details: "",
      });
    } else if (mode === "edit" && initialData) {
      // Use initialData for edit mode - updates whenever initialData changes
      setFormData({ ...initialData });
    }
  }, [mode, initialData, open]);

  const handleSubmit = () => {
    onSubmit(formData);
    // Dialog closes on mutation success, not immediately
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === "create" ? "Create Moderation" : "Edit Moderation"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action" className="text-white">
                Action Type
              </Label>
              <Select
                value={formData.action}
                onValueChange={(value) =>
                  setFormData({ ...formData, action: value })
                }
              >
                <SelectTrigger
                  id="action"
                  className="bg-zinc-800 border-zinc-700 text-white"
                  data-testid="select-action"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                  <SelectItem value="purge">Purge</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform" className="text-white">
                Platform
              </Label>
              <Input
                id="platform"
                value={formData.platform}
                disabled
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-platform"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="moderatorId" className="text-white">
                Moderator ID
              </Label>
              <Input
                id="moderatorId"
                value={formData.moderatorId}
                onChange={(e) =>
                  setFormData({ ...formData, moderatorId: e.target.value })
                }
                placeholder="Enter moderator Discord ID"
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-moderator-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moderatorName" className="text-white">
                Moderator Name
              </Label>
              <Input
                id="moderatorName"
                value={formData.moderatorName}
                onChange={(e) =>
                  setFormData({ ...formData, moderatorName: e.target.value })
                }
                placeholder="Enter moderator name"
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-moderator-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetId" className="text-white">
                Target User ID
              </Label>
              <Input
                id="targetId"
                value={formData.targetId}
                onChange={(e) =>
                  setFormData({ ...formData, targetId: e.target.value })
                }
                placeholder="Enter target Discord ID"
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-target-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetName" className="text-white">
                Target User Name
              </Label>
              <Input
                id="targetName"
                value={formData.targetName}
                onChange={(e) =>
                  setFormData({ ...formData, targetName: e.target.value })
                }
                placeholder="Enter target username"
                className="bg-zinc-800 border-zinc-700 text-white"
                data-testid="input-target-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white">
              Reason
            </Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Enter reason for moderation"
              className="bg-zinc-800 border-zinc-700 text-white min-h-[80px]"
              data-testid="input-reason"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details" className="text-white">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="details"
              value={formData.details}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
              placeholder="Enter any additional details"
              className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
              data-testid="input-details"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-amber-500 hover:bg-yellow-600 text-black"
            data-testid="button-submit"
          >
            {mode === "create" ? "Create" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
