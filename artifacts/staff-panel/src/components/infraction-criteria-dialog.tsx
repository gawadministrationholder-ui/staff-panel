import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

interface InfractionCriteriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function InfractionCriteriaDialog({ open, onOpenChange }: InfractionCriteriaDialogProps) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("January");

  const handleGenerate = () => {
    console.log("Generate infraction report for:", { year, month });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] bg-zinc-900 border-amber-500/20">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold flex items-center justify-center gap-2">
            <span>📋</span>
            <span>Input Criteria</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium text-white">
              Year
            </Label>
            <Input
              id="year"
              data-testid="input-year"
              placeholder="Enter a valid year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month" className="text-sm font-medium text-white">
              Month
            </Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger 
                id="month"
                data-testid="select-month"
                className="bg-zinc-800 border-zinc-700"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              data-testid="button-generate"
              onClick={handleGenerate}
              disabled={!year.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Generate
            </Button>
            <Button
              data-testid="button-cancel-criteria"
              onClick={() => {
                setYear("");
                setMonth("January");
                onOpenChange(false);
              }}
              variant="destructive"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
