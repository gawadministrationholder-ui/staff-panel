import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Users, Shield, Settings, Lock, Award } from "lucide-react";

export default function Head() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Crown className="w-8 h-8 text-primary" />
          Head Panel
        </h1>
        <p className="text-muted-foreground">Executive control panel for leadership team</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>Staff Promotions</CardTitle>
            </div>
            <CardDescription>Promote or demote staff members</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-promotions">
              Manage Promotions
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Configure security protocols</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-security">
              Security Panel
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <CardTitle>Access Control</CardTitle>
            </div>
            <CardDescription>Manage system access permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-access">
              Access Controls
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>System Configuration</CardTitle>
            </div>
            <CardDescription>Advanced system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-config">
              Configure System
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <CardTitle>Staff Recognition</CardTitle>
            </div>
            <CardDescription>Acknowledge outstanding performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-recognition">
              Staff Awards
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <CardTitle>Leadership Tools</CardTitle>
            </div>
            <CardDescription>Executive decision making tools</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-leadership">
              Leadership Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
