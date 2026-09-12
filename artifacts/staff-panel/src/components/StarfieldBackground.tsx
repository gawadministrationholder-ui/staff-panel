import { useMemo } from "react";

/**
 * A lightweight, pure-CSS starfield: three layers of small dots at
 * different sizes/opacities, each slowly drifting and twinkling. Rendered
 * once, fixed behind all page content.
 */
function generateStars(count: number, maxX: number, maxY: number): string {
  const shadows: string[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    shadows.push(`${x}px ${y}px #fff`);
  }
  return shadows.join(", ");
}

export default function StarfieldBackground() {
  const small = useMemo(() => generateStars(280, 2000, 2000), []);
  const medium = useMemo(() => generateStars(120, 2000, 2000), []);
  const large = useMemo(() => generateStars(50, 2000, 2000), []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        overflow: "hidden",
        background: "#000000",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          borderRadius: "50%",
          boxShadow: small,
          animation: "starfield-drift 240s linear infinite, starfield-twinkle 4s ease-in-out infinite",
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "2px",
          height: "2px",
          borderRadius: "50%",
          boxShadow: medium,
          animation: "starfield-drift 180s linear infinite, starfield-twinkle 6s ease-in-out infinite",
          animationDelay: "0s, 1.5s",
          opacity: 0.8,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "3px",
          height: "3px",
          borderRadius: "50%",
          boxShadow: large,
          animation: "starfield-drift 120s linear infinite, starfield-twinkle 5s ease-in-out infinite",
          animationDelay: "0s, 3s",
        }}
      />
      <style>{`
        @keyframes starfield-drift {
          from { transform: translate(0, 0); }
          to { transform: translate(-1000px, -1000px); }
        }
        @keyframes starfield-twinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
