import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Mail } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ open, onOpenChange, defaultTab = "login" }: AuthModalProps) {
  const { login, loginWithStaffId, register } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [emailFormData, setEmailFormData] = useState({ email: "", password: "" });
  const [staffIdFormData, setStaffIdFormData] = useState({ staffId: "" });
  const [registerFormData, setRegisterFormData] = useState({
    robloxUsername: "",
    robloxUserId: "",
    discordUsername: "",
    discordId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  function closeAndReset() {
    onOpenChange(false);
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(emailFormData.email, emailFormData.password);
      toast({ title: "Success", description: "Logged in successfully" });
      closeAndReset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to login", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithStaffId(staffIdFormData.staffId);
      toast({ title: "Success", description: "Logged in successfully" });
      closeAndReset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Invalid Staff ID", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerFormData.password !== registerFormData.confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = registerFormData;
      await register(registerData);
      toast({ title: "Success", description: "Account created successfully! Your Roblox rank has been fetched." });
      closeAndReset();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create account", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="dialog-auth">
        <DialogHeader>
          <DialogTitle>Galaxy at War</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login" data-testid="tab-modal-login">Login</TabsTrigger>
            <TabsTrigger value="register" data-testid="tab-modal-register">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
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
                <form onSubmit={handleStaffIdLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      name="staffId"
                      placeholder="ARC-XXXXXX"
                      value={staffIdFormData.staffId}
                      onChange={(e) => setStaffIdFormData({ staffId: e.target.value })}
                      className="font-mono uppercase"
                      data-testid="input-modal-staff-id"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-modal-staff-id-login">
                    {isLoading ? "Signing in..." : "Sign In with Staff ID"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@example.com"
                      value={emailFormData.email}
                      onChange={(e) => setEmailFormData({ ...emailFormData, email: e.target.value })}
                      data-testid="input-modal-email"
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
                      onChange={(e) => setEmailFormData({ ...emailFormData, password: e.target.value })}
                      data-testid="input-modal-password"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-modal-login">
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="robloxUsername">Roblox Username</Label>
                <Input
                  id="robloxUsername"
                  name="robloxUsername"
                  value={registerFormData.robloxUsername}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, robloxUsername: e.target.value })}
                  data-testid="input-modal-roblox-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="robloxUserId">Roblox User ID</Label>
                <Input
                  id="robloxUserId"
                  name="robloxUserId"
                  type="number"
                  value={registerFormData.robloxUserId}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, robloxUserId: e.target.value })}
                  data-testid="input-modal-roblox-userid"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discordUsername">Discord Username</Label>
                <Input
                  id="discordUsername"
                  name="discordUsername"
                  value={registerFormData.discordUsername}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, discordUsername: e.target.value })}
                  data-testid="input-modal-discord-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discordId">Discord ID</Label>
                <Input
                  id="discordId"
                  name="discordId"
                  type="number"
                  value={registerFormData.discordId}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, discordId: e.target.value })}
                  data-testid="input-modal-discord-id"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerEmail">Email</Label>
                <Input
                  id="registerEmail"
                  name="email"
                  type="email"
                  value={registerFormData.email}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, email: e.target.value })}
                  data-testid="input-modal-register-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registerPassword">Password</Label>
                <Input
                  id="registerPassword"
                  name="password"
                  type="password"
                  value={registerFormData.password}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, password: e.target.value })}
                  data-testid="input-modal-register-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={registerFormData.confirmPassword}
                  onChange={(e) => setRegisterFormData({ ...registerFormData, confirmPassword: e.target.value })}
                  data-testid="input-modal-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-modal-register">
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
