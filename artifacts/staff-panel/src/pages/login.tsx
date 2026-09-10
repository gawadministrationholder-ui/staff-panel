import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Mail } from "lucide-react";
import brandLogo from "../assets/brand-logo.png";

export default function Login() {
  const [emailFormData, setEmailFormData] = useState({
    email: "",
    password: "",
  });
  const [staffIdFormData, setStaffIdFormData] = useState({
    staffId: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginWithStaffId } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(emailFormData.email, emailFormData.password);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await loginWithStaffId(staffIdFormData.staffId);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid Staff ID",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailFormData({ ...emailFormData, [e.target.name]: e.target.value });
  };

  const handleStaffIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffIdFormData({ ...staffIdFormData, [e.target.name]: e.target.value });
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
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff-id" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="staff-id" className="flex items-center gap-2" data-testid="tab-staff-id">
                <KeyRound className="w-4 h-4" />
                Staff ID
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2" data-testid="tab-email">
                <Mail className="w-4 h-4" />
                Email
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="staff-id">
              <form onSubmit={handleStaffIdSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    name="staffId"
                    type="text"
                    placeholder="ARC-XXXXXX"
                    value={staffIdFormData.staffId}
                    onChange={handleStaffIdChange}
                    className="font-mono uppercase"
                    data-testid="input-staff-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your Staff ID to quickly sign in
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-staff-id-login">
                  {isLoading ? "Signing in..." : "Sign In with Staff ID"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="email">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={emailFormData.email}
                    onChange={handleEmailChange}
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
                    value={emailFormData.password}
                    onChange={handleEmailChange}
                    data-testid="input-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-sm text-center text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
