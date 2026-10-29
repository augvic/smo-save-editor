// Small line icons (24x24 outlines in the style of Lucide), drawn as inline SVG so they follow the text colour.

const NS = "http://www.w3.org/2000/svg";

/** Each icon is a list of SVG shapes: a path, or a circle / rect written as "c cx cy r" / "r x y w h rx". */
const SHAPES: Record<string, readonly string[]> = {
  home: ["M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  map: ["M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z", "M9 3v15", "M15 6v15"],
  trophy: ["M6 9H4.5a2.5 2.5 0 0 1 0-5H6", "M18 9h1.5a2.5 2.5 0 0 0 0-5H18", "M4 22h16", "M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22", "M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22", "M18 2H6v7a6 6 0 0 0 12 0V2z"],
  shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M9 12l2 2 4-4"],
  book: ["M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z", "M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"],
  clipboard: ["r 8 2 8 4 1", "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2", "M12 11h4", "M12 16h4", "M8 11h.01", "M8 16h.01"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "M7 10l5 5 5-5", "M12 15V3"],
  history: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5", "M12 7v5l4 2"],
  code: ["M16 18l6-6-6-6", "M8 6l-6 6 6 6"],
  settings: ["c 12 12 3", "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"],
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "c 12 7 4"],
  shirt: ["M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"],
  pin: ["M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z", "c 12 10 3"],
  chart: ["M3 3v18h18", "M18 17V9", "M13 17V5", "M8 17v-3"],
  flag: ["M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z", "M4 22v-7"],
  moon: ["M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"],
  coin: ["c 12 12 9", "c 12 12 4"],
  star: ["M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"],
  music: ["M9 18V5l12-2v13", "c 6 18 3", "c 18 16 3"],
  target: ["c 12 12 10", "M22 12h-4", "M6 12H2", "M12 6V2", "M12 22v-4"],
  timer: ["M10 2h4", "M12 14l3-3", "c 12 14 8"],
  film: ["r 2 2 20 20 2.2", "M7 2v20", "M17 2v20", "M2 12h20", "M2 7h5", "M2 17h5", "M17 17h5", "M17 7h5"],
  swords: ["M14.5 17.5L3 6V3h3l11.5 11.5", "M13 19l6-6", "M16 16l4 4", "M19 21l2-2"],
  bag: ["M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z", "M3 6h18", "M16 10a4 4 0 0 1-8 0"],
  help: ["c 12 12 10", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"],
  compass: ["c 12 12 10", "M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"],
  file: ["M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z", "M14 2v6h6"],
  save: ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21v-8H7v8", "M7 3v5h8"],
  folder: ["M6 14l1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"],
  undo: ["M3 7v6h6", "M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"],
  redo: ["M21 7v6h-6", "M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"],
  wrench: ["M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"],
  sparkle: ["M12 3l1.9 5.8L20 10.5l-6.1 1.7L12 18l-1.9-5.8L4 10.5l6.1-1.7z", "M19 16v4", "M17 18h4"],
  unlock: ["r 3 11 18 11 2", "M7 11V7a5 5 0 0 1 9.9-1"],
  lock: ["r 3 11 18 11 2", "M7 11V7a5 5 0 0 1 10 0v4"],
  copy: ["r 8 8 14 14 2", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
  list: ["M8 6h13", "M8 12h13", "M8 18h13", "M3 6h.01", "M3 12h.01", "M3 18h.01"],
};

/** The icon that goes with a page or card title; anything else gets none. */
const BY_TITLE: Record<string, string> = {
  "Overview": "home", "Kingdoms": "map", "Achievements": "trophy", "Checks": "shield", "Story flags": "book",
  "Report": "clipboard", "Import": "download", "Changes": "history", "Raw data": "code", "Game settings": "settings",
  "Player": "user", "Equipment": "shirt", "Location": "pin", "Statistics": "chart", "Flags": "flag",
  "Overall progress": "chart", "Progress": "chart", "Power Moons": "moon", "Purple Coins": "coin",
  "Captures": "target", "Music": "music", "Races": "timer", "Cutscenes": "film", "Cutscenes of the whole game": "film",
  "Shop items": "bag", "Bosses": "swords", "Shop markers": "bag", "Not in the catalog": "help", "Side areas visited": "compass",
  "Checkpoints": "flag", "Another save": "file", "Differences": "history", "What is still missing": "clipboard",
  "Does the save agree with itself?": "shield", "Not tied to a kingdom": "star",
};

export type IconName = keyof typeof SHAPES;

export class Icon {
  /** An icon by name, `size` pixels square. */
  static of(name: string, size = 16): SVGElement {
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", String(size));
    svg.setAttribute("height", String(size));
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("icon");
    for (const shape of SHAPES[name] ?? []) {
      const [kind, ...n] = shape.split(" ");
      const part = kind === "c" ? document.createElementNS(NS, "circle") : kind === "r" ? document.createElementNS(NS, "rect") : document.createElementNS(NS, "path");
      if (kind === "c") { part.setAttribute("cx", n[0]); part.setAttribute("cy", n[1]); part.setAttribute("r", n[2]); }
      else if (kind === "r") { ["x", "y", "width", "height", "rx"].forEach((k, i) => part.setAttribute(k, n[i])); }
      else part.setAttribute("d", shape);
      svg.append(part);
    }
    return svg;
  }

  /** The icon for a page or card title, or null when it has none. */
  static forTitle(title: string, size = 16): SVGElement | null {
    const name = BY_TITLE[title];
    return name ? Icon.of(name, size) : null;
  }
}
