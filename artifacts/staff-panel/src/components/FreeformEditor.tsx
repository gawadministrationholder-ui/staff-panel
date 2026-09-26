import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Type,
  ImagePlus,
  ArrowDownToLine,
  Trash2,
  GripVertical,
  Move,
  Palette,
} from "lucide-react";

const FONT_OPTIONS = [
  "Inter",
  "Cinzel",
  "Georgia",
  "Times New Roman",
  "Arial",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
];

/**
 * A free-positioning "canvas" page editor: text blocks and images can be
 * dragged anywhere and resized, instead of flowing top-to-bottom like a
 * normal document. Saved back out as absolutely-positioned HTML so it still
 * fits through the existing `{ title, html }` page-save API untouched.
 */

interface CanvasElement {
  id: string;
  kind: "text" | "image";
  x: number;
  y: number;
  width: number;
  z: number;
  html?: string; // text kind
  src?: string; // image kind
}

let idCounter = 0;
function makeId() {
  idCounter += 1;
  return `el-${Date.now()}-${idCounter}`;
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function parseCanvas(html: string): { elements: CanvasElement[]; canvasHeight: number } {
  if (!html || !html.trim()) return { elements: [], canvasHeight: 500 };

  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.querySelector('[data-canvas="1"]') as HTMLElement | null;

  // Legacy (or hand-written) pages that aren't a freeform canvas yet: drop
  // the whole thing in as one big movable text block so nothing is lost.
  if (!root) {
    return {
      elements: [{ id: makeId(), kind: "text", x: 24, y: 24, width: 640, z: 1, html }],
      canvasHeight: 600,
    };
  }

  const elements: CanvasElement[] = [];
  let maxZ = 0;
  root.querySelectorAll<HTMLElement>(":scope > [data-el]").forEach((node) => {
    const kind = node.dataset.el === "image" ? "image" : "text";
    const x = parseInt(node.style.left, 10) || 0;
    const y = parseInt(node.style.top, 10) || 0;
    const width = parseInt(node.style.width, 10) || (kind === "image" ? 280 : 320);
    const z = parseInt(node.style.zIndex, 10) || 1;
    maxZ = Math.max(maxZ, z);
    if (kind === "image") {
      const img = node.querySelector("img");
      elements.push({ id: makeId(), kind, x, y, width, z, src: img?.getAttribute("src") || "" });
    } else {
      elements.push({ id: makeId(), kind, x, y, width, z, html: node.innerHTML });
    }
  });

  const canvasHeight = parseInt(root.style.minHeight, 10) || 500;
  return { elements, canvasHeight };
}

function serializeCanvas(elements: CanvasElement[], canvasHeight: number): string {
  const body = elements
    .map((el) => {
      const base = `position:absolute;left:${Math.round(el.x)}px;top:${Math.round(el.y)}px;width:${Math.round(
        el.width,
      )}px;z-index:${el.z};`;
      if (el.kind === "image") {
        return `<div data-el="image" style="${base}"><img src="${escapeAttr(
          el.src || "",
        )}" style="width:100%;height:auto;display:block;border-radius:8px;" /></div>`;
      }
      return `<div data-el="text" style="${base}">${el.html || ""}</div>`;
    })
    .join("");
  return `<div data-canvas="1" style="position:relative;min-height:${Math.round(canvasHeight)}px;">${body}</div>`;
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Bold;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
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

export default function FreeformEditor({
  html,
  onChange,
}: {
  html: string;
  onChange: (html: string) => void;
}) {
  const [elements, setElements] = useState<CanvasElement[]>(() => parseCanvas(html).elements);
  const [canvasHeight, setCanvasHeight] = useState<number>(() => parseCanvas(html).canvasHeight);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(
    null,
  );
  const resizeState = useRef<{ id: string; startX: number; origWidth: number } | null>(null);
  const nextZ = useRef(Math.max(1, ...elements.map((e) => e.z), 0) + 1);

  // Remember which text block and text-selection range was last active, so
  // clicking a toolbar control (which steals focus, e.g. a native color
  // picker or the font dropdown) can still apply to the right spot.
  const activeFrameRef = useRef<HTMLDivElement | null>(null);
  const activeRangeRef = useRef<Range | null>(null);

  function rememberSelection(e: React.SyntheticEvent<HTMLDivElement>) {
    activeFrameRef.current = e.currentTarget;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && e.currentTarget.contains(sel.anchorNode)) {
      activeRangeRef.current = sel.getRangeAt(0);
    }
  }

  // Emit serialized HTML on every change. This never re-reads the `html`
  // prop after mount, so our own writes don't bounce back in and fight the
  // drag state — the parent just stores whatever we hand it.
  useEffect(() => {
    onChange(serializeCanvas(elements, canvasHeight));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, canvasHeight]);

  function bringToFront(id: string) {
    nextZ.current += 1;
    const z = nextZ.current;
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, z } : el)));
  }

  function startDrag(e: React.PointerEvent, el: CanvasElement) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = { id: el.id, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y };
    setSelectedId(el.id);
    bringToFront(el.id);
  }

  function startResize(e: React.PointerEvent, el: CanvasElement) {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    resizeState.current = { id: el.id, startX: e.clientX, origWidth: el.width };
    setSelectedId(el.id);
    bringToFront(el.id);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragState.current) {
      const { id, startX, startY, origX, origY } = dragState.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) } : el)),
      );
    } else if (resizeState.current) {
      const { id, startX, origWidth } = resizeState.current;
      const dx = e.clientX - startX;
      setElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, width: Math.max(80, origWidth + dx) } : el)),
      );
    }
  }

  function endInteraction() {
    dragState.current = null;
    resizeState.current = null;
  }

  function addText() {
    const id = makeId();
    nextZ.current += 1;
    setElements((prev) => [
      ...prev,
      {
        id,
        kind: "text",
        x: 40,
        y: 40 + (prev.length % 6) * 24,
        width: 320,
        z: nextZ.current,
        html: "New text block — drag the grip to move it, the corner to resize it.",
      },
    ]);
    setSelectedId(id);
  }

  function addImage() {
    const url = window.prompt("Image URL (https://...)");
    if (!url || !/^https?:\/\//i.test(url)) return;
    const id = makeId();
    nextZ.current += 1;
    setElements((prev) => [...prev, { id, kind: "image", x: 60, y: 60, width: 280, z: nextZ.current, src: url }]);
    setSelectedId(id);
  }

  function removeElement(id: string) {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
  }

  function updateTextHtml(id: string, html: string) {
    setElements((prev) => prev.map((el) => (el.id === id ? { ...el, html } : el)));
  }

  function execOnActive(command: string, value?: string) {
    const frame = activeFrameRef.current;
    if (!frame) return;
    frame.focus();
    const sel = window.getSelection();
    if (sel && activeRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(activeRangeRef.current);
    }
    document.execCommand(command, false, value);
    const id = frame.dataset.textId!;
    updateTextHtml(id, frame.innerHTML);
    // Keep the ref in sync so a second toolbar action in a row still works.
    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount > 0) activeRangeRef.current = sel2.getRangeAt(0);
  }

  function insertLink() {
    const url = window.prompt("Link URL (https://...)");
    if (url && /^https?:\/\//i.test(url)) execOnActive("createLink", url);
  }

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-2 py-1">
        <ToolbarButton icon={Type} label="Add text box" onClick={addText} />
        <ToolbarButton icon={ImagePlus} label="Add image" onClick={addImage} />
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton icon={Bold} label="Bold" onClick={() => execOnActive("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => execOnActive("italic")} />
        <ToolbarButton icon={Underline} label="Underline" onClick={() => execOnActive("underline")} />
        <ToolbarButton icon={LinkIcon} label="Insert link" onClick={insertLink} />
        <div className="w-px h-5 bg-border mx-1" />
        <label
          className="relative flex items-center justify-center w-7 h-7 rounded hover-elevate active-elevate-2 cursor-pointer"
          title="Text color"
        >
          <Palette className="w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="color"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => execOnActive("foreColor", e.target.value)}
          />
        </label>
        <select
          defaultValue=""
          title="Font"
          className="text-xs rounded border border-border bg-background px-1.5 py-1.5 text-muted-foreground max-w-[7rem]"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            execOnActive("fontName", e.target.value);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Font…
          </option>
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font} style={{ fontFamily: font }}>
              {font}
            </option>
          ))}
        </select>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton
          icon={ArrowDownToLine}
          label="Grow canvas"
          onClick={() => setCanvasHeight((h) => h + 200)}
        />
        <span className="ml-auto flex items-center gap-1 pr-2 text-xs text-muted-foreground">
          <Move className="w-3.5 h-3.5" /> drag the grip to move, the corner to resize
        </span>
      </div>

      <div
        className="relative overflow-auto bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,hsl(var(--border))_24px),repeating-linear-gradient(90deg,transparent,transparent_23px,hsl(var(--border))_24px)] bg-[length:24px_24px]"
        style={{ minHeight: canvasHeight, maxHeight: "70vh" }}
        onPointerMove={onPointerMove}
        onPointerUp={endInteraction}
        onPointerLeave={endInteraction}
        onPointerDown={() => setSelectedId(null)}
      >
        <div className="relative" style={{ minHeight: canvasHeight }}>
          {elements.map((el) => {
            const selected = selectedId === el.id;
            return (
              <div
                key={el.id}
                className={`absolute rounded-sm ${
                  selected ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-border"
                }`}
                style={{ left: el.x, top: el.y, width: el.width, zIndex: el.z }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelectedId(el.id);
                  bringToFront(el.id);
                }}
              >
                {/* Drag handle */}
                <button
                  type="button"
                  className={`absolute -top-3 -left-3 z-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-move ${
                    selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  } ${selected ? "" : "pointer-events-none"}`}
                  onPointerDown={(e) => startDrag(e, el)}
                  title="Drag to move"
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </button>

                {/* Delete */}
                {selected && (
                  <button
                    type="button"
                    className="absolute -top-3 -right-3 z-10 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => removeElement(el.id)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Resize handle */}
                {selected && (
                  <button
                    type="button"
                    className="absolute -bottom-2 -right-2 z-10 w-4 h-4 rounded-sm bg-primary cursor-nwse-resize"
                    onPointerDown={(e) => startResize(e, el)}
                    title="Drag to resize"
                  />
                )}

                {el.kind === "image" ? (
                  <img
                    src={el.src}
                    alt=""
                    className="w-full h-auto rounded-md block select-none"
                    draggable={false}
                  />
                ) : (
                  <div
                    data-text-id={el.id}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => updateTextHtml(el.id, (e.target as HTMLDivElement).innerHTML)}
                    onFocus={rememberSelection}
                    onMouseUp={rememberSelection}
                    onKeyUp={rememberSelection}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="prose-page bg-card/90 rounded-md px-3 py-2 min-h-[2.5rem] focus:outline-none"
                    dangerouslySetInnerHTML={{ __html: el.html || "" }}
                  />
                )}
              </div>
            );
          })}

          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Empty canvas — add a text box or image to start placing things.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
