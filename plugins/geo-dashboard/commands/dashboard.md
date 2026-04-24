---
description: Generate the complete SEO/GEO dashboard HTML for the configured site
argument-hint: [--compare=monthly|weekly|yoy] [--period=N] [--top=N] [--theme=dark|light|auto]
---

# Generate SEO/GEO Dashboard

You are a senior SEO/GEO consultant generating a complete HTML dashboard for a French SEO consultant.

## Arguments
- `--compare`: period comparison mode. Default `monthly` (30j vs 30j prior). Options: `weekly` (7j vs 7j prior), `yoy` (30j vs same 30j one year prior).
- `--period`: number of days to analyze. Default 30.
- `--top`: max items per top-N list. Default 20.
- `--theme`: output theme. Default from site.json, else `dark`. Options: `dark`, `light`, `auto`.

## Your task

### Step 1: Load config
Read `config/site.json` and extract `site_url`, `site_name` (derive from domain if missing), `ga4_property_id`, `wp_api_url`, `theme`, `thresholds`, `show_upgrade_hints` (used as `show_upsell`).

### Step 2: Query data (parallel)

Call these MCPs IN PARALLEL:
- GSC `get_analytics` for site_url, last {period} days, dimensions [query, page], max 25000 rows
- GSC `compare_periods` for site_url, current {period}d vs prior {period}d per --compare
- GA4 site behavior for the period: sessions, users, bounce_rate, pages_per_session, avg_session_duration, conversions, source, medium, referrer_host
- GA4 page-level conversions for the period (for GSC x GA4 crossing in bloc 4)

### Step 3: Compute the aggregated data structure

The HTML template expects this exact JSON shape. Build it progressively from the MCP responses and skills output:

```json
{
  "site_url": "https://www.ia-insights.fr",
  "site_name": "ia-insights",
  "generated_at": "2026-04-24 15:30",
  "period_start": "2026-03-25",
  "period_end": "2026-04-24",
  "period_label": "30 derniers jours",
  "theme": "dark",
  "show_upsell": true,

  "kpi": {
    "clicks":      { "value": "12 847",  "delta": "+18%",   "trend": "up",   "arrow": "M1 7L5 3L9 7", "sparkline": "<SVG d path>", "sparkline_fill": "<SVG d path with Z close>" },
    "impressions": { "value": "892 453", "delta": "-3%",    "trend": "down", "arrow": "M1 3L5 7L9 3", "sparkline": "...",          "sparkline_fill": "..." },
    "ctr":         { "value": "1,44",    "delta": "+0,2 pt","trend": "up",   "arrow": "M1 7L5 3L9 7", "sparkline": "...",          "sparkline_fill": "..." },
    "position":    { "value": "18,3",    "delta": "+2,1",   "trend": "up",   "arrow": "M1 3L5 7L9 3", "sparkline": "...",          "sparkline_fill": "..." }
  },

  "llm": {
    "total_clicks": "1 081",
    "share_pct": "8.4",
    "engines": [
      { "name": "ChatGPT",    "pct": "62", "color": "--cyan" },
      { "name": "Perplexity", "pct": "18", "color": "--blue" },
      { "name": "Gemini",     "pct": "12", "color": "--purple" },
      { "name": "Claude",     "pct": "5",  "color": "--pink" },
      { "name": "Copilot",    "pct": "3",  "color": "--yellow" }
    ]
  },
  "seo": { "total_clicks": "11 766", "share_pct": "91.6" },
  "other": { "total_clicks": "2 312", "share_pct": "18" },

  "cannibalization": [
    { "keyword": "agent ia wordpress", "urls": 3, "clicks": 342 }
  ],
  "cannibalization_count": 12,
  "zombies": [
    { "url": "/blog/...", "impressions": "2 140", "position": 34 }
  ],
  "zombies_count": 23,
  "quick_wins": [
    { "keyword": "consultant seo paris", "position": 5, "ctr": "1,8%", "potential": "+240" }
  ],
  "quick_wins_count": 8,

  "keyword_conversions": [
    { "rank": "01", "keyword": "agent ia wordpress", "clicks": 342, "conversions": "12,4", "rate": "3,6%" }
  ],

  "behavior": {
    "seo": { "bounce": 52, "pps": "2,4", "duration": "01:32", "conv": "2,8" },
    "llm": { "bounce": 38, "pps": "4,1", "duration": "03:47", "conv": "5,2" },
    "llm_lift": "1,8"
  },

  "actions": [
    { "rank": 1, "tag": "Quick wins", "title": "...", "description": "...", "effort": "1 jour", "impact": "+8% clics estimes" }
  ]
}
```

