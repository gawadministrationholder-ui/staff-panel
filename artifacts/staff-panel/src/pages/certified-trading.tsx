import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CertifiedTrading() {
  const { toast } = useToast();

  const handleApprove = (id: number) => {
    toast({
      title: "Request Approved",
      description: `Trading request #${id} has been approved`
    });
  };

  const handleReject = (id: number) => {
    toast({
      title: "Request Rejected",
      description: `Trading request #${id} has been rejected`
    });
  };

  const tradingRequests = [
    {
      id: 1,
      trader: "TradeMaster123",
      items: "Dominus Empyreus for 50,000 Robux",
      status: "Pending Verification",
      submittedDate: "2024-11-16",
      icon: Clock,
      color: "text-amber-500"
    },
    {
      id: 2,
      trader: "SafeTrader99",
      items: "Limited Hat Bundle for Collectibles",
      status: "Verified",
      submittedDate: "2024-11-15",
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      id: 3,
      trader: "ScammerUser",
      items: "Suspicious trade attempt",
      status: "Rejected",
      submittedDate: "2024-11-14",
      icon: XCircle,
      color: "text-red-500"
    },
  ];

  return (
    <div className="container mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Certified Trading</h1>
        <p className="text-muted-foreground">Manage and verify safe trading transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trading Requests</CardTitle>
          <CardDescription>Review and verify pending trading transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tradingRequests.map((request) => {
              const Icon = request.icon;
              return (
                <div key={request.id} className="flex items-center justify-between border-b pb-4 last:border-b-0" data-testid={`trade-request-${request.id}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-1 ${request.color}`} />
                    <div>
                      <div className="font-semibold">{request.trader}</div>
                      <div className="text-sm text-muted-foreground">{request.items}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Submitted {new Date(request.submittedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={request.color}>{request.status}</Badge>
                    {request.status === "Pending Verification" && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          data-testid={`button-approve-${request.id}`}
                          onClick={() => handleApprove(request.id)}
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          data-testid={`button-reject-${request.id}`}
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
