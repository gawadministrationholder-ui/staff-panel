import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Pencil,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  X,
  Heading,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
} from "lucide-react";

type BlockType = "heading" | "text" | "image" | "button" | "divider";

interface Block {
  id: string;
  type: BlockType;
  text?: string;
  url?: string;
  align?: "left" | "center" | "right";
}

interface PageData {
  key: string;
  title: string;
  blocks: Block[];
}

function newBlock(type: BlockType): Block {
  const id = `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  switch (type) {
    case "heading":
      return { id, type, text: "New heading", align: "left" };
    case "text":
      return { id, type, text: "Write something here...", align: "left" };
    case "image":
      return { id, type, url: "" };
    case "button":
      return { id, type, text: "Click here", url: "", align: "left" };
    case "divider":
      return { id, type };
  }
}

function alignClass(align?: string) {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "text-left";
}

/** Read-only rendering of a block, as visitors see it. */
function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className={`font-serif text-2xl font-bold text-primary mb-3 ${alignClass(block.align)}`}>
          {block.text}
        </h2>
      );
    case "text":
      return (
        <p className={`text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4 ${alignClass(block.align)}`}>
          {block.text}
        </p>
      );
    case "image":
      return block.url ? (
        <img src={block.url} alt="" className="rounded-lg max-w-full mx-auto mb-4 border border-border" />
      ) : null;
    case "button":
      return block.url ? (
        <div className={`mb-4 ${alignClass(block.align)}`}>
          <a href={block.url} target="_blank" rel="noopener noreferrer">
            <Button>{block.text || "Open"}</Button>
          </a>
        </div>
      ) : null;
    case "divider":
      return <hr className="border-border my-6" />;
  }
}

/** Editable form for one block while in edit mode. */
function BlockEditor({
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: Block;
  onChange: (b: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <Card className="mb-3 border-primary/20" data-testid={`block-editor-${block.id}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
            {block.type}
          </span>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={onMoveUp} disabled={isFirst} data-testid={`move-up-${block.id}`}>
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onMoveDown} disabled={isLast} data-testid={`move-down-${block.id}`}>
              <ArrowDown className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`delete-${block.id}`}>
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>

        {(block.type === "heading" || block.type === "button") && (
          <Input
            value={block.text ?? ""}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder={block.type === "heading" ? "Heading text" : "Button label"}
            data-testid={`input-text-${block.id}`}
          />
        )}

        {block.type === "text" && (
          <Textarea
            value={block.text ?? ""}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            rows={5}
            placeholder="Paragraph text"
            data-testid={`input-text-${block.id}`}
          />
        )}

        {(block.type === "image" || block.type === "button") && (
          <Input
            value={block.url ?? ""}
            onChange={(e) => onChange({ ...block, url: e.target.value })}
            placeholder={block.type === "image" ? "https://image-url.png" : "https://link-destination.com"}
            data-testid={`input-url-${block.id}`}
          />
        )}

        {block.type !== "divider" && block.type !== "image" && (
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <Button
                key={a}
                size="sm"
                variant={(block.align ?? "left") === a ? "default" : "outline"}
                onClick={() => onChange({ ...block, align: a })}
                data-testid={`align-${a}-${block.id}`}
              >
                {a}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomPage({ pageKey }: { pageKey: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBlocks, setDraftBlocks] = useState<Block[]>([]);

  const clearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canEdit =
    clearances.includes("Network Engineer") || clearances.includes("Network Administrator");

  const { data: page, isLoading } = useQuery<PageData>({
    queryKey: [`/api/pages/${pageKey}`],
  });

  // Reset the draft whenever the saved page changes or the key changes, so
  // switching pages mid-edit can't carry another page's content over.
  useEffect(() => {
    if (page) {
      setDraftTitle(page.title);
      setDraftBlocks(page.blocks);
      setEditing(false);
    }
  }, [page, pageKey]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", `/api/pages/${pageKey}`, {
        title: draftTitle,
        blocks: draftBlocks,
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

  function updateBlock(index: number, next: Block) {
    setDraftBlocks((prev) => prev.map((b, i) => (i === index ? next : b)));
  }

  function deleteBlock(index: number) {
    setDraftBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, delta: number) {
    setDraftBlocks((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function addBlock(type: BlockType) {
    setDraftBlocks((prev) => [...prev, newBlock(type)]);
  }

  function cancelEditing() {
    if (page) {
      setDraftTitle(page.title);
      setDraftBlocks(page.blocks);
    }
    setEditing(false);
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const blocksToRender = editing ? draftBlocks : page?.blocks ?? [];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
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
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-page">
                <Pencil className="w-4 h-4 mr-1" />
                Edit page
              </Button>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <>
          {draftBlocks.map((block, i) => (
            <BlockEditor
              key={block.id}
              block={block}
              onChange={(b) => updateBlock(i, b)}
              onDelete={() => deleteBlock(i)}
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              isFirst={i === 0}
              isLast={i === draftBlocks.length - 1}
            />
          ))}

          <Card className="border-dashed mt-4">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Add a block</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => addBlock("heading")} data-testid="add-heading">
                  <Heading className="w-4 h-4 mr-1" /> Heading
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("text")} data-testid="add-text">
                  <Type className="w-4 h-4 mr-1" /> Text
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("image")} data-testid="add-image">
                  <ImageIcon className="w-4 h-4 mr-1" /> Image
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("button")} data-testid="add-button">
                  <LinkIcon className="w-4 h-4 mr-1" /> Button
                </Button>
                <Button size="sm" variant="outline" onClick={() => addBlock("divider")} data-testid="add-divider">
                  <Minus className="w-4 h-4 mr-1" /> Divider
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : blocksToRender.length > 0 ? (
        blocksToRender.map((block) => <BlockView key={block.id} block={block} />)
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {canEdit
              ? "This page is empty. Click \"Edit page\" to add content."
              : "Nothing here yet — check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
