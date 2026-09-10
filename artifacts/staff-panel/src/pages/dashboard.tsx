import OrgChart from "@/components/OrgChart";

export default function Dashboard() {
  return (
    <div>
      <div className="bg-red-800 text-white px-6 py-3 text-center text-sm font-bold">
        LOOKING TO APPEAL A MODERATION? CONTACT GALAXY AT WAR SUPPORT
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-amber-500 mb-2">Chain of Command</h2>
          <p className="text-muted-foreground">Tap any position to see who holds it and their job description</p>
        </div>

        <OrgChart />
      </div>
    </div>
  );
}
