import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Database, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DataManagement() {
  const { toast } = useToast();

  const handleDataAction = (action: string) => {
    toast({
      title: "Feature coming soon",
      description: `${action} functionality will be available in a future update`
    });
  };

  const dataActions = [
    {
      title: "Export User Data",
      description: "Download user records and activity logs",
      icon: Download,
      buttonText: "Export CSV"
    },
    {
      title: "Import Data",
      description: "Upload bulk data from external sources",
      icon: Upload,
      buttonText: "Import File"
    },
    {
      title: "Database Backup",
      description: "Create a backup of all system data",
      icon: Database,
      buttonText: "Create Backup"
    },
    {
      title: "Clean Old Records",
      description: "Remove outdated logs and inactive data",
      icon: Trash2,
      buttonText: "Clean Data"
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Data Management</h1>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">Manage system data, exports, and backups</p>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">WIP</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {dataActions.map((action, idx) => {
          const Icon = action.icon;
          const testIds = ["button-export-data", "button-import-data", "button-create-backup", "button-clean-data"];
          return (
            <Card key={idx} data-testid={`data-action-${idx}`}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-md">
                    <Icon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  data-testid={testIds[idx]}
                  onClick={() => handleDataAction(action.title)}
                >
                  {action.buttonText}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Data Operations</CardTitle>
          <CardDescription>History of data management activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No recent data operations
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
