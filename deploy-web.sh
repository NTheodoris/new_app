#!/usr/bin/env bash
# Χτίζει την έκδοση web και την ανεβάζει στο branch gh-pages (GitHub Pages).
# Διεύθυνση: https://ntheodoris.github.io/new_app/
set -euo pipefail
cd "$(dirname "$0")"

npx ng build --base-href /new_app/
OUT=dist/lesvos-beaches/browser
cp "$OUT/index.html" "$OUT/404.html"   # για να ανοίγουν σωστά και οι εσωτερικές σελίδες (π.χ. /beach/petra)
touch "$OUT/.nojekyll"

TMP=$(mktemp -d)
git worktree add --detach "$TMP" >/dev/null
(
  cd "$TMP"
  git checkout --orphan gh-pages-tmp >/dev/null 2>&1
  git rm -rfq . >/dev/null 2>&1 || true
  cp -r "$OLDPWD/$OUT/." .
  git add -A
  git commit -qm "Deploy web version $(date -u +%Y-%m-%dT%H:%MZ)"
  git push -f origin HEAD:gh-pages
)
git worktree remove --force "$TMP"
git branch -D gh-pages-tmp >/dev/null 2>&1 || true
echo "Έτοιμο: https://ntheodoris.github.io/new_app/"