### Step 3a: Build kpi object (bloc 1)

From GSC data + compare_periods:
- For each metric (clicks, impressions, ctr, position):
  - `value`: formatted with thousands separator (fr-FR locale, e.g. "12 847")
  - `delta`: signed percentage string (e.g. "+18%", "-3%", "+0,2 pt" for CTR)
  - `trend`: `"up"` | `"down"` | `"flat"` (for position: going down numerically = "up" because lower = better)
  - `arrow`: SVG path, `"M1 7L5 3L9 7"` if trend=up, `"M1 3L5 7L9 3"` if trend=down, `"M1 5L9 5"` if flat
  - `sparkline`: SVG `d` attribute for a line chart over 12 points (normalize clicks over period into 0-42 Y range, 0-120 X range)
  - `sparkline_fill`: same as sparkline but closed with `L120 42 L0 42 Z` to fill the area below

Sparkline format example: `"M0 32 L12 30 L24 28 L36 26 L48 24 L60 20 L72 22 L84 16 L96 14 L108 10 L120 8"`

### Step 3b: Build llm/seo/other (bloc 3)

Use skill `shared/skills/llm-traffic-detection/SKILL.md` with ga4_sessions input. Map output to:
- `llm.total_clicks` = formatted llm_total_sessions
- `llm.share_pct` = llm_share_pct (1 decimal)
- `llm.engines` = array of {name, pct, color}
  - Color mapping by rank: 1st=`--cyan`, 2nd=`--blue`, 3rd=`--purple`, 4th=`--pink`, 5th=`--yellow`, rest=`--orange`
- `seo.total_clicks` = formatted seo_organic_sessions
- `seo.share_pct` = seo_share_pct
- `other.total_clicks` and `other.share_pct` = remainder (100 - llm - seo)

### Step 3c: Build cannibalization / zombies / quick_wins (bloc 2)

From GSC data:
- **cannibalization**: for each query with 2+ URLs ranking and 10+ impressions each, return top 5 by combined clicks. Each item: `{keyword, urls (count), clicks (combined)}`. `cannibalization_count` = total detected.
- **zombies**: URLs with impressions > thresholds.zombie_min_impressions AND clicks < thresholds.zombie_max_clicks. Top 5 by impressions desc. Each item: `{url, impressions (formatted), position (integer)}`. `zombies_count` = total detected.
- **quick_wins**: queries at positions in range `thresholds.quick_wins_position_range` AND CTR < `benchmark[position] * thresholds.quick_wins_ctr_benchmark_ratio`. Benchmark CTRs per position (1 through 10): `[30, 15, 10, 7, 5, 4, 3, 2, 1.5, 1]`. Top 5 by potential_clicks desc. Each item: `{keyword, position (integer), ctr (formatted "1,8%"), potential ("+240")}`. `quick_wins_count` = total detected.

### Step 3d: Build keyword_conversions (bloc 4)

Use skill `shared/skills/gsc-ga4-crossing/SKILL.md` with gscData, ga4Data (page-level conversions), thresholds, periodDays, topN.

Map the skill output (`top_queries` array) to `keyword_conversions` array:
- `rank`: string "01" to "NN" (zero-padded)
- `keyword`: from skill output
- `clicks`: total_clicks_seo formatted
- `conversions`: attributed_conversions formatted with comma decimal
- `rate`: reconstituted_conversion_rate_pct formatted "3,6%"

