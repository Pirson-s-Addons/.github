// Builds the WoW-styled SVGs of the organization profile into profile/assets/.
// Usage: node scripts/build.mjs [--fetch]
//   --fetch  refreshes profile/assets/data.json (CurseForge downloads via cfwidget, game clients from each repo's TOC files).
//            Needs GITHUB_TOKEN for the GitHub API; anything that fails keeps its previous value.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";

const dir = new URL("../profile/assets/", import.meta.url);
const write = (f, s) => writeFileSync(new URL(f, dir), s);
const LANGS = ["en", "es"];
const UA = "Mozilla/5.0 (X11; Linux x86_64) pirson-addons-profile";
const ORG = "Pirson-s-Addons";

// ---------- static catalog: what each addon is (text lives here, numbers come from data.json) ----------
const CATS = {
  chat: ["Chat & Communication", "Chat y comunicación"], quests: ["Quests", "Misiones"], map: ["Map", "Mapa"], ui: ["Interface", "Interfaz"],
  gameplay: ["Gameplay", "Jugabilidad"], prof: ["Professions", "Profesiones"], pvp: ["PvP", "JcJ"], util: ["Utility", "Utilidad"],
  qol: ["Quality of Life", "Calidad de vida"], games: ["Games", "Juegos"], ai: ["Assistant", "Asistente"], combat: ["Combat", "Combate"],
};
const ADDONS = [
  { cf: 1431567, repo: "WoW-Translator", name: "WoW Translator", abbr: "WT", cat: "chat",
    en: ["Translates WoW chat slang, abbreviations", "and dungeon names into 44 languages."],
    es: ["Traduce la jerga, abreviaturas y mazmorras", "del chat de WoW a 44 idiomas."] },
  { cf: 1713716, repo: "DungeonQuestAtlas", name: "Dungeon Quest Atlas", abbr: "DQ", cat: "quests",
    en: ["Every dungeon quest, boss and loot table", "in one journal, with chains and map pins."],
    es: ["Misiones, jefes y botín de cada mazmorra", "en un diario, con cadenas y pines."] },
  { cf: 1743547, repo: "HandyNotes_DungeonRaidLocations-Forever", name: "HandyNotes: Dungeon & Raid Locations", abbr: "HN", cat: "map",
    en: ["Every dungeon and raid entrance on the", "zone map, continent map and minimap."],
    es: ["Todas las entradas de mazmorras y bandas", "en el mapa de zona, continente y minimapa."] },
  { cf: 1700978, repo: "HealthBarTextForever", name: "Health Bar Text Forever", abbr: "HB", cat: "ui",
    en: ["Always-visible health and power text on", "player, target, focus and target of target."],
    es: ["Texto de salud y poder siempre visible en", "jugador, objetivo, foco y su objetivo."] },
  { cf: 1701053, repo: "SealTimersForever", name: "Seal Timers Forever", abbr: "ST", cat: "ui",
    en: ["Your active paladin seal on screen with", "its remaining time. Movable and resizable."],
    es: ["Tu sello de paladín activo en pantalla con", "su tiempo restante. Movible y escalable."] },
  { cf: 1308020, repo: "RemoveQuestie", name: "Remove Questie", abbr: "RQ", cat: "gameplay",
    en: ["Abandon all quests, or only the ones you", "tick, from the quest log in one click."],
    es: ["Abandona todas las misiones, o solo las que", "marques, desde el registro en un clic."] },
  { cf: 1757790, repo: "GatherRadar", name: "Gather Radar", abbr: "GR", cat: "prof",
    en: ["Herbs, ore, treasure and fishing pools on", "the minimap and world map, with icons."],
    es: ["Hierbas, minerales, tesoros y bancos de", "peces en el minimapa y el mapa del mundo."] },
  { cf: 1403777, repo: "HandyNotes_Trove-Thunder-King", name: "HandyNotes: Trove of the Thunder King", abbr: "TK", cat: "map",
    en: ["Every Trove of the Thunder King treasure", "on the Isle of Thunder map."],
    es: ["Cada tesoro Trove of the Thunder King", "en el mapa de la Isla del Trueno."] },
  { cf: 1701856, repo: "MapFixForever", name: "Map Fix Forever", abbr: "MF", cat: "map",
    en: ["Fixes the green world map in non-English", "clients with the original map art."],
    es: ["Arregla el mapa del mundo verde en clientes", "no ingleses con el arte original."] },
  { cf: 1744981, repo: "DRTrackerForever", name: "DR Tracker Forever", abbr: "DR", cat: "pvp",
    en: ["How long the next crowd control lasts on", "your target, your focus and you."],
    es: ["Cuánto dura el siguiente control de masas", "en tu objetivo, tu foco y en ti."] },
  { cf: 1549539, repo: "Cursor-Glow-RGB", name: "Cursor Glow RGB", abbr: "CG", cat: "ui",
    en: ["A glowing RGB aura around your cursor,", "with shapes, colors and animations."],
    es: ["Un aura RGB brillante alrededor del cursor,", "con formas, colores y animaciones."] },
  { cf: 1335779, repo: "ProspectHelper", name: "Prospect Helper", abbr: "PH", cat: "prof",
    en: ["Prospect ores in one click for", "Jewelcrafting. Lists the ores in your bags."],
    es: ["Prospecta minerales en un clic para", "Joyería. Lista los minerales de tus bolsas."] },
  { cf: 1339466, repo: "MillHelper", name: "Mill Helper", abbr: "MH", cat: "prof",
    en: ["Mill herbs in one click for Inscription.", "Lists the millable herbs in your bags."],
    es: ["Muele hierbas en un clic para Inscripción.", "Lista las hierbas de tus bolsas."] },
  { cf: 1439079, repo: "MoveExtraActionButton", name: "Move Extra Action Button", abbr: "EA", cat: "ui",
    en: ["Move the Extra Action Button and the", "alternate power bar anywhere on screen."],
    es: ["Mueve el botón de acción extra y la barra", "de poder alternativo donde quieras."] },
  { cf: 1343504, repo: "VendorItemFilter", name: "Vendor Item Filter", abbr: "VF", cat: "util",
    en: ["Filter vendor items by armor type, slot,", "weapon type, jewelry and more."],
    es: ["Filtra los objetos del vendedor por armadura,", "ranura, tipo de arma, joyería y más."] },
  { cf: 1349365, repo: "LeaveInstanceGroup", name: "Leave Instance Group", abbr: "LG", cat: "util",
    en: ["Adds the missing Leave Instance Group", "option to your portrait menu."],
    es: ["Añade la opción que falta para salir del", "grupo de instancia en tu retrato."] },
  { cf: 1729936, repo: "EmojiReact", name: "Emoji & React", abbr: "ER", cat: "chat",
    en: ["Emojis in chat and speech bubbles, plus a", "reaction wheel above your character."],
    es: ["Emojis en el chat y los bocadillos, y una", "rueda de reacciones sobre tu personaje."] },
  { cf: 1331866, repo: "Loot-A-Rang-Classic", name: "Loot-A-Rang Classic", abbr: "LR", cat: "qol",
    en: ["Double right-click to use the Loot-A-Rang", "and loot from a distance. No bar slot."],
    es: ["Doble clic derecho para usar el Loot-A-Rang", "y despojar a distancia. Sin ranura."] },
  { cf: 1476012, repo: "AzerothTicTacToe", name: "Azeroth Tic-Tac-Toe", abbr: "TT", cat: "games",
    en: ["Play Tic-Tac-Toe against another player", "betting gold, with ranking and ledger."],
    es: ["Juega al tres en raya contra otro jugador", "apostando oro, con ranking e historial."] },
  { cf: 1796245, repo: null, name: "Azeroth AI", abbr: "AI", cat: "ai", clients: ["forever"],
    en: ["An in-game chatbot for WoW Forever:", "ask about the game without alt-tabbing."],
    es: ["Un chatbot dentro del juego para WoW", "Forever: pregunta sin salir del juego."] },
  { cf: 1788942, repo: "ChocolateXPBar", name: "Chocolate XP Bar", abbr: "CX", cat: "ui",
    en: ["Just a chocolate bar for your experience", "bar, in five flavors."],
    es: ["Una tableta de chocolate como barra de", "experiencia, en cinco sabores."] },
  { cf: 1806190, repo: "RotationGuide", name: "Rotation Guide", abbr: "RG", cat: "combat",
    en: ["Your class rotation on WoW Forever,", "for all 27 specs."],
    es: ["La rotación de tu clase en WoW Forever,", "para las 27 especializaciones."] },
];
assert.equal(new Set(ADDONS.map((a) => a.cf)).size, ADDONS.length);

