import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function ApplicationManager() {
  const { toast } = useToast();
  const { user } = useAuth();

  const myClearances = (user?.clearance || "").split(",").map((c) => c.trim()).filter(Boolean);
  const canReviewApplications = myClearances.includes("Application Reviewer");

  if (user && !canReviewApplications) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Application Manager requires the Application Reviewer clearance.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleViewDetails = (id: number) => {
    toast({
      title: "Application Details",
      description: `Viewing details for application #${id}`
    });
  };

  const handleApprove = (id: number) => {
    toast({
      title: "Application Approved",
      description: `Application #${id} has been approved`
    });
  };

  const handleReject = (id: number) => {
    toast({
      title: "Application Rejected",
      description: `Application #${id} has been rejected`
    });
  };

  const pendingApplications = [
    {
      id: 1,
      applicant: "NewUser123",
      position: "Trial Moderator",
      submittedDate: "2024-11-16",
      robloxId: "1234567890"
    },
    {
      id: 2,
      applicant: "ExperiencedMod",
      position: "Senior Moderator",
      submittedDate: "2024-11-15",
      robloxId: "9876543210"
    },
    {
      id: 3,
      applicant: "AspiringStaff",
      position: "Trial Moderator",
      submittedDate: "2024-11-14",
      robloxId: "5555555555"
    },
  ];

  const stats = [
    { label: "Pending Review", value: "3", color: "text-amber-500" },
    { label: "Approved This Week", value: "7", color: "text-green-500" },
    { label: "Rejected This Week", value: "2", color: "text-red-500" },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Application Manager</h1>
        <p className="text-muted-foreground">Review and manage staff applications</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {stats.map((stat, idx) => (
          <Card key={idx} data-testid={`stat-${idx}`}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>Applications awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingApplications.map((app) => (
              <div key={app.id} className="flex items-center justify-between border-b pb-4 last:border-b-0" data-testid={`application-${app.id}`}>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1 text-amber-500" />
                  <div>
                    <div className="font-semibold">{app.applicant}</div>
                    <div className="text-sm text-muted-foreground">Applied for: {app.position}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Roblox ID: {app.robloxId} • Submitted {new Date(app.submittedDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    data-testid={`button-view-${app.id}`}
                    onClick={() => handleViewDetails(app.id)}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-green-500" 
                    data-testid={`button-approve-${app.id}`}
                    onClick={() => handleApprove(app.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-red-500" 
                    data-testid={`button-reject-${app.id}`}
                    onClick={() => handleReject(app.id)}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
