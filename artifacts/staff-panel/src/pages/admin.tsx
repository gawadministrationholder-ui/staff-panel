import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Users, FileText, Settings } from "lucide-react";

export default function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Admin Panel</h1>
        <p className="text-muted-foreground">Administrator tools and controls</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <CardTitle>User Management</CardTitle>
            </div>
            <CardDescription>Manage staff accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-manage-users">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <CardTitle>Log Management</CardTitle>
            </div>
            <CardDescription>Review and edit moderation logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-manage-logs">
              Manage Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <CardTitle>Rank Sync</CardTitle>
            </div>
            <CardDescription>Sync ranks from Roblox group</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-sync-ranks">
              Sync All Ranks
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>Configure system parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-settings">
              System Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
