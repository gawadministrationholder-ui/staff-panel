import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PageSummary {
  key: string;
  title: string;
}

export function PagesNav() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const clearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canEdit = clearances.includes("Network Engineer") || clearances.includes("Network Administrator");

  const { data: pages = [] } = useQuery<PageSummary[]>({
    queryKey: ["/api/pages"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/pages", { title: newTitle }),
    onSuccess: (res: any) => {
      toast({ title: "Page added", description: `"${res.title}" was created.` });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setAddOpen(false);
      setNewTitle("");
      setLocation(`/pages/${res.key}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
            data-testid="nav-pages"
          >
            Pages
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52">
          {pages.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">No pages yet</div>
          )}
          {pages.map((page) => (
            <DropdownMenuItem
              key={page.key}
              onSelect={() => setLocation(`/pages/${page.key}`)}
              className="cursor-pointer"
              data-testid={`nav-page-${page.key}`}
            >
              <FileText className="w-4 h-4 mr-2" />
              {page.title}
            </DropdownMenuItem>
          ))}
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setAddOpen(true)} className="cursor-pointer" data-testid="nav-add-page">
                <Plus className="w-4 h-4 mr-2" />
                Add page
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a page</DialogTitle>
            <DialogDescription>Give it a name — you can add content once it's created.</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Page title"
            data-testid="input-new-page-title"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newTitle.trim() || createMutation.isPending}
              data-testid="button-create-page"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
