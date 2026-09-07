import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ModerationTable } from "@/components/moderation-table";
import { ModerationDetailSheet } from "@/components/moderation-detail-sheet";
import { ModerationFormDialog, type ModerationFormData } from "@/components/moderation-form-dialog";

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
}

export default function DiscordModerations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModeration, setSelectedModeration] = useState<Moderation | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingModeration, setEditingModeration] = useState<ModerationFormData | undefined>(undefined);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: allModerations, isLoading } = useQuery<Moderation[]>({
    queryKey: ["/api/moderations/discord"],
    refetchInterval: 5000,
  });

  const filteredModerations = allModerations?.filter((mod) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      mod.targetName.toLowerCase().includes(searchLower) ||
      mod.targetId.includes(searchTerm) ||
      mod.moderatorName.toLowerCase().includes(searchLower) ||
      mod.moderatorId.includes(searchTerm) ||
      mod.reason.toLowerCase().includes(searchLower)
    );
  }) || [];

  const createMutation = useMutation({
    mutationFn: async (data: ModerationFormData) => {
      return await apiRequest("POST", "/api/moderations/discord", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderations/discord"] });
      setFormOpen(false);
      toast({
        title: "Success",
        description: "Moderation created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create moderation",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ModerationFormData }) => {
      return await apiRequest("PATCH", `/api/moderations/discord/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderations/discord"] });
      setSelectedModeration(null);
      setFormOpen(false);
      toast({
        title: "Success",
        description: "Moderation updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update moderation",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/moderations/discord/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderations/discord"] });
      setSelectedModeration(null);
      toast({
        title: "Success",
        description: "Moderation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete moderation",
        variant: "destructive",
      });
    },
  });

  const handleCreateModeration = () => {
    setFormMode("create");
    setEditingModeration(undefined);
    setFormOpen(true);
  };

  const handleEditModeration = (moderation: Moderation) => {
    setFormMode("edit");
    setEditingModeration({
      id: moderation.id,
      platform: moderation.platform,
      action: moderation.actionType,
      moderatorId: moderation.moderatorId,
      moderatorName: moderation.moderatorName,
      targetId: moderation.targetId,
      targetName: moderation.targetName,
      reason: moderation.reason,
      details: moderation.evidence ? JSON.stringify(moderation.evidence) : "",
    });
    setFormOpen(true);
  };

  const handleDeleteModeration = (moderation: Moderation) => {
    if (window.confirm(`Are you sure you want to delete this ${moderation.actionType} moderation for ${moderation.targetName}?`)) {
      deleteMutation.mutate(moderation.id);
    }
  };

  const handleFormSubmit = (data: ModerationFormData) => {
    if (formMode === "create") {
      createMutation.mutate(data);
    } else if (formMode === "edit" && data.id) {
      updateMutation.mutate({ id: data.id, data });
    }
  };

  if (!user || user.rank < 3) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need rank 3 or higher to access the Moderation Network.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-4 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-muted/50 border border-border rounded-md p-4 flex items-center justify-center">
        <h1 className="text-xl font-semibold text-foreground">
          Discord Moderation Actions
        </h1>
      </div>

      {/* Create Button - Only for rank 7+ */}
      {user && user.rank >= 7 && (
        <div className="flex justify-center">
          <Button
            className="bg-green-600 hover:bg-green-700 text-white px-8"
            onClick={handleCreateModeration}
            data-testid="button-create-moderation"
          >
            Create Moderation
          </Button>
        </div>
      )}

      {/* Discord Moderations Title */}
      <div className="bg-muted/30 border border-border rounded-md p-3 flex items-center justify-center">
        <h2 className="text-lg font-medium text-foreground">
          Discord Moderations
        </h2>
      </div>

      {/* Search Filter */}
      <div className="bg-muted/20 border border-border rounded-md p-3">
        <Input
          placeholder="Filter Moderations (enter any key or relevant information about the moderation)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-background"
          data-testid="input-filter-moderations"
        />
      </div>

      {/* Moderations Table */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading moderations...
        </div>
      ) : (
        <ModerationTable
          moderations={filteredModerations}
          onRowClick={(mod) => setSelectedModeration(mod)}
        />
      )}

      {/* Detail Sheet */}
      <ModerationDetailSheet
        moderation={selectedModeration}
        open={selectedModeration !== null}
        onClose={() => setSelectedModeration(null)}
        onEdit={handleEditModeration}
        onDelete={handleDeleteModeration}
      />

      {/* Form Dialog */}
      <ModerationFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingModeration}
        mode={formMode}
      />
    </div>
  );
}
