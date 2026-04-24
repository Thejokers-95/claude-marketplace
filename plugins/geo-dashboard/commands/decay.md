---
description: List pages that have lost significant traffic over the last 30 days
argument-hint: [--period=N] [--top=N] [--save]
---

# Decay - Pages in Traffic Loss

You analyze GSC data for a French SEO consultant to identify pages in decay.

## Arguments
- `--period`: days compared (default 30). Compares last N days vs prior N days.
- `--top`: max items returned (default 10).
- `--save`: write result JSON to `output/raw/decay-YYYY-MM-DD.json`.

## Task

### Step 1: Load config
Read `config/site.json` and extract `site_url`.

### Step 2: Query GSC
Call GSC `compare_periods` for `site_url`, current {period} days vs prior {period} days, dimension=page.

### Step 3: Compute decay candidates
For each page returned:
- `current_clicks`, `prior_clicks`, `current_impressions`, `prior_impressions`
- `click_delta_abs` = current_clicks - prior_clicks
- `click_delta_pct` = (current_clicks - prior_clicks) / prior_clicks * 100 (only if prior_clicks > 0)

Filter:
- Keep only pages where `click_delta_pct < -20` (loss of 20%+)
- AND `prior_clicks >= 10` (exclude noise from low-traffic pages)

Sort by `click_delta_abs` ascending (biggest losses first).
Take top N.

### Step 4: Format output (French CLI)

```
=== PAGES EN PERTE DE TRAFIC ({period} derniers jours vs precedents) ===

Site analyse: {site_url}
Total pages en perte: {total_count}

| URL | Clics precedents | Clics actuels | Evolution |
|---|---|---|---|
| {url} | {prior_clicks} | {current_clicks} | {delta_pct}% |
| ... | | | |

Disclaimer: Analyse purement GSC. Pour les causes exactes (CWV, contenu, backlinks),
croiser avec les audits techniques de SEO Engine (node6.ai/seo-engine).
```

### Step 5: Save if --save flag
Write JSON to `output/raw/decay-YYYY-MM-DD.json`:
```json
{
  "generated_at": "...",
  "site_url": "...",
  "period_days": 30,
  "total_in_decay": 23,
  "top": [
    { "url": "/...", "prior_clicks": 120, "current_clicks": 45, "click_delta_pct": -62.5 }
  ]
}
```

## Critical rules
- NEVER invent data. If GSC returns 0 matching rows, output "Aucune page en perte significative detectee sur la periode."
- FR output only, simple dashes, no em dashes.
- If `show_upgrade_hints` in site.json is true, append a 1-line mention of SEO Engine CWV audit as potential cause analysis.

## Error handling
- Missing config/site.json: "Config manquante. Run /geo-check d'abord."
- GSC MCP unavailable: "GSC indisponible. Run /geo-check pour diagnostiquer."
