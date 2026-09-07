import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import brandLogo from "../assets/brand-logo.png";

export default function CompleteProfile() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  const needsPassword = user && user.hasPassword === false;

  const [formData, setFormData] = useState({
    discordUsername: user?.discordUsername || "",
    discordId: user?.discordId || "",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { discordUsername: string; discordId: string; email: string; password?: string }) => {
      const res = await apiRequest("PATCH", "/api/auth/update", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Profile Complete!",
        description: "Your account is now set up. Welcome to Roman Parthia Remastered!",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.discordUsername.trim()) {
      toast({
        title: "Discord Username Required", 
        description: "Please enter your Discord username.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.discordId.trim()) {
      toast({
        title: "Discord ID Required",
        description: "Please enter your Discord ID.",
        variant: "destructive",
      });
      return;
    }

    if (needsPassword) {
      if (!formData.password.trim()) {
        toast({
          title: "Password Required",
          description: "Please create a password for your account.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters.",
          variant: "destructive",
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "Please make sure your passwords match.",
          variant: "destructive",
        });
        return;
      }
    }

    const submitData: { discordUsername: string; discordId: string; email: string; password?: string } = {
      discordUsername: formData.discordUsername,
      discordId: formData.discordId,
      email: formData.email,
    };

    if (needsPassword && formData.password) {
      submitData.password = formData.password;
    }

    updateMutation.mutate(submitData);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {isLoading ? "Loading..." : "Redirecting..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <img src={brandLogo} alt="Roman Parthia Remastered" className="w-16 h-16 rounded-md" />
          </div>
          <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
          <CardDescription>
            Please fill in your information to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user.robloxAvatar} alt={user.robloxUsername} />
              <AvatarFallback>{user.robloxUsername.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-lg font-semibold">{user.robloxUsername}</p>
            <p className="text-sm text-muted-foreground">Roblox ID: {user.robloxUserId}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordUsername">Discord Username *</Label>
              <Input
                id="discordUsername"
                placeholder="username"
                value={formData.discordUsername}
                onChange={(e) => setFormData({ ...formData, discordUsername: e.target.value })}
                data-testid="input-discord-username"
                required
              />
              <p className="text-xs text-muted-foreground">Your Discord username (e.g., solo or solo#1234)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordId">Discord ID *</Label>
              <Input
                id="discordId"
                placeholder="123456789012345678"
                value={formData.discordId}
                onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
                data-testid="input-discord-id"
                required
              />
              <p className="text-xs text-muted-foreground">
                Enable Developer Mode in Discord, right-click your profile, and copy ID
              </p>
            </div>

            {needsPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Create Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter a password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    data-testid="input-password"
                    required
                  />
                  <p className="text-xs text-muted-foreground">At least 6 characters</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    data-testid="input-confirm-password"
                    required
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={updateMutation.isPending}
              data-testid="button-complete-profile"
            >
              {updateMutation.isPending ? "Saving..." : "Complete Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
