import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Moderation {
  id: string;
  platform: string;
  actionType: string;
  targetId: string;
  targetName: string;
  moderatorId: string;
  moderatorName: string;
  reason: string;
  evidence: any;
  createdAt: string;
  metadata?: any;
}

interface ModerationTableProps {
  moderations: Moderation[];
  onRowClick: (moderation: Moderation) => void;
}

export function ModerationTable({ moderations, onRowClick }: ModerationTableProps) {
  const getActionBadgeStyle = (action: string) => {
    switch (action.toLowerCase()) {
      case 'ban':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warn':
      case 'warning':
        return 'bg-amber-500/20 text-yellow-400 border-amber-500/30';
      case 'kick':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'timeout':
      case 'mute':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const truncate = (text: string | null, length: number = 30) => {
    if (!text) return '-';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  const getEvidenceUrl = (evidence: any) => {
    if (typeof evidence === 'string') return evidence;
    if (evidence?.url) return evidence.url;
    if (evidence?.proof) return evidence.proof;
    return null;
  };

  const getShortId = (id: string) => {
    if (id.includes('-')) {
      // UUID format: take first and last parts
      const parts = id.split('-');
      return `${parts[0]}-${parts[parts.length - 1]}`;
    }
    return id.substring(0, 12);
  };

  return (
    <div className="border border-border rounded-md">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-amber-500 font-semibold">ID</TableHead>
            <TableHead className="text-amber-500 font-semibold">Type</TableHead>
            <TableHead className="text-amber-500 font-semibold">
              {moderations[0]?.platform === 'Discord' ? 'Discord' : 'Roblox'} ID
            </TableHead>
            <TableHead className="text-amber-500 font-semibold">Moderator ID</TableHead>
            <TableHead className="text-amber-500 font-semibold">Reason</TableHead>
            <TableHead className="text-amber-500 font-semibold">Evidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moderations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No moderations found
              </TableCell>
            </TableRow>
          ) : (
            moderations.map((mod) => {
              const evidenceUrl = getEvidenceUrl(mod.evidence);
              return (
                <TableRow
                  key={mod.id}
                  className="cursor-pointer hover-elevate border-b border-border"
                  onClick={() => onRowClick(mod)}
                  data-testid={`row-moderation-${mod.id}`}
                >
                  <TableCell className="font-mono text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-500">ID: {getShortId(mod.id)}</span>
                      <span className="text-blue-400 text-xs">Type: {mod.actionType}</span>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-muted-foreground">Moderated on</span>
                        <span className="text-foreground">{format(new Date(mod.createdAt), 'MM/dd/yyyy')}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActionBadgeStyle(mod.actionType)}>
                      {mod.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-500">{mod.platform}ID:</span>
                      <span className="text-foreground">{mod.targetId}</span>
                      <span className="text-xs text-muted-foreground">* info is read only</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-500">ModeratorID:</span>
                      <span className="text-foreground">{mod.moderatorId}</span>
                      <span className="text-xs text-muted-foreground">* info is read only</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-500 font-semibold text-sm">Reason</span>
                      <span className="text-foreground">{truncate(mod.reason, 40)}</span>
                      <span className="text-xs text-muted-foreground">* info is read only</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[250px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-amber-500 font-semibold text-sm">Evidence</span>
                      {evidenceUrl ? (
                        <>
                          <span className="text-blue-400 text-xs break-all">{truncate(evidenceUrl, 50)}</span>
                          <span className="text-xs text-muted-foreground">* info is read only</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">No evidence provided</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
