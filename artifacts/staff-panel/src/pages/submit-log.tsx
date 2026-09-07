import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function SubmitLog() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    targetId: "",
    action: "",
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Log submitted:", formData);
    toast({
      title: "Log Submitted",
      description: "Your moderation action has been recorded.",
    });
    setFormData({ targetId: "", action: "", reason: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Submit Log</h1>
        <p className="text-muted-foreground">Record a moderation action</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>New Moderation Log</CardTitle>
          <CardDescription>Enter the details of the moderation action</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetId">Target User ID</Label>
              <Input
                id="targetId"
                placeholder="Enter Roblox User ID"
                value={formData.targetId}
                onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                data-testid="input-target-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select
                value={formData.action}
                onValueChange={(value) => setFormData({ ...formData, action: value })}
              >
                <SelectTrigger id="action" data-testid="select-action">
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="kick">Kick</SelectItem>
                  <SelectItem value="ban">Ban</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this action..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={4}
                data-testid="input-reason"
              />
            </div>

            <Button type="submit" className="w-full" data-testid="button-submit">
              Submit Log
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