const CLIENTS = [
  ["retail", "Retail", "Retail"], ["forever", "WoW Forever", "WoW Forever"], ["mop", "MoP Classic", "MoP Classic"],
  ["cata", "Cataclysm Classic", "Cataclysm Classic"], ["wrath", "Wrath Classic", "Wrath Classic"], ["tbc", "TBC Classic", "TBC Classic"],
  ["era", "Classic Era", "Classic Era"], ["legacy", "Legacy (WoD to Shadowlands)", "Legado (WoD a Shadowlands)"],
];
const SHORT = { retail: "Retail", forever: "Forever", mop: "MoP", cata: "Cata", wrath: "WotLK", tbc: "TBC", era: "Era", legacy: "Legacy" };

// Which game clients a repo supports, from its TOC file names and the main TOC's ## Interface line.
export function clientsOf(tocNames, iface) {
  const s = new Set(), all = tocNames.join(" ");
  for (const n of String(iface).split(",").map(Number)) {
    if (n >= 110000) s.add("retail");
    else if (n >= 16000 && n < 17000) s.add("forever");
    else if (n >= 50000 && n < 60000) s.add("mop");
    else if (n >= 40000 && n < 50000) s.add("cata");
    else if (n >= 30000 && n < 40000) s.add("wrath");
    else if (n >= 20000 && n < 30000) s.add("tbc");
    else if (n >= 11000 && n < 12000) s.add("era");
  }
  const rules = { forever: /_Camelot/, era: /_Vanilla/, tbc: /_TBC|-BCC/, wrath: /_Wrath|-WOTLKC/, cata: /_Cata|-Cata/, mop: /_Mists/, legacy: /-(WoD|Legion|BfA|Shadowlands)/ };
  for (const [k, re] of Object.entries(rules)) if (re.test(all)) s.add(k);
  return CLIENTS.map(([k]) => k).filter((k) => s.has(k));
}
assert.deepEqual(clientsOf(["A.toc", "A_Camelot.toc"], "16001"), ["forever"]);
assert.deepEqual(clientsOf(["M.toc", "M-Cata.toc", "M-WOTLKC.toc"], "50500,50501"), ["mop", "cata", "wrath"]);
assert.deepEqual(clientsOf(["T.toc", "T_Camelot.toc", "T_Vanilla.toc", "T-BfA.toc"], "120001"), ["retail", "forever", "era", "legacy"]);

