import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import brandLogo from "../assets/brand-logo.png";

export default function Register() {
  const [formData, setFormData] = useState({
    robloxUsername: "",
    robloxUserId: "",
    discordUsername: "",
    discordId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast({
        title: "Success",
        description: "Account created successfully! Your Roblox rank has been fetched.",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-3 mb-4">
            <img src={brandLogo} alt="Galaxy at War" className="w-12 h-12 rounded-md" />
            <div>
              <CardTitle className="font-display text-2xl font-bold">Galaxy at War</CardTitle>
            </div>
          </div>
          <CardDescription>Create your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="robloxUsername">Roblox Username</Label>
              <Input
                id="robloxUsername"
                name="robloxUsername"
                placeholder="Enter your Roblox username"
                value={formData.robloxUsername}
                onChange={handleChange}
                data-testid="input-roblox-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="robloxUserId">Roblox User ID</Label>
              <Input
                id="robloxUserId"
                name="robloxUserId"
                type="number"
                placeholder="Enter your Roblox user ID"
                value={formData.robloxUserId}
                onChange={handleChange}
                data-testid="input-roblox-userid"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordUsername">Discord Username</Label>
              <Input
                id="discordUsername"
                name="discordUsername"
                placeholder="username#1234"
                value={formData.discordUsername}
                onChange={handleChange}
                data-testid="input-discord-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discordId">Discord ID</Label>
              <Input
                id="discordId"
                name="discordId"
                type="number"
                placeholder="Enter your Discord ID"
                value={formData.discordId}
                onChange={handleChange}
                data-testid="input-discord-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                data-testid="input-confirm-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
                Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