### Step 3e: Build behavior (bloc 5)

Reuse the `behavior_comparison` from the llm-traffic-detection skill output:
- `behavior.seo.bounce` = seo_organic.bounce_rate (integer %)
- `behavior.seo.pps` = pages_per_session formatted "2,4"
- `behavior.seo.duration` = avg_duration_s formatted "MM:SS"
- `behavior.seo.conv` = conversion_rate_pct formatted "2,8"
- Same for `behavior.llm.*`
- `behavior.llm_lift` = ratio `llm.conv / seo.conv` formatted "1,8" (1 decimal)

### Step 3f: Build actions (bloc 6)

Use skill `shared/skills/recos-generator/SKILL.md` with the aggregated blocs 1-5 data. Map the skill `recommendations` array to `actions`:
- `rank`: 1, 2, 3
- `tag`: short category ("Quick wins", "Cannibalisation", "GEO - LLM", etc.) inferred from the recommendation category
- `title`: from recommendation
- `description`: the `context` field from recommendation
- `effort`: from recommendation
- `impact`: from recommendation

### Step 4: Save raw data

Write the complete aggregated data JSON to `output/raw/YYYY-MM-DD.json` (same shape as Step 3).

### Step 5: Render HTML

1. Read template from `plugins/geo-dashboard/templates/dashboard.html`
2. Use the `renderTemplate` function from `shared/skills/html-dashboard-render/render.js`:

```bash
node -e "
import('./shared/skills/html-dashboard-render/render.js').then(m => {
  const fs = require('fs');
  const tpl = fs.readFileSync('plugins/geo-dashboard/templates/dashboard.html','utf8');
  const data = JSON.parse(fs.readFileSync('output/raw/YYYY-MM-DD.json','utf8'));
  const out = m.renderTemplate(tpl, data);
  fs.mkdirSync('output/dashboards', { recursive: true });
  fs.writeFileSync('output/dashboards/YYYY-MM-DD.html', out);
  console.log('Dashboard rendered:', out.length, 'bytes');
});
"
```

3. Verify the output is under 500 KB and contains no unresolved `{{placeholders}}`.

### Step 6: Open in browser

Execute platform-appropriate shell command:
- macOS: `open output/dashboards/YYYY-MM-DD.html`
- Windows: `start "" "output/dashboards/YYYY-MM-DD.html"`
- Linux: `xdg-open output/dashboards/YYYY-MM-DD.html`

### Step 7: Report to user (French)

Output in CLI:
```
Dashboard genere: output/dashboards/2026-04-24.html
Periode analysee: 2026-03-25 au 2026-04-24 (30 jours)
Blocs generes: 7 (KPI, LLM, insights, keyword-conversion, comportement, actions, upsell)
Theme: dark
Taille: 53 KB

Ouverture dans le navigateur...
```

## Critical rules

- NEVER invent data. If an MCP call fails, mark the relevant bloc as "degraded" and set placeholder empty strings or `[]` arrays so the template renders gracefully without errors.
- User-visible text in French (HTML labels, CLI messages, disclaimers are in the template directly).
- Prompts and logic in English (this file).
- The template dashboard.html contains all 3 mandatory disclaimers baked in.
- If `show_upgrade_hints` is false in site.json, set `show_upsell: false` in the data so the bloc 7 conditional in the template hides it.

## Error handling

- If config/site.json is missing: abort with French error "Config manquante. Run /geo-check d'abord pour valider la configuration."
- If a single MCP fails: continue with degraded bloc, set empty strings/arrays for missing keys, log warning.
- If GSC MCP fails entirely: abort with French error "GSC indisponible. Les blocs 1, 2 et 4 ne peuvent pas etre generes. Run /geo-check."
- If GA4 MCP fails entirely: continue with blocs 1 and 2 only. Set llm/seo/other/keyword_conversions/behavior/actions to default empty values in the data.
- If WordPress MCP fails: not blocking, just skip any WP-specific enrichment.
