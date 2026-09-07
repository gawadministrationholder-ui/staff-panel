import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Database, AlertTriangle, BarChart } from "lucide-react";

export default function Management() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Management Panel</h1>
        <p className="text-muted-foreground">Senior administrator management tools</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-primary" />
              <CardTitle>Analytics</CardTitle>
            </div>
            <CardDescription>View detailed staff performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-analytics">
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Database Management</CardTitle>
            </div>
            <CardDescription>Manage database operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-database">
              Database Tools
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <CardTitle>Audit Logs</CardTitle>
            </div>
            <CardDescription>Review system audit trails</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-audit">
              View Audit Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Performance Reports</CardTitle>
            </div>
            <CardDescription>Generate staff performance reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" data-testid="button-reports">
              Generate Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
