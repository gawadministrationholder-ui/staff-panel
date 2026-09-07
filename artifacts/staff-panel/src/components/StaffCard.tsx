import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import RankBadge from "./RankBadge";

export interface StaffCardProps {
  robloxUsername: string;
  robloxAvatar: string;
  discordUsername: string;
  rank: number;
}

export default function StaffCard({ 
  robloxUsername, 
  robloxAvatar, 
  discordUsername, 
  rank 
}: StaffCardProps) {
  return (
    <Card 
      className="hover-elevate overflow-visible relative"
      data-testid={`card-staff-${robloxUsername}`}
    >
      <CardContent className="p-6 flex flex-col items-center text-center gap-4">
        <div className="absolute top-4 right-4">
          <RankBadge rank={rank} />
        </div>
        
        <Avatar className="w-20 h-20">
          <AvatarImage src={robloxAvatar} alt={robloxUsername} />
          <AvatarFallback>{robloxUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h3 className="font-semibold text-base" data-testid={`text-roblox-${robloxUsername}`}>
            {robloxUsername}
          </h3>
          <p className="text-sm text-muted-foreground" data-testid={`text-discord-${robloxUsername}`}>
            {discordUsername}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
