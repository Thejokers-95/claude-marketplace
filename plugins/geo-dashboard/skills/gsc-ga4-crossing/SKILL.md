---
name: gsc-ga4-crossing
description: Probabilistic reconstruction of keyword-to-conversion mapping by proportionally attributing GA4 conversions via GSC click distribution per URL. Use when the dashboard needs to show which keywords drive conversions.
---

# GSC x GA4 Crossing Skill

## Purpose

GSC provides keyword-to-URL click data. GA4 provides URL-to-conversion data. This skill bridges the gap by proportionally attributing conversions to keywords.

## Input

- `gsc_data`: array of { query, page, clicks, impressions, position } rows for the period
- `ga4_data`: array of { page_path, sessions, conversions, engagement_rate } rows for the period
- `thresholds`: { min_clicks_for_conversion_crossing: 10, min_days_for_crossing: 30 }

## Algorithm

1. For each URL in GSC data:
   - Group GSC rows by page (URL)
   - Sum total clicks per URL
   - If total clicks < min_clicks_for_conversion_crossing, exclude URL (too little data)
   - For each query on that URL, compute weight = query_clicks / total_url_clicks

2. Match GA4 data to URLs:
   - For each URL, find matching GA4 row by page_path (normalize: strip protocol, domain, trailing slash)
   - Get conversions_for_url from GA4

3. Attribute conversions to keywords:
   - For each (URL, query) pair:
     - attributed_conversions[query] += conversions_for_url * weight

4. Aggregate across URLs:
   - For each query, sum attributed_conversions across all URLs where it appeared
   - Compute reconstituted_conversion_rate = total_attributed_conversions / total_query_clicks

5. Sort by total attributed conversions desc, return top N (default 20)

## Output

```json
{
  "period_days": 30,
  "queries_crossed": 20,
  "urls_excluded_low_clicks": 5,
  "top_queries": [
    {
      "query": "agent ia wordpress",
      "total_clicks_seo": 342,
      "attributed_conversions": 12.4,
      "reconstituted_conversion_rate_pct": 3.6,
      "top_urls": [
        {"url": "/blog/agent-ia-wordpress", "clicks": 200, "weight_pct": 58.5, "attributed": 7.3}
      ]
    }
  ],
  "disclaimer": "Reconstitution probabiliste (pondération proportionnelle GSC x GA4). Fiable pour prioriser, pas chiffre absolu."
}
```

## Limitations

- Assumes uniform conversion rate across keywords on the same URL (simplification)
- Does not account for multi-touch attribution (last-click model)
- URLs with < 10 SEO clicks excluded to avoid noise
- Period must be >= 30 days for statistical stability

## Implementation

The actual computation logic is in `shared/skills/gsc-ga4-crossing/cross-data.js`. See that file for unit-tested code.

## When NOT to use

- Single-page sites (no URL distribution)
- Very low-traffic sites (< 100 total clicks across all URLs)
- Multi-touch attribution analysis (use SEO Engine instead)
