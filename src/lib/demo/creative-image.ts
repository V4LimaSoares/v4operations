const PALETTE = [
  ["#E50914", "#80050B"],
  ["#FF7A1A", "#B2470E"],
  ["#FFC02A", "#B2841D"],
  ["#333333", "#000000"],
  ["#B20710", "#400306"],
];

function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Self-contained SVG data URI standing in for an ad creative in demo data — avoids depending
 * on an external image host (which may be unreachable or rate-limited) for something that's
 * fictional anyway.
 */
export function generateDemoCreative(label: string, seed: string): string {
  const idx = hashString(seed) % PALETTE.length;
  const [from, to] = PALETTE[idx];
  const initials = label
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "AD";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="450" fill="url(#g)"/>
    <circle cx="500" cy="60" r="120" fill="#ffffff" fill-opacity="0.08"/>
    <circle cx="80" cy="400" r="160" fill="#000000" fill-opacity="0.12"/>
    <text x="300" y="245" font-family="Helvetica, Arial, sans-serif" font-size="96" font-weight="700" fill="#ffffff" fill-opacity="0.9" text-anchor="middle">${initials}</text>
  </svg>`;

  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}
