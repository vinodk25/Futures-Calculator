# XAUUSD Command Desk

A single-page, offline-capable risk calculator and trade journal for **CFD Gold (XAUUSD)**
trading across The 5%ers, Tradiefy, Lucid Trading, FTMO, FundedNext, and Funding Pips —
all genuine CFD/forex-style prop firms with a daily-loss-percentage rule, unlike futures-only
firms (e.g. Apex Trader Funding) that don't offer XAUUSD CFD accounts and instead use a
trailing max drawdown model, so they were left out of this build.

## Why $/point/lot isn't fixed, unlike a futures contract

On a listed futures contract (e.g. MNQ, NQ), the dollar value of one point is fixed by the
exchange — every broker quoting that contract uses the same multiplier. **Gold CFDs work
differently.** There's no exchange-standard contract; "$/point per lot" depends on:

- **Lot size** you choose (0.01 micro, 0.10 mini, 1.00 standard, or any custom size)
- **Your broker's contract specification** for XAUUSD (most brokers use a 100oz-equivalent
  standard lot, so a $1.00 price move on 1.00 lot ≈ $100, but this is *not universal* —
  always confirm your own broker's contract size before trading real size)

This app ships with three presets — Micro (0.01 lot → $1/point), Mini (0.10 lot →
$10/point), and Standard (1.00 lot → $100/point) — plus a custom override field. Treat the
presets as a common convention, not a guarantee; check your broker's specification sheet.

What genuinely *does* vary by prop firm (and is pulled in via the firm switcher) is the
**account rule set**: daily loss limits, overall/trailing drawdown, and profit targets. All
six firms in this build (5%ers, Tradiefy, Lucid Trading, FTMO, FundedNext, Funding Pips) use
a daily-loss-percentage structure, so the app pre-fills the Daily Risk Guard's max daily loss
from each firm's typical percentage. These are informational defaults only — always confirm
the exact figure against your specific plan's current rulebook, since it varies by account
size, phase, and occasional promotional variants.

## Lot-sizing formula

```
Effective Stop Distance = |Entry − Stop| + Slippage Buffer (points)

Lots = floor(
  ( Capital × Risk% ) / ( Effective Stop Distance × $/point/lot + Commission/lot )
  , to 0.01 lot precision
)
```

- **Slippage buffer** is added directly to the stop distance used for sizing, and that same
  widened distance feeds the Potential Loss figure — it is not cosmetic.
- **Commission** (per lot, round-turn) is added to the per-lot cost before dividing, so it
  reduces the lot size the same way a wider stop would.
- The **raw (unrounded) lot count** is shown separately from the floored figure so you can
  see how much risk budget is left unused after rounding down.

## Why lots are always floored, never rounded to nearest

Rounding to the *nearest* 0.01 lot could push you slightly **over** your intended risk %
roughly half the time. Flooring guarantees the actual dollar risk taken is always **at or
under** the risk % you selected — never over it. The trade-off is that your effective risk
% (shown in the Results panel) will usually be a little below your target risk %, which is
the safer direction to be wrong in.

## Deploying to GitHub Pages

1. Create a new GitHub repository (or use an existing one).
2. Upload all four files to the **repository root**:
   - `index.html`
   - `manifest.json`
   - `icon.svg`
   - `service-worker.js`
3. In the repo, go to **Settings → Pages**, set the source branch (e.g. `main`) and folder
   (`/root`), and save.
4. Open the live URL GitHub gives you **once, while online** — this lets the service worker
   install and cache all four files.
5. After that first visit, the app works fully offline: reloading with no network will still
   load everything from the cache.
6. **On every future deploy**, bump the version string in `service-worker.js`
   (`CACHE_NAME = "xauusd-command-desk-v1"` → `...-v2`, etc.). The activate handler deletes
   any cache that doesn't match the current name, so this is what makes updates actually
   reach returning users instead of being stuck behind the old cached files.

## Data & privacy

All settings and journal entries are stored in your browser's `localStorage` only. There is
no backend and no network calls after the first load — your trade data never leaves your
device. "Clear Journal" wipes only trade history; "Reset All Data" (in the Danger Zone on
the Daily Risk Guard tab) wipes everything, including calculator settings, back to defaults.
