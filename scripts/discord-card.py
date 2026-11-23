"""Posts an addon release to the Discord #changelog channel as a card (same look as the earlier cards).

Usage (from the shared packager workflow, after a published release):
  DISCORD_WEBHOOK=... python3 discord-card.py <owner/repo> <tag> <wago id> <release notes file>
The release notes keep only the "What's new" and Spanish "Novedades" sections, as bullets.
"""
import datetime, json, os, re, sys, urllib.request

RAW = "https://raw.githubusercontent.com/Pirson-s-Addons/.github/main/profile/assets/catalog.json"
SEPARATOR = "✧ ────────── ✧ ❂ ✧ ────────── ✧"
COLOR = 12877811  # arcane purple, as the earlier cards


def addon(repo, catalog):
    name = repo.split("/")[-1]
    return next(a for a in catalog if a["repo"] == name or a["name"].replace(" ", "") == name)


def notes(body):
    # "### What's new in v1.2" and "### Novedades v1.2 (Español)" sections, without install steps or footer
    out = []
    for flag, rx in (("🇬🇧 **What's new**", r"^###\s*What's new[^\n]*$"), ("🇪🇸 **Novedades**", r"^###\s*Novedades[^\n]*$")):
        m = re.search(rx + r"\n(.*?)(?=^###|^---|\Z)", body, re.M | re.S)
        if m:
            lines = [re.sub(r"^\s*[-*]\s+", "• ", l) for l in m.group(1).strip().splitlines() if l.strip()]
            out.append(flag + "\n" + "\n".join(lines))
    return "\n\n".join(out)[:4000] or body[:4000]


def card(a, repo, tag, wago_id, description, timestamp=None):
    release = f"https://github.com/{repo}/releases/tag/{tag}"
    embed = {
        "title": f"{a['name']} {tag}",
        "url": release,
        "color": COLOR,
        "description": description,
        "thumbnail": {"url": f"https://wow.pirson.dev/logos/{a['abbr']}.webp"},
        "fields": [
            {"name": "📥 GitHub", "value": f"[{tag}]({release})", "inline": True},
            {"name": "📥 CurseForge", "value": f"[{a['name']}]({a['url']})", "inline": True},
            {"name": "📥 Wago", "value": f"[{a['name']}](https://addons.wago.io/addons/{wago_id})", "inline": True},
            {"name": "​", "value": SEPARATOR, "inline": False},
        ],
        "footer": {"text": "Pirson's Addons"},
    }
    if timestamp:
        embed["timestamp"] = timestamp
    return {"content": f"📢 **{a['name']} {tag}** — ya disponible / now available", "embeds": [embed], "attachments": []}


def send(url, payload, method="POST"):
    req = urllib.request.Request(url, json.dumps(payload).encode(), method=method,
                                 headers={"Content-Type": "application/json", "User-Agent": "pirson-addons-release"})
    with urllib.request.urlopen(req) as res:
        return res.status


if __name__ == "__main__":
    repo, tag, wago_id, notes_file = sys.argv[1:5]
    catalog = json.load(urllib.request.urlopen(urllib.request.Request(RAW, headers={"User-Agent": "pirson-addons-release"})))
    a = addon(repo, catalog)
    payload = card(a, repo, tag, wago_id, notes(open(notes_file, encoding="utf-8").read()))
    payload["embeds"][0]["timestamp"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    print(send(os.environ["DISCORD_WEBHOOK"], payload))
