# The Ledger League (BUP Accounting Forum)

Recruit recognition game. Single-file app: `index.html` (no build step).

## Host on GitHub Pages
1. Create a new GitHub repository and upload `index.html` and `README.md` to the root.
2. Repo Settings > Pages > Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`. Save.
3. Open `https://<your-username>.github.io/<repo-name>/` after a minute or two.

## First use
1. Open `#/admin`, create the admin passcode.
2. Admin > Recruits > Remove sample data.
3. Admin > Import posters: drop your ZIP or images, click Calibrate template, set the portrait and name regions, apply to all, fix names, approve.
4. Admin > Data & setup > export a backup regularly.

## Important limits
- All data (recruits, posters, scores) is stored in each browser's IndexedDB, per device and per site address. Scores are NOT shared between players and the admin passcode is not server-enforced security. Use a Supabase backend for shared leaderboards and real admin permissions.
- Import recruits on the device/browser you will use, then use Export/Restore backup to move data elsewhere.
- Config (scoring, ranks, file-size cap, batch size) is the `CFG` object near the top of the script in `index.html`.
- External resources: JSZip from cdnjs and the Manrope font from Google Fonts.
