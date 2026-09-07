import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion } from "framer-motion";

export default function AccountSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    robloxUsername: user?.robloxUsername || "",
    robloxUserId: user?.robloxUserId || "",
    discordId: user?.discordId || "",
    discordUsername: user?.discordUsername || "",
    email: user?.email || "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { discordUsername: string; discordId: string; email: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/update", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Account information updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account information.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      discordUsername: formData.discordUsername,
      discordId: formData.discordId,
      email: formData.email,
    });
  };

  const clearanceList = user?.clearance 
    ? user.clearance.split(',').map(c => c.trim()) 
    : ["Member"];

  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view account settings.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto max-w-2xl p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          data-testid="button-back"
        >
          ← Back to Dashboard
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="w-32 h-32">
              <AvatarImage src={user.robloxAvatar} alt={user.robloxUsername} />
              <AvatarFallback>{user.robloxUsername.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">YOUR ACCOUNT INFO</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="robloxUsername">Roblox Username</Label>
              <Input
                id="robloxUsername"
                value={formData.robloxUsername}
                readOnly
                disabled
                className="bg-muted"
                data-testid="input-roblox-username"
              />
              <p className="text-xs text-muted-foreground">Roblox info is synced automatically</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="robloxProfileId">Roblox Profile ID</Label>
              <Input
                id="robloxProfileId"
                value={formData.robloxUserId}
                readOnly
                disabled
                className="bg-muted"
                data-testid="input-roblox-id"
              />
            </div>

            {user.staffId && (
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID (Quick Login)</Label>
                <div className="flex gap-2">
                  <Input
                    id="staffId"
                    value={user.staffId}
                    readOnly
                    disabled
                    className="bg-muted font-mono text-lg"
                    data-testid="input-staff-id"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(user.staffId || "");
                      toast({
                        title: "Copied!",
                        description: "Staff ID copied to clipboard",
                      });
                    }}
                    data-testid="button-copy-staff-id"
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this code for quick login - no password needed!
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="discordUsername">Discord Username</Label>
              <Input
                id="discordUsername"
                value={formData.discordUsername}
                onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                placeholder="username#0000"
                data-testid="input-discord-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordId">Discord ID</Label>
              <Input
                id="discordId"
                value={formData.discordId}
                onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                placeholder="123456789012345678"
                data-testid="input-discord-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
              data-testid="button-update-account"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Updating..." : "Update Account Information"}
            </Button>
          </form>

          <div className="mt-8 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Your current clearance:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {clearanceList.map((clearance) => (
                <Badge 
                  key={clearance}
                  variant="secondary" 
                  className="text-sm px-4 py-1" 
                  data-testid={`badge-clearance-${clearance.toLowerCase()}`}
                >
                  {clearance}
                </Badge>
              ))}
            </div>
            {user.rank >= 200 && (
              <p className="text-xs text-muted-foreground mt-2">
                Report bugs to system administrator.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </motion.div>
  );
}
