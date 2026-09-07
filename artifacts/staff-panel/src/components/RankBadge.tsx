import { Badge } from "@/components/ui/badge";

export interface RankBadgeProps {
  rank: number;
  className?: string;
}

export function getRankInfo(rank: number) {
  if (rank >= 255) return { label: "Emperor of Rome", color: "bg-red-900 text-white" };
  if (rank >= 254) return { label: "Princeps Consiliarius", color: "bg-red-800 text-white" };
  if (rank >= 253) return { label: "Staff Pontifex", color: "bg-red-700 text-white" };
  if (rank >= 200) return { label: "Head of Staff", color: "bg-red-600 text-white" };
  if (rank >= 199) return { label: "Deputy Head of Staff", color: "bg-orange-700 text-white" };
  if (rank >= 150) return { label: "Senior Administrator", color: "bg-orange-600 text-white" };
  if (rank >= 100) return { label: "Administrator", color: "bg-amber-700 text-white" };
  if (rank >= 99) return { label: "Senior Moderator", color: "bg-amber-600 text-white" };
  if (rank >= 98) return { label: "Moderator", color: "bg-yellow-700 text-white" };
  if (rank >= 97) return { label: "Trial Moderator", color: "bg-yellow-600 text-white" };
  return { label: "Member", color: "bg-gray-600 text-white" };
}

export default function RankBadge({ rank, className = "" }: RankBadgeProps) {
  const { label, color } = getRankInfo(rank);
  
  return (
    <Badge 
      className={`${color} text-xs font-bold uppercase px-3 py-1 ${className}`}
      data-testid={`badge-rank-${rank}`}
    >
      {label}
    </Badge>
  );
}
