import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function RobloxWIP() {
  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Construction className="w-16 h-16 text-amber-500" />
          </div>
          <CardTitle className="text-2xl">Work in Progress</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            The Roblox Moderation System is currently under development.
          </p>
          <p className="text-muted-foreground">
            This feature will be available soon. Please check back later or use the Discord Moderation System in the meantime.
          </p>
          <div className="mt-6 p-4 bg-muted/50 rounded-md border border-border">
            <p className="text-sm text-muted-foreground">
              Status: <span className="text-amber-500 font-medium">In Development</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
