# GC/MGC Futures Risk & Lot Size Calculator

An offline-first PWA for calculating position size, risk, and reward on COMEX Gold futures (GC) and Micro Gold futures (MGC). Includes a trade journal, analytics dashboard, daily loss-limit guard, and contract spec reference.

## Features

- **Risk-based lot sizing** — enter capital, risk %, entry, and stop; get exact contract size
- **Custom risk %** in addition to 2% / 3% / 5% / 10% presets
- **GC or MGC** contract toggle (point value auto-adjusts: $100 vs $10 per point)
- **Buy/Sell direction** toggle
- **Multi-R:R snapshot table** — see targets/profit at 1:1, 1.5, 2, 3, 4 simultaneously
- **Partial exit planner** — split position into two legs at different R:R levels
- **Fees/commission** input with breakeven-move calculation
- **Trade journal** — log trades, mark win/loss/breakeven, add actual P/L, search & filter
- **Export/Import** journal as JSON or CSV
- **Stats dashboard** — win rate, avg win/loss, net P/L, expectancy, profit factor, equity curve chart
- **Daily Risk Guard** — set a max daily loss ($ or %) and max trades/day; get a live stop-trading alert based on today's journaled results
- **Contract specs reference** tab
- **Dark/Light theme** toggle
- **Installable PWA** — works fully offline once loaded once, installable to home screen/desktop

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload all files in this folder, preserving the structure:
   ```
   index.html
   manifest.json
   service-worker.js
   css/style.css
   js/app.js
   icons/icon-192.png
   icons/icon-512.png
   ```
3. In repo Settings → Pages, set source to your main branch (root).
4. Visit the published URL. Open it once while online so the service worker caches all assets.
5. On mobile, use "Add to Home Screen" (iOS Safari) or the install prompt (Android Chrome) to install it like an app.
6. After the first load, the app works fully offline — including the journal, which is stored locally on your device via `localStorage` (never sent to any server).

## Notes

- All data (journal, settings, theme) stays on your device only.
- Point values (GC = $100/point, MGC = $10/point) are based on standard COMEX contract specs — always confirm current specs/margin with your broker before trading.
- To fully reset the app, use the "Reset Journal" button in the Journal tab, or clear site data in your browser.
