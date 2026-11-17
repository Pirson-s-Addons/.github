#!/usr/bin/env bash
# Walks you through pasting every curseforge/<slug>.html into CurseForge, one addon at a time.
# For each one: copies the description to the clipboard, opens its edit page, waits for Enter.
# Usage: scripts/paste-curseforge.sh [slug ...]   (no slugs = all)
set -euo pipefail
cd "$(dirname "$0")/.."
command -v xclip >/dev/null || { echo "Falta xclip: sudo apt install xclip" >&2; exit 1; }
python3 - "$@" <<'EOF' | while IFS=$'\t' read -r id slug name; do
import json, sys
only = set(sys.argv[1:])
for pid, a in json.load(open("profile/assets/data.json"))["addons"].items():
    slug = a["url"].rsplit("/", 1)[1]
    if not only or slug in only:
        print(f"{pid}\t{slug}\t{slug.replace('-', ' ').title()}")
EOF
  [ -f "curseforge/$slug.html" ] || continue
  xclip -selection clipboard < "curseforge/$slug.html"
  xdg-open "https://authors.curseforge.com/#/projects/$id/description" >/dev/null 2>&1 || true
  echo "→ $name: copiado. En CurseForge: editor Markdown, Ctrl+A, Supr, Ctrl+V, Save."
  read -r -p "  Intro para el siguiente… " < /dev/tty
done
