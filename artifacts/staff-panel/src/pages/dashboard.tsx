import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user } = useAuth();

  interface LeadershipMember {
    userId: number;
    username: string;
    displayName: string;
    rank: number;
    roleName: string;
    avatar: string;
  }

  const { data: leadership, isLoading: leadershipLoading } = useQuery<LeadershipMember[]>({
    queryKey: ["/api/leadership"],
  });

  return (
    <div>
      <div className="bg-red-800 text-white px-6 py-3 text-center text-sm font-bold">
        LOOKING TO APPEAL A MODERATION? CONTACT ROMAN PARTHIA REMASTERED SUPPORT
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-amber-500 mb-2">Our Leadership</h2>
          <p className="text-muted-foreground">Leadership and Command Personnel</p>
        </div>
        
        {leadershipLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading leadership...</p>
          </div>
        ) : leadership && leadership.length > 0 ? (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="flex flex-wrap justify-center gap-6"
              variants={{
                container: {
                  staggerChildren: 0.05,
                }
              }}
              initial="container"
              animate="container"
            >
              {leadership.map((member, idx) => (
                <motion.div
                  key={member.userId}
                  variants={{
                    container: {
                      opacity: 0,
                      y: 20
                    }
                  }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  viewport={{ once: true }}
                >
                  <Card 
                    className="hover-elevate border-amber-500/20 w-[140px]" 
                    data-testid={`leadership-card-${idx}`}
                  >
                  <CardContent className="p-5">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-sm"></div>
                        <img
                          src={member.avatar}
                          alt={member.username}
                          className="relative w-20 h-20 rounded-full border-2 border-amber-500/30"
                          data-testid={`img-leadership-avatar-${idx}`}
                        />
                      </div>
                      <div className="w-full">
                        <p className="font-bold text-sm mb-1 truncate" data-testid={`text-leadership-username-${idx}`}>
                          {member.displayName}
                        </p>
                        <p className="text-xs text-amber-500/80 font-medium leading-tight" data-testid={`text-leadership-role-${idx}`}>
                          {member.roleName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No leadership found</p>
          </div>
        )}
      </div>
    </div>
  );
}
