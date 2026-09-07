import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertTriangle, Calendar, User } from "lucide-react";

interface StaffInfraction {
  id: string;
  staffId: string;
  staffName: string;
  staffRobloxId: string;
  infraction: string;
  reason: string;
  issuedBy: string;
  severity: string;
  createdAt: string;
}

interface InfractionStats {
  totalInfractions: number;
  byMonth: { [key: string]: number };
  bySeverity: {
    minor: number;
    moderate: number;
    severe: number;
    critical: number;
  };
  infractions: StaffInfraction[];
}

export default function InfractionReport() {
  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString();
  
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [searchTerm, setSearchTerm] = useState("");

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const { data: stats, isLoading } = useQuery<InfractionStats>({
    queryKey: ["/api/infraction-report", selectedYear, selectedMonth],
  });

  const filteredInfractions = stats?.infractions.filter((inf) =>
    inf.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inf.infraction.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inf.reason.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "bg-red-500/10 text-red-500";
      case "severe": return "bg-orange-500/10 text-orange-500";
      case "moderate": return "bg-amber-500/10 text-amber-500";
      case "minor": return "bg-blue-500/10 text-blue-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Infraction Report</h1>
        <p className="text-muted-foreground">View staff strikes and infractions by month and year</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter by Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="year-select">Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger id="year-select" data-testid="select-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="month-select">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select" data-testid="select-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="search-infractions">Search</Label>
              <Input
                id="search-infractions"
                placeholder="Search by staff name, infraction, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-infractions"
              />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              Viewing infractions for {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </span>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading infractions...</div>
      ) : stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Infractions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">{stats.totalInfractions}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Minor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-blue-500">{stats.bySeverity.minor}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Moderate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-amber-500">{stats.bySeverity.moderate}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Severe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-orange-500">{stats.bySeverity.severe}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-red-500">{stats.bySeverity.critical}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Infractions List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredInfractions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm 
                      ? "No infractions match your search" 
                      : `No infractions recorded for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                  </div>
                ) : (
                  filteredInfractions.map((inf) => (
                    <Card key={inf.id} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Staff Member</p>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="font-semibold">{inf.staffName}</p>
                                <p className="text-xs text-muted-foreground">ID: {inf.staffRobloxId}</p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Severity</p>
                            <Badge className={getSeverityColor(inf.severity)}>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {inf.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Infraction</p>
                            <p className="font-medium">{inf.infraction}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reason</p>
                            <p className="text-sm">{inf.reason}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Issued By</p>
                            <p className="font-medium">{inf.issuedBy}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(inf.createdAt), "MMM d, h:mm a")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
