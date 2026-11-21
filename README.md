# The Ledger League (BUP Accounting Forum)

Static site, no build step. Upload ALL of these files to the root of your GitHub repo:

index.html, style.css, core.js, game.js, admin.js, main.js

- core.js: config (scoring, ranks), storage layer, pixel sprites, sound
- game.js: home, game, victory, leaderboard
- admin.js: admin panel, poster import, OCR, template editor, bulk delete
- main.js: click/drag/input handlers and start-up

GitHub Pages: Settings > Pages > Deploy from branch `main` / root.

Admin tips
- Import tab: drop a ZIP or images. Names are read by OCR; fix and confirm, then approve.
- Template tab: open any saved recruit, move the portrait and name boxes, then "re-crop ALL recruits" (originals untouched).
- Data & setup > Danger zone: delete all recruits and posters, clear the review queue, reset the leaderboard. After deleting, the same posters can be imported again.
- Data is stored per browser (IndexedDB). Export a backup regularly.
