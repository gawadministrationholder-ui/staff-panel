import { useState, useEffect, useRef } from "react";
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
  Save,
  X,
  Heading,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Minus,
  GripVertical,
  AlertCircle,
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
  blockIndex,
  onChange,
  onDelete,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  block: Block;
  blockIndex: number;
  onChange: (b: Block) => void;
  onDelete: () => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <>
      <Card
        className={`mb-3 border-primary/20 transition-all ${
          isDragging ? "opacity-50 bg-primary/5" : "hover:shadow-md"
        }`}
        data-testid={`block-editor-${block.id}`}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing shrink-0" />
            <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wide flex-1">
              {block.type}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDelete}
              data-testid={`delete-${block.id}`}
              className="hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {(block.type === "heading" || block.type === "button") && (
            <Input
              value={block.text ?? ""}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
              placeholder={block.type === "heading" ? "Heading text" : "Button label"}
              data-testid={`input-text-${block.id}`}
              className="font-medium"
              autoFocus
            />
          )}

          {block.type === "text" && (
            <Textarea
              value={block.text ?? ""}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
              rows={4}
              placeholder="Paragraph text"
              data-testid={`input-text-${block.id}`}
              className="resize-none font-medium"
            />
          )}

          {(block.type === "image" || block.type === "button") && (
            <Input
              value={block.url ?? ""}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
              placeholder={block.type === "image" ? "https://image-url.png" : "https://link-destination.com"}
              data-testid={`input-url-${block.id}`}
              className="text-xs"
            />
          )}

          {block.type !== "divider" && block.type !== "image" && (
            <div className="flex gap-1 pt-1">
              {(["left", "center", "right"] as const).map((a) => (
                <Button
                  key={a}
                  size="xs"
                  variant={(block.align ?? "left") === a ? "default" : "outline"}
                  onClick={() => onChange({ ...block, align: a })}
                  data-testid={`align-${a}-${block.id}`}
                  className="text-xs"
                >
                  {a.slice(0, 1).toUpperCase()}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default function CustomPage({ pageKey }: { pageKey: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBlocks, setDraftBlocks] = useState<Block[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const clearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canEdit = clearances.includes("Network Engineer") || clearances.includes("Network Administrator");

  const { data: page, isLoading } = useQuery<PageData>({
    queryKey: [`/api/pages/${pageKey}`],
  });

  // Reset the draft whenever the saved page changes or the key changes
  useEffect(() => {
    if (page) {
      setDraftTitle(page.title);
      setDraftBlocks(page.blocks);
      setEditing(false);
    }
  }, [page, pageKey]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editing) {
        // Escape to cancel editing
        if (e.key === "Escape") {
          cancelEditing();
          e.preventDefault();
        }
        // Ctrl/Cmd + S to save
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          saveMutation.mutate();
        }
      }
      // Ctrl/Cmd + E to enter edit mode
      if (!editing && (e.ctrlKey || e.metaKey) && e.key === "e" && canEdit) {
        setEditing(true);
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editing, canEdit]);

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
    toast({ description: "Block deleted" });
  }

  function addBlock(type: BlockType) {
    setDraftBlocks((prev) => [...prev, newBlock(type)]);
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newBlocks = [...draftBlocks];
    const draggedBlock = newBlocks[draggedIndex];
    newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    setDraftBlocks(newBlocks);
    setDraggedIndex(null);
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
      <div className="max-w-4xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const blocksToRender = editing ? draftBlocks : page?.blocks ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div className="flex-1">
          {editing ? (
            <Input
              ref={titleInputRef}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="font-serif text-3xl font-bold"
              data-testid="input-page-title"
              placeholder="Page title"
            />
          ) : (
            <h1 className="font-serif text-4xl font-bold text-primary" data-testid="text-page-title">
              {page?.title}
            </h1>
          )}
        </div>

        {canEdit && (
          <div className="flex gap-2 shrink-0">
            {editing ? (
              <>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  data-testid="button-save-page"
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  data-testid="button-cancel-edit"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                data-testid="button-edit-page"
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      {editing && (
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">Keyboard shortcuts:</p>
            <ul className="text-xs space-y-1">
              <li><kbd className="bg-white dark:bg-slate-800 px-2 py-1 rounded border">Escape</kbd> to exit editing</li>
              <li><kbd className="bg-white dark:bg-slate-800 px-2 py-1 rounded border">Ctrl</kbd> + <kbd className="bg-white dark:bg-slate-800 px-2 py-1 rounded border">S</kbd> to save</li>
              <li>Drag blocks to reorder</li>
            </ul>
          </div>
        </div>
      )}

      {/* Content */}
      {editing ? (
        <>
          {/* Blocks editor */}
          <div className="space-y-2 mb-6">
            {draftBlocks.map((block, i) => (
              <BlockEditor
                key={block.id}
                block={block}
                blockIndex={i}
                onChange={(b) => updateBlock(i, b)}
                onDelete={() => deleteBlock(i)}
                isDragging={draggedIndex === i}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, i)}
              />
            ))}
          </div>

          {/* Add block section */}
          <Card className="border-dashed border-2 bg-muted/50">
            <CardContent className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-3">Add Block</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addBlock("heading")}
                  data-testid="add-heading"
                  className="h-10"
                >
                  <Heading className="w-4 h-4 mr-2" /> Heading
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addBlock("text")}
                  data-testid="add-text"
                  className="h-10"
                >
                  <Type className="w-4 h-4 mr-2" /> Text
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addBlock("image")}
                  data-testid="add-image"
                  className="h-10"
                >
                  <ImageIcon className="w-4 h-4 mr-2" /> Image
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addBlock("button")}
                  data-testid="add-button"
                  className="h-10"
                >
                  <LinkIcon className="w-4 h-4 mr-2" /> Button
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addBlock("divider")}
                  data-testid="add-divider"
                  className="h-10"
                >
                  <Minus className="w-4 h-4 mr-2" /> Divider
                </Button>
              </div>
            </CardContent>
          </Card>

          {draftBlocks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No blocks yet. Add one above to get started!</p>
            </div>
          )}
        </>
      ) : blocksToRender.length > 0 ? (
        <div className="space-y-6">
          {blocksToRender.map((block) => (
            <BlockView key={block.id} block={block} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {canEdit
              ? "This page is empty. Click \"Edit\" to add content."
              : "Nothing here yet — check back soon."}
          </p>
        </div>
      )}
    </div>
  );
}
