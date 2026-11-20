"""Builds curseforge/<slug>.html (CurseForge description, paste in the Markdown editor) from each addon's README.

Usage: python3 scripts/curseforge.py <folder with the addon clones> [slug ...]
Same layout for every addon: hero, SEO intro, video, sections with gold headings, support, then the Spanish block.
WoW Translator is hand-written (curseforge/wow-translator.html) and skipped unless named.
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CF = "https://raw.githubusercontent.com/Pirson-s-Addons/.github/main/profile/assets/cf/"
ORG = "https://github.com/Pirson-s-Addons"
GOLD = "#ffd100"
HAND_WRITTEN = {"wow-translator"}

T = {
    "en": {"other": "<em>Español más abajo</em>", "video": "Video guide", "src": "Source code", "bug": "Report a bug",
           "is": "is a", "addon": "World of Warcraft addon", "for": "for", "every": "Retail, every Classic client and WoW Forever",
           "and": "and", "works": "Works on", "lic": ["MIT License", "All rights reserved"],
           "h": {"screens": "Screenshots", "what": "What it does", "rules": "Rules", "features": "Features", "usage": "How to use",
                 "install": "Installation", "compat": "Compatibility", "notes": "Good to know", "faq": "FAQ",
                 "authors": "For addon authors", "credits": "Credits", "support": "Support the project"},
           "install": ["Install it with the <strong>CurseForge app</strong> (recommended: it keeps the addon updated and puts it in the right client), or download the ZIP from the Files tab.",
                       "If you install by hand, extract the <code>{folder}</code> folder into <code>World of Warcraft/&lt;version&gt;/Interface/AddOns/</code>.",
                       "Restart the game and make sure <strong>{name}</strong> is enabled in the AddOns list."],
           "support": "{name} is made in my free time. If it makes your adventures better, you can support it, or simply <strong>leave a comment, a rating or share it with your guild</strong>.",
           "coffee": "Buy me a coffee", "tip": "Tip:"},
    "es": {"video": "Vídeo guía", "src": "Código fuente", "bug": "Informar de un fallo",
           "is": "es un", "addon": "addon de World of Warcraft", "for": "para", "every": "Retail, todos los clientes Classic y WoW Forever",
           "and": "y", "works": "Funciona en", "lic": ["Licencia MIT", "Todos los derechos reservados"],
           "h": {"screens": "Capturas", "what": "Qué hace", "rules": "Reglas", "features": "Funciones", "usage": "Cómo se usa",
                 "install": "Instalación", "compat": "Compatibilidad", "notes": "A tener en cuenta", "faq": "Preguntas frecuentes",
                 "authors": "Para autores de addons", "credits": "Créditos", "support": "Apoya el proyecto"},
           "install": ["Instálalo con la <strong>app de CurseForge</strong> (recomendado: se actualiza solo y lo coloca en el cliente correcto) o descarga el ZIP de la pestaña Files.",
                       "Si lo instalas a mano, descomprime la carpeta <code>{folder}</code> en <code>World of Warcraft/&lt;versión&gt;/Interface/AddOns/</code>.",
                       "Reinicia el juego y comprueba que <strong>{name}</strong> está activado en la lista de addons."],
           "support": "{name} se hace en mi tiempo libre. Si mejora tus aventuras, puedes apoyarlo, o simplemente <strong>dejar un comentario, una valoración o compartirlo con tu hermandad</strong>.",
           "coffee": "Invítame a un café", "tip": "Consejo:"},
}
KIND = [("screens", r"screenshots|capturas"), ("what", r"what it does|qué hace"), ("rules", r"rules|reglas"),
        ("features", r"features|funciones"), ("usage", r"usage|uso|commands|comandos"), ("install", r"installation|instalación"),
        ("compat", r"compatibility|compatibilidad"), ("notes", r"notes|notas"), ("faq", r"faq|preguntas"),
        ("authors", r"for addon authors|para autores|\bapi\b"), ("credits", r"credits|créditos")]
ORDER = ["what", "other", "rules", "features", "usage", "install", "compat", "notes", "faq", "authors", "credits"]


def kind(title):
    t = title.lower()
    for k, rx in KIND:
        if re.search(rx, t):
            return k
    return "other"


def inline(s):
    # code spans first (escaped, kept apart), then bold / italics / links
    codes = []
    s = re.sub(r"`([^`]+)`", lambda m: codes.append(html.escape(m.group(1))) or f"\0{len(codes) - 1}\0", s)
    s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", lambda m: f'<a href="{absurl(m.group(2))}" rel="nofollow">{m.group(1)}</a>', s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<![\w*])\*([^*\s][^*]*?)\*(?![\w*])", r"<em>\1</em>", s)
    return re.sub(r"\0(\d+)\0", lambda m: f"<code>{codes[int(m.group(1))]}</code>", s)


REPO = ""
def absurl(u):
    if re.match(r"https?://", u):
        return u
    return f"{ORG}/{REPO}/blob/main/{u}" if REPO else u


def table(rows):
    head, body = rows[0], rows[2:]
    th = "".join(f"<th>{inline(c)}</th>" for c in head)
    trs = "\n".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in body)
    return f'<table style="margin-left: auto; margin-right: auto;">\n<thead><tr>{th}</tr></thead>\n<tbody>\n{trs}\n</tbody>\n</table>'


def md(block, lang):
    """Markdown block (README section body) -> CurseForge HTML."""
    out, lines, i = [], block.split("\n"), 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        if not s or s in ("<details>", "</details>", "<br/>", "<br>"):
            i += 1; continue
        m = re.match(r"<summary>(?:<b>)?(.*?)(?:</b>)?</summary>", s)
        if m:
            out.append(f'<h3><span style="color: {GOLD};">{inline(m.group(1))}</span></h3>'); i += 1; continue
        if s.startswith("```"):
            j = i + 1
            while j < len(lines) and not lines[j].strip().startswith("```"):
                j += 1
            out.append("<pre><code>" + html.escape("\n".join(lines[i + 1:j])) + "</code></pre>"); i = j + 1; continue
        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                # "\|" inside a cell is a literal pipe (`/dqa collect on\|off`), not a column break
                cells = re.split(r"(?<!\\)\|", lines[i].strip().strip("|"))
                rows.append([c.strip().replace("\\|", "|") for c in cells]); i += 1
            out.append(table(rows)); continue
        if s.startswith("### "):
            out.append(f'<h3><span style="color: {GOLD};">{inline(s[4:])}</span></h3>'); i += 1; continue
        if s.startswith(">"):
            q = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                q.append(lines[i].strip()[1:].strip()); i += 1
            txt = " ".join(x for x in q if not re.match(r"\[!\w+\]", x))
            out.append(f'<blockquote><p><span style="color: #1eff00;">{T[lang]["tip"]}</span> {inline(txt)}</p></blockquote>'
                       if any(re.match(r"\[!(TIP|NOTE)\]", x) for x in q) else f"<blockquote><p>{inline(txt)}</p></blockquote>"); continue
        if re.match(r"[-*] ", s) or re.match(r"\d+\. ", s):
            ordered = bool(re.match(r"\d+\. ", s)); items = []
            while i < len(lines) and (re.match(r"\s*([-*]|\d+\.) ", lines[i]) or (lines[i].startswith("  ") and lines[i].strip() and items)):
                t = lines[i].strip()
                if re.match(r"([-*]|\d+\.) ", t):
                    items.append(re.sub(r"^([-*]|\d+\.) ", "", t))
                else:
                    items[-1] += " " + t
                i += 1
            lis = []
            for it in items:
                h = inline(it)
                h = re.sub(r"^<strong>(.+?)</strong>", lambda m: f'<strong><span style="color: {GOLD};">{m.group(1)}</span></strong>', h)
                lis.append(f"<li>{h}</li>")
            tag = "ol" if ordered else "ul"
            out.append(f"<{tag}>\n" + "\n".join(lis) + f"\n</{tag}>"); continue
        if s.startswith("<"):  # raw HTML line (tables of screenshots handled elsewhere): keep as is
            out.append(s); i += 1; continue
        para = [s]; i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"\s*([-*>|#]|\d+\.|```|<)", lines[i]):
            para.append(lines[i].strip()); i += 1
        out.append(f"<p>{inline(' '.join(para))}</p>")
    return "\n".join(out)


def shots(block):
    pairs = re.findall(r'<img src="([^"]+)"[^>]*?alt="([^"]*)"[^>]*>(?:<br>\s*<sub>([^<]*)</sub>)?', block)
    pairs = [(src, cap or alt) for src, alt, cap in pairs if "img.youtube.com" not in src]  # the video is embedded above
    if not pairs:
        return ""
    # Animated GIFs: on their own, centred, above the table
    gifs = "".join(f'<p style="text-align: center;"><img src="{absurl(src)}" alt="{html.escape(cap)}" width="520"><br><em>{cap}</em></p>\n'
                   for src, cap in pairs if src.lower().endswith(".gif"))
    pairs = [(src, cap) for src, cap in pairs if not src.lower().endswith(".gif")]
    if not pairs:
        return gifs.rstrip()
    if len(pairs) == 1:
        src, cap = pairs[0]
        return gifs + f'<p style="text-align: center;"><img src="{absurl(src)}" alt="{html.escape(cap)}" width="760"><br><em>{cap}</em></p>'
    cells = [f'<td style="text-align: center;"><img src="{absurl(s)}" alt="{html.escape(c)}" width="400"><br><em>{c}</em></td>' for s, c in pairs]
    trs = "\n".join("<tr>\n" + "\n".join(cells[k:k + 2]) + "\n</tr>" for k in range(0, len(cells), 2))
    return gifs + f'<table style="margin-left: auto; margin-right: auto;">\n<tbody>\n{trs}\n</tbody>\n</table>'


def h2(title):
    return (f'<p style="text-align: center;"><img src="{CF}divider.png" alt="" width="836"></p>\n'
            f'<h2 style="text-align: center;"><span style="color: {GOLD}; font-family: georgia, serif;">{title}</span></h2>')


def sections(readme):
    s = open(readme, encoding="utf-8").read()
    s = s[s.find("\n## ") + 1:]
    s = re.sub(r'<br/>\s*<p align="center"><a href="https://github.com/Pirson-s-Addons"><img[^\n]*readme-footer[^\n]*</p>\s*$', "", s.strip())
    s = re.sub(r"\n---\s*\n\s*\*\*Autho?r\*\*:[^\n]*\s*$", "", s)
    out = []
    for part in re.split(r"(?m)^## ", s):
        if part.strip():
            title, _, body = part.partition("\n")
            title = re.sub(r"^[^\w¿¡(]+", "", title).strip()
            out.append((kind(title), title, body.strip()))
    return out


def lang_block(a, lang, folder, video):
    t = T[lang]; i = 0 if lang == "en" else 1
    name, c = a["name"], a["color"]
    clients = [x[i] for x in a["clients"]]
    clients_txt = t["every"] if len(clients) >= 7 else (clients[0] if len(clients) == 1 else ", ".join(clients[:-1]) + f" {t['and']} " + clients[-1])
    tagline = a[lang]
    links = []
    if lang == "en":
        links.append(f'<strong><span style="color: {GOLD};">English</span></strong>'); links.append(t["other"])
    else:
        links.append(f'<strong><span style="color: {GOLD};">Español</span></strong>')
    if video:
        links.append(f'<a href="https://www.youtube.com/watch?v={video}" rel="nofollow">{t["video"]}</a>')
    if a["repo"]:
        links.append(f'<a href="{ORG}/{a["repo"]}" rel="nofollow">{t["src"]}</a>')
        links.append(f'<a href="{ORG}/{a["repo"]}/issues" rel="nofollow">{t["bug"]}</a>')
    out = [f'<p style="text-align: center;"><img src="{CF}hero-{a["abbr"]}-{lang}.jpg" alt="{html.escape(name)}, {t["addon"]}: {html.escape(tagline)}" width="836"></p>',
           f'<p style="text-align: center;">{" · ".join(links)}</p>',
           f'<p style="text-align: center;"><span style="font-size: 16px;"><strong><span style="color: {c};">{html.escape(name)}</span></strong> {t["is"]} <strong>{t["addon"]}</strong> {t["for"]} <strong>{clients_txt}</strong>. {html.escape(tagline)}</span></p>']
    if video:
        out.append(f'<p style="text-align: center;"><iframe src="https://www.youtube.com/embed/{video}" width="836" height="470" allowfullscreen="allowfullscreen"></iframe></p>')
    secs = sections(a["readme"][lang])
    shot = next((b for k, _, b in secs if k == "screens"), "")
    by_kind = {}
    for k, title, body in secs:
        if k != "screens":
            by_kind.setdefault(k, []).append((title, body))
    for k in ORDER:
        if k == "install":
            out.append(h2(t["h"]["install"]))
            out.append("<ol>\n" + "\n".join(f"<li>{x.format(folder=folder, name=html.escape(name))}</li>" for x in t["install"]) + "\n</ol>")
            continue
        if k == "compat" and "compat" not in by_kind:
            out.append(h2(t["h"]["compat"]))
            out.append(f'<p style="text-align: center;">{t["works"]}: ' + " · ".join(f"<strong>{x}</strong>" for x in clients) + f' · {t["lic"][a["license"]]}</p>')
            continue
        for title, body in by_kind.get(k, []):
            out.append(h2(title if k == "other" else t["h"][k]))
            out.append(md(body, lang))
        if k == "what" and shot:  # screenshots right after the explanation
            out.append(h2(t["h"]["screens"]))
            out.append(shots(shot))
    out.append(h2(t["h"]["support"]))
    out.append(f'<p style="text-align: center;">{t["support"].format(name=html.escape(name))}</p>')
    out.append(f'<p style="text-align: center;"><a href="https://coff.ee/franciscorb" target="_blank" rel="nofollow noopener"><img src="{CF}coffee-{lang}.png" alt="{t["coffee"]}" width="280"></a></p>')
    return "\n\n".join(out)


def build(a, clones):
    global REPO
    REPO = a["repo"] or ""
    d = os.path.join(clones, a["repo"] or a["name"].replace(" ", ""))
    a["readme"] = {"en": os.path.join(d, "README.md"), "es": os.path.join(d, "README.es.md")}
    folder = min((f for f in os.listdir(d) if f.endswith(".toc")), key=len)[:-4]
    raw = open(a["readme"]["en"], encoding="utf-8").read()
    video = (re.findall(r"youtube\.com/(?:watch\?v=|embed/)([\w-]{11})", raw) or [None])[0]
    en, es = lang_block(a, "en", folder, video), lang_block(a, "es", folder, video)
    kw = (f"{a['name']}: World of Warcraft addon · {a['cat'][0]} · {a['one'][0]} · addon de World of Warcraft · {a['cat'][1]} · {a['one'][1]}. "
          f"Compatible with " + ", ".join(x[0] for x in a["clients"]) + ".")
    return (en + "\n\n<p>&nbsp;</p>\n<hr>\n<p>&nbsp;</p>\n"
            + f'<p style="text-align: center;"><img src="{CF}lang-es.png" alt="Español: versión en español" width="836"></p>\n<p>&nbsp;</p>\n\n'
            + es + f'\n\n<p style="text-align: center;"><span style="font-size: 11px; color: #6b7089;">{html.escape(kw)}</span></p>\n')


if __name__ == "__main__":
    clones, only = sys.argv[1], set(sys.argv[2:])
    catalog = json.load(open(os.path.join(ROOT, "profile/assets/catalog.json"), encoding="utf-8"))
    os.makedirs(os.path.join(ROOT, "curseforge"), exist_ok=True)
    for a in catalog:
        slug = a["url"].rsplit("/", 1)[1]
        if (only and slug not in only) or (not only and slug in HAND_WRITTEN):
            continue
        open(os.path.join(ROOT, "curseforge", f"{slug}.html"), "w", encoding="utf-8").write(build(a, clones))
        print("wrote", slug)
