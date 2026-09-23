import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Pencil,
  Save,
  X,
  Trash,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
} from "lucide-react";

interface PageData {
  key: string;
  title: string;
  html: string;
}

/** One toolbar button that runs a document.execCommand rich-text action. */
function ToolbarButton({
  icon: Icon,
  onClick,
  label,
}: {
  icon: typeof Bold;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      // mousedown + preventDefault keeps focus (and the text selection) in
      // the editable area — a click would steal focus first and the command
      // would apply to nothing.
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="p-2 rounded hover-elevate active-elevate-2 text-muted-foreground"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/** A Google-Docs-style toolbar + contentEditable body. */
function RichTextEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const loadedHtml = useRef<string | null>(null);

  // Only write into the DOM when the page we're editing changes — never on
  // every keystroke, or the cursor would jump to the start on each render.
  useEffect(() => {
    if (ref.current && loadedHtml.current !== html) {
      ref.current.innerHTML = html;
      loadedHtml.current = html;
    }
  }, [html]);

  function exec(command: string, value?: string) {
    document.execCommand(command, false, value);
    ref.current?.focus();
    onChange(ref.current?.innerHTML ?? "");
  }

  function insertLink() {
    const url = window.prompt("Link URL (https://...)");
    if (url && /^https?:\/\//i.test(url)) exec("createLink", url);
  }

  function insertImage() {
    const url = window.prompt("Image URL (https://...)");
    if (url && /^https?:\/\//i.test(url)) exec("insertImage", url);
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1">
        <ToolbarButton icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <ToolbarButton icon={Underline} label="Underline" onClick={() => exec("underline")} />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton icon={Heading1} label="Heading" onClick={() => exec("formatBlock", "h1")} />
        <ToolbarButton icon={Heading2} label="Subheading" onClick={() => exec("formatBlock", "h2")} />
        <ToolbarButton icon={Quote} label="Quote" onClick={() => exec("formatBlock", "blockquote")} />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton icon={List} label="Bullet list" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={ListOrdered} label="Numbered list" onClick={() => exec("insertOrderedList")} />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton icon={LinkIcon} label="Insert link" onClick={insertLink} />
        <ToolbarButton icon={ImageIcon} label="Insert image" onClick={insertImage} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onBlur={() => onChange(ref.current?.innerHTML ?? "")}
        className="prose-page min-h-[50vh] px-6 py-5 focus:outline-none"
        data-testid="rich-text-editor"
      />
    </div>
  );
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

  const { data: page, isLoading } = useQuery<PageData>({
    queryKey: [`/api/pages/${pageKey}`],
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
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
        <RichTextEditor html={draftHtml} onChange={setDraftHtml} />
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
