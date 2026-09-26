import OrgChart from "@/components/OrgChart";

// NOTE: this is a Discord CDN attachment link, which is signed and expires
// (see the `ex=` param). When it stops loading, re-upload the gif somewhere
// permanent — e.g. drop it in `public/` and reference it as `/backgrounds/main.gif`,
// or use Firebase Storage — and swap the URL below.
const BACKGROUND_GIF_URL =
  "https://cdn.discordapp.com/attachments/1322442088645791830/1551432597345804318/video-no-audio-new.gif?ex=6ab7e273&is=6ab690f3&hm=0d5964de5cdc1e30d0ed6a82b94ea73a20f81306bd04a8497a2894b78754e6b1&";

export default function Dashboard() {
  return (
    <div className="relative min-h-screen">
      {/* Background layer: fixed so it doesn't scroll with the page, sits behind everything */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${BACKGROUND_GIF_URL})` }}
        aria-hidden="true"
      />
      {/* Dark overlay so text stays readable over the gif */}
      <div className="fixed inset-0 -z-10 bg-black/65" aria-hidden="true" />

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