// ---------- data: fetch or load ----------
const dataFile = new URL("data.json", dir);
let data = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, "utf8")) : { addons: {} };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cfwidget(id) {
  for (let i = 0; i < 4; i++) { // cfwidget answers "in queue" for projects it has not cached yet
    try {
      const d = await fetch(`https://api.cfwidget.com/${id}`, { headers: { "User-Agent": UA } }).then((r) => r.json());
      if (d.downloads) return d;
    } catch {}
    await sleep(5000);
  }
  return null;
}
async function github(path) {
  const r = await fetch(`https://api.github.com/${path}`, { headers: { "User-Agent": UA, Accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) } });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return r.json();
}

if (process.argv.includes("--fetch")) {
  for (const a of ADDONS) {
    const prev = data.addons[a.cf] ?? {}, next = { ...prev };
    const cf = await cfwidget(a.cf);
    if (cf) {
      next.downloads = cf.downloads.total;
      next.url = cf.urls.curseforge;
      next.version = (cf.download?.display ?? "").match(/v?(\d+\.\d+(?:\.\d+)?)/i)?.[1] ?? prev.version;
    } else console.warn(`cfwidget failed for ${a.name}, keeping previous numbers`);
    if (a.repo) {
      try {
        const files = (await github(`repos/${ORG}/${a.repo}/contents`)).map((f) => f.name).filter((n) => n.endsWith(".toc"));
        const main = [...files].sort((x, y) => x.length - y.length)[0]; // flavor TOCs add a suffix, so the main one is the shortest
        const toc = Buffer.from((await github(`repos/${ORG}/${a.repo}/contents/${main}`)).content, "base64").toString();
        next.clients = clientsOf(files, toc.match(/^## Interface:\s*(.+)$/m)?.[1] ?? "");
      } catch (e) { console.warn(`GitHub failed for ${a.repo}: ${e.message}`); }
    }
    if (a.clients) next.clients = a.clients;
    data.addons[a.cf] = next;
  }
  data.date = new Date().toISOString().slice(0, 10);
  writeFileSync(dataFile, JSON.stringify(data, null, 2) + "\n");
}

const rows = ADDONS.map((a) => ({ ...a, ...data.addons[a.cf] })).filter((a) => a.downloads != null).sort((x, y) => y.downloads - x.downloads);
assert(rows.length > 0, "no data: run with --fetch first");
const total = rows.reduce((s, a) => s + a.downloads, 0);
const usedClients = CLIENTS.filter(([k]) => rows.some((a) => a.clients?.includes(k)));
const fmt = (n, lang) => n.toLocaleString(lang === "en" ? "en-US" : "es-ES", { useGrouping: "always" });

// ---------- look ----------
const Q = { legendary: "#ff8000", epic: "#a335ee", rare: "#0070dd", uncommon: "#1eff00" };
const quality = (d) => (d >= 25000 ? "legendary" : d >= 5000 ? "epic" : d >= 1000 ? "rare" : "uncommon");
assert.equal(quality(25000), "legendary"); assert.equal(quality(999), "uncommon");
const GOLD = "#ffd100", GREEN = "#1eff00";
const BODY = `font-family: Verdana, 'DejaVu Sans', Arial, sans-serif;`;
const TITLE = `font-family: Georgia, 'Times New Roman', serif;`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DEFS = `
    <linearGradient id="tip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11142a"/><stop offset="1" stop-color="#070812"/></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd100" stop-opacity="0"/><stop offset=".5" stop-color="#fff3b0"/><stop offset="1" stop-color="#ffd100" stop-opacity="0"/></linearGradient>
    <linearGradient id="goldtext" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#ffd100"/><stop offset="1" stop-color="#c8860a"/></linearGradient>
    <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#1e1b4b"/></linearGradient>`;
const STYLE = `
    text { ${BODY} font-size: 14px; fill: #fff; }
    .t { ${TITLE} font-weight: bold; }
    .l { opacity: 0; animation: in .45s ease-out forwards; }
    .glint { animation: run 7s linear infinite; }
    @keyframes in { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: none; } }
    @keyframes run { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -1000; } }
    @keyframes blink { 50% { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .l, .glint, .fx { animation: none !important; opacity: 1 !important; } }`;
const svg = (w, h, label, body, style = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <defs>${DEFS}</defs>
  <style>${STYLE}${style}</style>
${body}
</svg>
`;
const tooltip = (x, y, w, h, glint = false) => `  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="url(#tip)" stroke="#4a4f6a" stroke-width="2"/>
${glint ? `  <rect class="glint" x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="url(#gold)" stroke-width="2.5" pathLength="1000" stroke-dasharray="90 910"/>` : ""}`;
// o: { cls, style, fill } merged into the one <text>; fill goes in style because the CSS `text { fill }` rule beats attributes
const line = (x, y, txt, d, o = {}) => `  <text class="l ${o.cls ?? ""}" x="${x}" y="${y}" style="animation-delay:${d}s; ${o.fill ? `fill:${o.fill}; ` : ""}${o.style ?? ""}">${txt}</text>`;
const each = (name, fn) => { for (const l of LANGS) write(`${name}-${l}.svg`, fn(l)); };

// ---------- 1. Hero: the whole collection as a legendary item ----------
const HERO = {
  en: { sub: ["Binds to account", "Unique-Equipped"], left: "Addon Collection", right: "Interface",
    stats: (n, t, c) => [`+${n} Addons`, `+${t} Downloads`, `+${c} Game clients`],
    equip: ["Equip: A lighter, cleaner and smarter UI for every playstyle.", "Equip: Retail, Classic and WoW Forever.", "Use: Install from CurseForge in one click."],
    dur: "Durability 100 / 100", req: "Requires World of Warcraft", flavor: "\"Made by a player, for players.\"" },
  es: { sub: ["Ligado a la cuenta", "Único - Equipado"], left: "Colección de addons", right: "Interfaz",
    stats: (n, t, c) => [`+${n} addons`, `+${t} descargas`, `+${c} clientes del juego`],
    equip: ["Equipar: Una interfaz más ligera, limpia y lista para tu estilo.", "Equipar: Retail, Classic y WoW Forever.", "Uso: Instálalo desde CurseForge en un clic."],
    dur: "Durabilidad 100 / 100", req: "Requiere World of Warcraft", flavor: "«Hecho por un jugador, para jugadores.»" },
};
each("hero", (lang) => {
  const t = HERO[lang], st = t.stats(rows.length, fmt(total, lang), usedClients.length);
  return svg(840, 452, `Pirson's Addons: ${st.join(", ")}`, `
  <rect class="fx" x="16" y="18" width="72" height="72" rx="6" fill="url(#gem)" stroke="${GOLD}" stroke-width="2" style="animation: pulse 3s ease-in-out infinite"/>
  <path d="M52 30 L58 48 L76 54 L58 60 L52 78 L46 60 L28 54 L46 48 Z" fill="url(#goldtext)"/>
${tooltip(104, 10, 726, 432, true)}
${line(128, 50, "Pirson's Addons", 0.1, { cls: "t", style: `font-size:26px; fill:${Q.legendary}` })}
${line(128, 82, t.sub[0], 0.3)}
${line(128, 106, t.sub[1], 0.45)}
${line(128, 130, t.left, 0.6)}
  <text class="l" x="806" y="130" text-anchor="end" style="animation-delay:.6s">${t.right}</text>
${st.map((s, i) => line(128, 164 + i * 24, esc(s), (0.8 + i * 0.15).toFixed(2))).join("\n")}
${t.equip.map((s, i) => line(128, 254 + i * 24, esc(s), (1.4 + i * 0.2).toFixed(2), { fill: GREEN })).join("\n")}
${line(128, 344, t.dur, 2.1)}
${line(128, 368, t.req, 2.25)}
${line(128, 410, esc(t.flavor), 2.5, { fill: GOLD, style: "font-style:italic" })}`, `
    @keyframes pulse { 50% { stroke: #fff3b0; } }`);
});

// ---------- 2. Section headers ----------
const HEADERS = {
  achievements: ["Achievements", "Logros"], collection: ["Addon Collection", "Colección de addons"],
  realms: ["Supported Clients", "Clientes compatibles"], install: ["Installation", "Instalación"],
};
for (const [id, names] of Object.entries(HEADERS)) each(`header-${id}`, (lang) => {
  const name = names[LANGS.indexOf(lang)], half = name.length * 8.5 + 10;
  const orn = (x1, x2) => `<line x1="${x1}" y1="30" x2="${x2}" y2="30" stroke="${GOLD}" stroke-opacity=".7" stroke-width="1.5"/><path d="M${x2 > x1 ? x2 : x2} 30 l6 -6 l6 6 l-6 6 Z" fill="${GOLD}" transform="translate(${x2 > x1 ? 0 : -12} 0)"/>`;
  return svg(840, 60, name, `
  <rect x="1" y="1" width="838" height="58" rx="10" fill="url(#tip)" stroke="#4a4f6a"/>
  ${orn(40, 420 - half - 18)}
  ${orn(800, 420 + half + 18)}
  <text class="t" x="420" y="39" text-anchor="middle" style="font-size:26px; fill:url(#goldtext); letter-spacing:1px">${esc(name)}</text>`);
});

// ---------- 3. Achievements ----------
const top = rows[0], milestone = Math.floor(total / 50000) * 50000;
const ACH = {
  en: { earned: "Achievement Earned", list: [
    [50, `${fmt(milestone, "en")} Downloads`, `Reach ${fmt(milestone, "en")} downloads on CurseForge.`],
    [25, "Fan Favorite", `${top.name}: ${fmt(top.downloads, "en")} downloads.`],
    [10, "Collector", `Publish ${rows.length} addons for ${usedClients.length} game clients.`]] },
  es: { earned: "Logro conseguido", list: [
    [50, `${fmt(milestone, "es")} descargas`, `Alcanza ${fmt(milestone, "es")} descargas en CurseForge.`],
    [25, "El favorito del público", `${top.name}: ${fmt(top.downloads, "es")} descargas.`],
    [10, "Coleccionista", `Publica ${rows.length} addons para ${usedClients.length} clientes del juego.`]] },
};
each("achievements", (lang) => {
  const t = ACH[lang];
  const toasts = t.list.map(([pts, name, desc], i) => {
    const y = 10 + i * 100, d = (0.2 + i * 0.35).toFixed(2);
    return `  <g class="l" style="animation-delay:${d}s">
    <rect x="60" y="${y}" width="720" height="84" rx="42" fill="url(#tip)" stroke="url(#goldtext)" stroke-width="2.5"/>
    <rect x="66" y="${y + 6}" width="708" height="72" rx="36" fill="none" stroke="#4a4f6a"/>
    <circle cx="104" cy="${y + 42}" r="30" fill="url(#gem)" stroke="url(#goldtext)" stroke-width="3"/>
    <text class="t" x="104" y="${y + 50}" text-anchor="middle" style="font-size:22px; fill:url(#goldtext)">${pts}</text>
    <text x="440" y="${y + 26}" text-anchor="middle" style="font-size:12px; fill:${GOLD}; letter-spacing:1px">${t.earned.toUpperCase()}</text>
    <text class="t" x="440" y="${y + 52}" text-anchor="middle" style="font-size:22px">${esc(name)}</text>
    <text x="440" y="${y + 72}" text-anchor="middle" style="font-size:13px; fill:#c9c9c9">${esc(desc)}</text>
  </g>`;
  }).join("\n");
  return svg(840, 306, t.list.map((x) => `${x[1]}: ${x[2]}`).join(" "), toasts);
});

// ---------- 4. One tooltip card per addon ----------
const CARD = { en: { equip: "Equip:", dl: "Downloads", all: "Every client" }, es: { equip: "Equipar:", dl: "Descargas", all: "Todos los clientes" } };
for (const a of rows) each(`addon-${a.abbr.toLowerCase()}`, (lang) => {
  const t = CARD[lang], q = Q[quality(a.downloads)], fs = a.name.length > 30 ? 14 : a.name.length > 22 ? 16 : 18;
  const cl = a.clients ?? [], clients = cl.length >= 7 ? t.all : cl.map((k) => SHORT[k]).join(" · ");
  return svg(410, 182, `${a.name}: ${a[lang].join(" ")}`, `
${tooltip(1, 1, 408, 180)}
  <rect x="14" y="14" width="46" height="46" rx="5" fill="url(#gem)" stroke="${q}" stroke-width="2"/>
  <text class="t" x="37" y="44" text-anchor="middle" style="font-size:18px; fill:${q}">${a.abbr}</text>
${line(72, 34, esc(a.name), 0.1, { cls: "t", style: `font-size:${fs}px; fill:${q}` })}
${line(72, 55, esc(CATS[a.cat][LANGS.indexOf(lang)]), 0.2, { style: "font-size:13px" })}
  <text class="l" x="394" y="55" text-anchor="end" style="font-size:13px; animation-delay:.2s">${a.version ? `v${a.version}` : ""}</text>
${line(16, 90, `${t.equip} ${esc(a[lang][0])}`, 0.3, { fill: GREEN, style: "font-size:13px" })}
${line(16, 109, esc(a[lang][1]), 0.3, { fill: GREEN, style: "font-size:13px" })}
${line(16, 138, esc(clients), 0.4, { style: "font-size:13px" })}
${line(16, 164, `${t.dl}: <tspan fill="${GOLD}">${fmt(a.downloads, lang)}</tspan>`, 0.5, { fill: "#c9c9c9", style: "font-size:13px" })}`);
});

// ---------- 5. Supported clients as a realm list ----------
const REALM = {
  en: { title: "Realm Selection", cols: ["Client", "Addons", "Population"], pop: ["High", "Medium", "Low"], foot: "Population = how many of our addons run on that client" },
  es: { title: "Selección de reino", cols: ["Cliente", "Addons", "Población"], pop: ["Alta", "Media", "Baja"], foot: "Población = cuántos de nuestros addons funcionan en ese cliente" },
};
each("realms", (lang) => {
  const t = REALM[lang], RH = 34, Y0 = 92, H = Y0 + usedClients.length * RH + 24, max = Math.max(...usedClients.map(([k]) => rows.filter((a) => a.clients?.includes(k)).length));
  const body = usedClients.map(([k, en, es], i) => {
    const n = rows.filter((a) => a.clients?.includes(k)).length, y = Y0 + i * RH;
    const [pop, col] = n >= 10 ? [t.pop[0], GREEN] : n >= 5 ? [t.pop[1], GOLD] : [t.pop[2], "#ff8040"];
    return `  <g class="l" style="animation-delay:${(0.2 + i * 0.1).toFixed(2)}s">
    <rect x="30" y="${y - 22}" width="780" height="${RH - 4}" rx="4" fill="${i % 2 ? "#ffffff08" : "#ffffff12"}"/>
    <text x="48" y="${y}" style="fill:${GOLD}">${esc(lang === "en" ? en : es)}</text>
    <rect x="420" y="${y - 13}" width="${(n / max) * 220}" height="12" rx="3" fill="url(#goldtext)" opacity=".85"/>
    <text x="${430 + (n / max) * 220}" y="${y}">${n}</text>
    <text x="790" y="${y}" text-anchor="end" style="fill:${col}">${pop}</text>
  </g>`;
  }).join("\n");
  return svg(840, H, `${t.title}: ${usedClients.map(([k, en]) => `${en} ${rows.filter((a) => a.clients?.includes(k)).length}`).join(", ")}`, `
${tooltip(1, 1, 838, H - 2)}
  <rect x="1" y="1" width="838" height="44" rx="8" fill="#2a1a08"/>
  <rect x="1" y="44" width="838" height="2" fill="url(#goldtext)"/>
  <text class="t" x="420" y="31" text-anchor="middle" style="font-size:20px; fill:url(#goldtext)">${t.title}</text>
  <text x="48" y="70" style="font-size:12px; fill:#9d9d9d">${t.cols[0].toUpperCase()}</text>
  <text x="420" y="70" style="font-size:12px; fill:#9d9d9d">${t.cols[1].toUpperCase()}</text>
  <text x="790" y="70" text-anchor="end" style="font-size:12px; fill:#9d9d9d">${t.cols[2].toUpperCase()}</text>
${body}
  <text x="420" y="${H - 16}" text-anchor="middle" style="font-size:12px; fill:#9d9d9d">${t.foot}</text>`);
});

// ---------- 6. Installation as a quest ----------
const QUEST = {
  en: { title: "A Better Interface", text: ["Your interface could use some help, adventurer. Gather my addons", "and see how much smoother Azeroth feels."],
    obj: "Objectives", list: ["Get the addon from CurseForge or a GitHub release", "Put its folder in World of Warcraft/_version_/Interface/AddOns", "Restart the game and enable it in the AddOns menu"],
    rew: "Rewards", rewards: ["A cleaner, faster UI", "+1000 reputation with Pirson's Addons"] },
  es: { title: "Una interfaz mejor", text: ["Tu interfaz necesita ayuda, aventurero. Reúne mis addons", "y verás qué fácil se vuelve Azeroth."],
    obj: "Objetivos", list: ["Consigue el addon en CurseForge o en una release de GitHub", "Pon su carpeta en World of Warcraft/_versión_/Interface/AddOns", "Reinicia el juego y actívalo en el menú de AddOns"],
    rew: "Recompensas", rewards: ["Una interfaz más limpia y rápida", "+1000 de reputación con Pirson's Addons"] },
};
each("quest", (lang) => {
  const t = QUEST[lang], INK = "#3b2a14", HEAD = "#5a3a12";
  const objs = t.list.map((o, i) => {
    const y = 176 + i * 30, d = 0.8 + i * 0.6;
    return `  <text x="66" y="${y}" style="fill:${INK}">- ${esc(o)}</text>
  <text class="zero" x="772" y="${y}" text-anchor="end" style="fill:${INK}; animation-delay:${d}s">0/1</text>
  <text class="l" x="772" y="${y}" text-anchor="end" style="fill:#1f6b12; font-weight:bold; animation-delay:${d}s">1/1 ✓</text>`;
  }).join("\n");
  return svg(840, 400, `${t.title}. ${t.list.join(". ")}.`, `
  <defs><linearGradient id="parch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3e6c4"/><stop offset="1" stop-color="#dcc391"/></linearGradient></defs>
  <rect x="1" y="1" width="838" height="398" rx="10" fill="#2a1a08"/>
  <rect x="12" y="12" width="816" height="376" rx="6" fill="url(#parch)" stroke="#8a6414" stroke-width="2"/>
  <text class="t" x="44" y="58" style="font-size:26px; fill:${HEAD}">${esc(t.title)}</text>
  <line x1="44" y1="72" x2="796" y2="72" stroke="${HEAD}" stroke-opacity=".4"/>
  <text x="44" y="102" style="fill:${INK}">${esc(t.text[0])}</text>
  <text x="44" y="124" style="fill:${INK}">${esc(t.text[1])}</text>
  <text class="t" x="44" y="152" style="font-size:18px; fill:${HEAD}">${t.obj}</text>
${objs}
  <text class="t" x="44" y="292" style="font-size:18px; fill:${HEAD}">${t.rew}</text>
  <rect x="44" y="306" width="36" height="36" rx="4" fill="url(#gem)" stroke="#8a6414" stroke-width="2"/>
  <path d="M62 312 L65 321 L74 324 L65 327 L62 336 L59 327 L50 324 L59 321 Z" fill="url(#goldtext)"/>
  <text x="92" y="322" style="fill:${INK}; font-weight:bold">${esc(t.rewards[0])}</text>
  <text x="92" y="340" style="fill:${INK}; font-size:13px">${esc(t.rewards[1])}</text>`, `
    .zero { animation: out .3s forwards; }
    @keyframes out { to { opacity: 0; } }
    @media (prefers-reduced-motion: reduce) { .zero { display: none; } }`);
});

// ---------- 7. Footer: the chat frame ----------
const CHAT = {
  en: [["#ffff00", `[Pirson] has earned the achievement <tspan fill="${Q.legendary}">[${fmt(milestone, "en")} Downloads]</tspan>!`],
    ["#40ff40", "[Guild] [Pirson]: Thanks for using my addons! See you in Azeroth."], ["#ff80ff", "To [Pirson]: "]],
  es: [["#ffff00", `¡[Pirson] ha conseguido el logro <tspan fill="${Q.legendary}">[${fmt(milestone, "es")} descargas]</tspan>!`],
    ["#40ff40", "[Hermandad] [Pirson]: ¡Gracias por usar mis addons! Nos vemos en Azeroth."], ["#ff80ff", "Para [Pirson]: "]],
};
each("chat", (lang) => svg(840, 130, "Thanks for using my addons! See you in Azeroth.", `
  <rect x="1" y="1" width="838" height="128" rx="6" fill="#000000" fill-opacity=".72" stroke="#4a4f6a"/>
  <rect x="1" y="1" width="140" height="26" rx="6" fill="#1a1a1a"/>
  <text x="16" y="19" style="font-size:12px; fill:${GOLD}">General</text>
${CHAT[lang].map(([c, s], i) => line(16, 52 + i * 26, `${s}${i === 2 ? `<tspan class="fx" style="animation: blink 1s step-end infinite">|</tspan>` : ""}`, (0.3 + i * 0.6).toFixed(1), { fill: c, style: "white-space:pre" })).join("\n")}`));

// ---------- 8. CurseForge button ----------
each("button-curseforge", (lang) => svg(260, 52, "CurseForge", `
  <linearGradient id="btn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3261e"/><stop offset="1" stop-color="#5c0f0a"/></linearGradient>
  <rect x="2" y="2" width="256" height="48" rx="6" fill="url(#btn)" stroke="url(#goldtext)" stroke-width="3"/>
  <text class="t" x="130" y="33" text-anchor="middle" style="font-size:18px; fill:url(#goldtext)">${lang === "en" ? "Get them on CurseForge" : "Descárgalos en CurseForge"}</text>`));

// ---------- 9. README.md / README.es.md ----------
const RD = {
  en: { file: "README.md", other: `<b>English</b> · <a href="README.es.md">Español</a>`,
    hero: `Pirson's Addons shown as a legendary item tooltip: ${rows.length} addons, ${fmt(total, "en")} downloads on CurseForge, ${usedClients.length} game clients. Retail, Classic and WoW Forever.`,
    btn: "Get them on CurseForge", src: "Source code on GitHub", note: `Numbers refresh every Monday from CurseForge. Last update: ${data.date}.`,
    tail: `## Contributing

Pull requests are welcome: fork the repository, create a branch and open a Pull Request.

## License

Every addon is under the MIT License, except **Dungeon Quest Atlas** and **Azeroth AI** (All Rights Reserved). Each repository includes its own \`LICENSE\` file.` },
  es: { file: "README.es.md", other: `<a href="README.md">English</a> · <b>Español</b>`,
    hero: `Pirson's Addons como el tooltip de un objeto legendario: ${rows.length} addons, ${fmt(total, "es")} descargas en CurseForge, ${usedClients.length} clientes del juego. Retail, Classic y WoW Forever.`,
    btn: "Descárgalos en CurseForge", src: "Código fuente en GitHub", note: `Las cifras se actualizan cada lunes desde CurseForge. Última actualización: ${data.date}.`,
    tail: `## Contribuir

Las pull requests son bienvenidas: haz un fork del repositorio, crea una rama y abre una Pull Request.

## Licencia

Todos los addons usan la licencia MIT, excepto **Dungeon Quest Atlas** y **Azeroth AI** (todos los derechos reservados). Cada repositorio incluye su propio archivo \`LICENSE\`.` },
};
const img = (f, alt, w = "100%") => `<img src="assets/${f}" width="${w}" alt="${esc(alt)}"/>`;
for (const lang of LANGS) {
  const t = RD[lang], i = LANGS.indexOf(lang), hdr = (id) => `<p align="center">${img(`header-${id}-${lang}.svg`, HEADERS[id][i])}</p>`;
  const md = `<p align="center">${img(`hero-${lang}.svg`, t.hero, "760")}</p>

<p align="center">${t.other}</p>

<p align="center"><a href="https://www.curseforge.com/members/pirson/projects">${img(`button-curseforge-${lang}.svg`, t.btn, "260")}</a></p>

${hdr("achievements")}

<p align="center">${img(`achievements-${lang}.svg`, ACH[lang].list.map((x) => `${x[1]}: ${x[2]}`).join(" "))}</p>

${hdr("collection")}

<p align="center">
${rows.map((a) => `  <a href="${a.url}">${img(`addon-${a.abbr.toLowerCase()}-${lang}.svg`, `${a.name}: ${a[lang].join(" ")}`, "49%")}</a>`).join("\n")}
</p>

<p align="center"><sub>${t.note}</sub></p>

<details>
<summary><b>${t.src}</b></summary>

${rows.filter((a) => a.repo).map((a) => `- [${a.name}](https://github.com/${ORG}/${a.repo})`).join("\n")}

</details>

${hdr("realms")}

<p align="center">${img(`realms-${lang}.svg`, REALM[lang].title)}</p>

${hdr("install")}

<p align="center">${img(`quest-${lang}.svg`, `${QUEST[lang].title}. ${QUEST[lang].list.join(". ")}.`)}</p>

${t.tail}

<p align="center">${img(`chat-${lang}.svg`, CHAT[lang][1][1])}</p>
`;
  writeFileSync(new URL(`../profile/${t.file}`, import.meta.url), md);
}

console.log(`built ${rows.length} addons, ${fmt(total, "en")} downloads, ${usedClients.length} clients`);
