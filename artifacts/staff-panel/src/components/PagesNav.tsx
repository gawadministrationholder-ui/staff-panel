import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, Plus, FileText, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PageSummary {
  key: string;
  title: string;
  category: string;
  requiredClearance: string;
}

const NO_RESTRICTION = "none";

const CLEARANCE_OPTIONS = [
  { value: NO_RESTRICTION, label: "Anyone (no restriction)" },
  { value: "Staff", label: "Staff" },
  { value: "Application Reviewer", label: "Application Reviewer" },
  { value: "Staff Manager", label: "Staff Manager" },
  { value: "Executive", label: "Executive" },
  { value: "Network Administrator", label: "Network Administrator" },
  { value: "Network Engineer", label: "Network Engineer" },
];

/** One category's own dropdown button, e.g. "Orders ▾" with its pages inside. */
function CategoryMenu({
  category,
  pages,
  canEdit,
  userClearances,
  onAddPage,
}: {
  category: string;
  pages: PageSummary[];
  canEdit: boolean;
  userClearances: string[];
  onAddPage: (category: string) => void;
}) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  function handleSelect(page: PageSummary, hasAccess: boolean) {
    if (!hasAccess) {
      toast({
        title: "No access",
        description: `You need ${page.requiredClearance} clearance to view "${page.title}".`,
        variant: "destructive",
      });
      return;
    }
    setLocation(`/pages/${page.key}`);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"
          data-testid={`nav-category-${category}`}
        >
          {category}
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {pages.map((page) => {
          const hasAccess = !page.requiredClearance || userClearances.includes(page.requiredClearance);
          return (
            <DropdownMenuItem
              key={page.key}
              onSelect={() => handleSelect(page, hasAccess)}
              className={`cursor-pointer ${!hasAccess ? "text-destructive line-through opacity-70" : ""}`}
              data-testid={`nav-page-${page.key}`}
            >
              {hasAccess ? <FileText className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {page.title}
            </DropdownMenuItem>
          );
        })}
        {canEdit && (
          <>
            {pages.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => onAddPage(category)} className="cursor-pointer" data-testid={`nav-add-page-${category}`}>
              <Plus className="w-4 h-4 mr-2" />
              Add page
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PagesNav() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRequiredClearance, setNewRequiredClearance] = useState(NO_RESTRICTION);
  const [targetCategory, setTargetCategory] = useState<string | null>(null);

  const clearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canEdit = clearances.includes("Network Engineer") || clearances.includes("Network Administrator");

  const { data: pages = [] } = useQuery<PageSummary[]>({
    queryKey: ["/api/pages"],
    enabled: !!user,
  });

  const categories = useMemo(() => {
    const groups = new Map<string, PageSummary[]>();
    for (const page of pages) {
      const list = groups.get(page.category) ?? [];
      list.push(page);
      groups.set(page.category, list);
    }
    return Array.from(groups.entries());
  }, [pages]);

  const createMutation = useMutation({
    mutationFn: async () =>
      apiRequest("POST", "/api/pages", {
        title: newTitle,
        category: newCategory,
        requiredClearance: newRequiredClearance === NO_RESTRICTION ? "" : newRequiredClearance,
      }),
    onSuccess: (res: any) => {
      toast({ title: "Page added", description: `"${res.title}" was created under ${res.category}.` });
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setAddOpen(false);
      setAddCategoryOpen(false);
      setNewTitle("");
      setNewCategory("");
      setNewRequiredClearance(NO_RESTRICTION);
      setTargetCategory(null);
      setLocation(`/pages/${res.key}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  function openAddPage(category: string) {
    setTargetCategory(category);
    setNewCategory(category);
    setNewTitle("");
    setNewRequiredClearance(NO_RESTRICTION);
    setAddOpen(true);
  }

  function openAddCategory() {
    setNewCategory("");
    setNewTitle("");
    setNewRequiredClearance(NO_RESTRICTION);
    setAddCategoryOpen(true);
  }

  if (!user) return null;

  return (
    <>
      {categories.map(([category, categoryPages]) => (
        <CategoryMenu
          key={category}
          category={category}
          pages={categoryPages}
          canEdit={canEdit}
          userClearances={clearances}
          onAddPage={openAddPage}
        />
      ))}

      {canEdit && (
        <button
          className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer text-muted-foreground"
          onClick={openAddCategory}
          data-testid="nav-add-category"
        >
          <Plus className="w-4 h-4" />
          Category
        </button>
      )}

      {/* Add a page into an existing category */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a page to {targetCategory}</DialogTitle>
            <DialogDescription>This page will appear under the "{targetCategory}" menu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Page title"
              data-testid="input-new-page-title"
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Who can view this page?</label>
              <Select value={newRequiredClearance} onValueChange={setNewRequiredClearance}>
                <SelectTrigger data-testid="select-page-clearance">
                  <SelectValue placeholder="Anyone (no restriction)" />
                </SelectTrigger>
                <SelectContent>
                  {CLEARANCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
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

      {/* Add a whole new category, which needs at least one page to exist */}
      <Dialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a new category</DialogTitle>
            <DialogDescription>
              Categories show up as their own menu in the top bar. Give it a name and a title for its first page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name (e.g. Orders, Community)"
              data-testid="input-new-category-name"
            />
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="First page title"
              data-testid="input-new-category-page-title"
            />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Who can view this page?</label>
              <Select value={newRequiredClearance} onValueChange={setNewRequiredClearance}>
                <SelectTrigger data-testid="select-category-page-clearance">
                  <SelectValue placeholder="Anyone (no restriction)" />
                </SelectTrigger>
                <SelectContent>
                  {CLEARANCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setAddCategoryOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newTitle.trim() || !newCategory.trim() || createMutation.isPending}
              data-testid="button-create-category"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
