import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";

interface ModerationLog {
  id: string;
  staffId: string;
  targetId: string;
  action: string;
  reason: string;
  createdAt: string;
}

export default function Logs() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const { data: logs = [], isLoading } = useQuery<ModerationLog[]>({
    queryKey: ["/api/logs"],
    enabled: !!user && user.rank >= 140,
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "Warn": return "bg-yellow-600 text-white";
      case "Kick": return "bg-orange-600 text-white";
      case "Ban": return "bg-red-600 text-white";
      case "Note": return "bg-blue-600 text-white";
      default: return "bg-gray-600 text-white";
    }
  };

  const filteredLogs = logs.filter(log =>
    log.targetId.includes(searchQuery) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please login to view logs</p>
      </div>
    );
  }

  if (user.rank < 140) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">You need to be at least rank 140 to view moderation logs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="text-page-title">Moderation Logs</h1>
        <p className="text-muted-foreground">View all staff moderation actions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log History</CardTitle>
          <CardDescription>All moderation actions taken by staff members</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Target ID</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <p className="text-muted-foreground">Loading logs...</p>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <p className="text-muted-foreground">No logs found</p>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filteredLogs.map((log) => (
                  <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                    <TableCell className="font-mono text-sm">{format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}</TableCell>
                    <TableCell>{log.staffId}</TableCell>
                    <TableCell className="font-mono">{log.targetId}</TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
