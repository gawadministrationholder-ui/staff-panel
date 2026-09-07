import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

interface PunishmentData {
  id: string;
  staffName: string;
  staffRobloxId: string;
  infraction: string;
  reason: string;
  issuedBy: string;
  severity: string;
  createdAt: string;
}

export default function PunishmentDocument() {
  const [punishment, setPunishment] = useState<PunishmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [, params] = useLocation();

  useEffect(() => {
    const fetchPunishment = async () => {
      try {
        const id = new URLSearchParams(window.location.search).get('id');
        if (!id) {
          setLoading(false);
          return;
        }
        
        const res = await fetch(`/api/punishments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPunishment(data);
        }
      } catch (error) {
        console.error('Failed to load punishment:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPunishment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading punishment document...</p>
      </div>
    );
  }

  if (!punishment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Punishment document not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <Card className="w-full max-w-3xl mx-auto border-2 border-gray-400">
        <CardHeader className="pb-2 border-b bg-white dark:bg-slate-950">
          <div className="text-center">
            <h2 className="text-lg font-bold mb-1">ADMINISTRATIVE PUNISHMENT</h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">ROMAN PARTHIA STAFF & MODERATION TEAM</p>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between text-sm">
            <div>
              <span className="font-semibold">Date:</span>
              <Badge className="ml-2 bg-red-200 text-red-900">
                {new Date(punishment.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">To:</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{punishment.staffName}</p>
            </div>
            <div>
              <span className="font-semibold">Roblox ID:</span>
              <p className="text-gray-700 dark:text-gray-300 mt-1">{punishment.staffRobloxId}</p>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <div className="flex-1">
              <span className="font-semibold">Re:</span>
              <div className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-3 py-1 rounded mt-1 text-xs">
                Administrative Strike
              </div>
            </div>
            <div className="flex-1">
              <span className="font-semibold">Action:</span>
              <div className="bg-orange-200 dark:bg-orange-900 text-orange-900 dark:text-orange-100 px-3 py-1 rounded mt-1 text-xs font-semibold">
                {punishment.infraction.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="font-semibold text-sm mb-3">Dear {punishment.staffName}:</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Pursuant to your actions, you've received a punishment for the following:
            </p>

            <div className="ml-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {punishment.reason}
            </div>
          </div>

          <div className="pt-4 border-t text-sm">
            <p className="font-semibold mb-2">Sincerely,</p>
            <p className="text-gray-700 dark:text-gray-300 font-semibold">{punishment.issuedBy}</p>
            <p className="text-gray-600 dark:text-gray-400">Roman Parthia Staff Administration</p>
          </div>

          <div className="pt-4 text-xs text-muted-foreground text-center">
            <p>If you believe this punishment was issued in error, please contact a Deputy Head of Staff or anyone higher in authority.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
