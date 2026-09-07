import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function Applications() {
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
            <CardDescription>Applications requires the Application Reviewer clearance.</CardDescription>
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

  const handleWithdraw = (id: number) => {
    toast({
      title: "Application Withdrawn",
      description: `Your application #${id} has been withdrawn`
    });
  };

  const applications = [
    {
      id: 1,
      position: "Trial Moderator",
      status: "Approved",
      submittedDate: "2024-11-10",
      statusColor: "bg-green-500"
    },
    {
      id: 2,
      position: "Senior Moderator",
      status: "Pending Review",
      submittedDate: "2024-11-15",
      statusColor: "bg-amber-500"
    }
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Your Applications</h1>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-muted-foreground">Track the status of your staff applications</p>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">WIP</Badge>
        </div>
      </div>

      <div className="grid gap-4">
        {applications.map((app) => (
          <Card key={app.id} data-testid={`application-card-${app.id}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{app.position}</CardTitle>
                <Badge className={app.statusColor}>{app.status}</Badge>
              </div>
              <CardDescription>Submitted on {new Date(app.submittedDate).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  data-testid={`button-view-${app.id}`}
                  onClick={() => handleViewDetails(app.id)}
                >
                  View Details
                </Button>
                {app.status === "Pending Review" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-testid={`button-withdraw-${app.id}`}
                    onClick={() => handleWithdraw(app.id)}
                  >
                    Withdraw Application
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
