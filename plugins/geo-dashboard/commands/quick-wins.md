---
description: Identify keywords in positions 4-10 with sub-optimal CTR (quick optimization targets)
argument-hint: [--period=N] [--top=N] [--save]
---

# Quick Wins - Keywords Pos 4-10 with CTR Potential

You are an SEO consultant finding quick-win keywords for a French site.

## Arguments
- `--period`: days to analyze (default 30)
- `--top`: max items (default 20)
- `--save`: write result JSON to `output/raw/quick-wins-YYYY-MM-DD.json`

## Task

### Step 1: Load config
Read `config/site.json` and extract `site_url` and `thresholds`.

Default thresholds if missing:
- `quick_wins_position_range: [4, 10]`
- `quick_wins_ctr_benchmark_ratio: 0.5`

### Step 2: Query GSC
Call GSC `get_analytics` for `site_url`, last {period} days, dimensions [query, page], max 25000 rows.

### Step 3: Compute quick wins

Benchmark CTRs per position (industry averages):
- Position 1: 30%, Position 2: 15%, Position 3: 10%, Position 4: 7%, Position 5: 5%,
- Position 6: 4%, Position 7: 3%, Position 8: 2%, Position 9: 1.5%, Position 10: 1%

For each row where:
- `position` is in range `[thresholds.quick_wins_position_range[0], thresholds.quick_wins_position_range[1]]` (default 4-10)
- AND `ctr < benchmark_at(floor(position)) * thresholds.quick_wins_ctr_benchmark_ratio` (default 0.5)

Compute:
- `ctr_gap` = benchmark_ctr - actual_ctr (in percentage points)
- `potential_clicks` = `impressions * (ctr_gap / 100)` (rounded integer)

Sort by `potential_clicks` desc. Take top N.

### Step 4: Format output (French CLI)

```
=== QUICK WINS - Opportunites CTR (positions 4-10) ===

Site: {site_url}
Periode: {period} derniers jours
Total opportunites detectees: {total_count}
Clics additionnels potentiels (cumul): +{sum_potential_clicks}

| Keyword | URL | Position | Impressions | CTR actuel | CTR benchmark | Clics potentiels |
|---|---|---|---|---|---|---|
| {keyword} | {page} | {pos} | {impressions} | {ctr}% | {benchmark}% | +{potential} |
| ... | | | | | | |

-> Focus sur optimisation titles/meta-descriptions de ces pages.
-> Mettre en avant un CTA explicite ou une proposition de valeur plus forte.
```

### Step 5: Save if --save
Write JSON to `output/raw/quick-wins-YYYY-MM-DD.json`:
```json
{
  "generated_at": "...",
  "site_url": "...",
  "period_days": 30,
  "total_detected": 8,
  "total_potential_clicks": 775,
  "top": [
    { "keyword": "...", "page": "/...", "position": 5, "impressions": 3200, "ctr_pct": 1.2, "benchmark_pct": 5, "potential_clicks": 121 }
  ]
}
```

## Critical rules
- NEVER invent. If no quick wins match criteria, output "Aucun quick win detecte sur la periode. Continue de creer du contenu et reessaie dans 30 jours."
- FR output, simple dashes.
- If `show_upgrade_hints` is true, append: "SEO Engine propose la re-optimisation automatisee des titles/meta via rédaction Claude."

## Error handling
- Missing config: "Config manquante. Run /geo-check d'abord."
- GSC unavailable: "GSC indisponible. Run /geo-check pour diagnostiquer."
