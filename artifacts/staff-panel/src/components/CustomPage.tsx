import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Pencil, Save, X, Trash } from "lucide-react";
import FreeformEditor from "@/components/FreeformEditor";

interface PageData {
  key: string;
  title: string;
  html: string;
}

export default function CustomPage({ pageKey }: { pageKey: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftHtml, setDraftHtml] = useState("");

  const clearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canEdit = clearances.includes("Network Engineer") || clearances.includes("Network Administrator");

  const { data: page, isLoading, error } = useQuery<PageData>({
    queryKey: [`/api/pages/${pageKey}`],
    retry: false,
  });

  // Reset the draft whenever the saved page changes or the key changes, so
  // switching pages mid-edit can't carry another page's content over.
  useEffect(() => {
    if (page) {
      setDraftTitle(page.title);
      setDraftHtml(page.html || "");
      setEditing(false);
    }
  }, [page, pageKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/pages/${pageKey}`, {
        title: draftTitle,
        html: draftHtml,
      });
    },
    onSuccess: () => {
      toast({ title: "Saved", description: "Page updated" });
      queryClient.invalidateQueries({ queryKey: [`/api/pages/${pageKey}`] });
      setEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function cancelEditing() {
    if (page) {
      setDraftTitle(page.title);
      setDraftHtml(page.html || "");
    }
    setEditing(false);
  }

  const deleteMutation = useMutation({
    mutationFn: async () => apiRequest("DELETE", `/api/pages/${pageKey}`, {}),
    onSuccess: () => {
      toast({ title: "Page deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function handleDelete() {
    if (window.confirm(`Delete "${page?.title}"? This can't be undone.`)) {
      deleteMutation.mutate();
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error) {
    let requiredClearance: string | null = null;
    try {
      const jsonPart = error.message.slice(error.message.indexOf(":") + 1).trim();
      requiredClearance = JSON.parse(jsonPart)?.requiredClearance ?? null;
    } catch {
      // fall through with no specific clearance name
    }
    return (
      <div className="max-w-md mx-auto px-6 py-16 text-center space-y-2">
        <p className="font-display text-sm tracking-wide">Restricted</p>
        <p className="text-sm text-muted-foreground">
          {requiredClearance
            ? `This page requires ${requiredClearance} clearance.`
            : "You don't have access to this page."}
        </p>
      </div>
    );
  }

  return (
    <div className={`mx-auto px-6 py-10 ${editing ? "max-w-5xl" : "max-w-3xl"}`}>
      <div className="flex items-start justify-between gap-4 mb-6">
        {editing ? (
          <Input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            className="font-serif text-2xl font-bold"
            data-testid="input-page-title"
          />
        ) : (
          <h1 className="font-serif text-3xl font-bold text-primary" data-testid="text-page-title">
            {page?.title}
          </h1>
        )}

        {canEdit && (
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-page"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing} data-testid="button-cancel-edit">
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-page">
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit page
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-page"
                >
                  <Trash className="w-4 h-4 mr-1 text-destructive" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <FreeformEditor html={draftHtml} onChange={setDraftHtml} />
      ) : page?.html ? (
        <div
          className="prose-page"
          dangerouslySetInnerHTML={{ __html: page.html }}
          data-testid="page-content"
        />
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {canEdit
              ? "This page is empty. Click \"Edit page\" to start writing."
              : "Nothing here yet — check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
