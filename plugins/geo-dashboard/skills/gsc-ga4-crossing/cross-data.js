/**
 * GSC x GA4 Crossing - proportional conversion attribution to keywords.
 * See SKILL.md for algorithm details.
 */

export function normalizeUrl(url) {
  // Remove fragment
  let clean = url.split('#')[0];
  // Remove query string
  clean = clean.split('?')[0];
  // Remove protocol + domain
  clean = clean.replace(/^https?:\/\/[^/]+/, '');
  // Ensure leading slash
  if (!clean.startsWith('/')) clean = '/' + clean;
  // Remove trailing slash unless root
  if (clean.length > 1 && clean.endsWith('/')) clean = clean.slice(0, -1);
  return clean;
}

export function aggregateClicksByUrl(rows) {
  const result = {};
  for (const row of rows) {
    const url = normalizeUrl(row.page);
    result[url] = (result[url] || 0) + row.clicks;
  }
  return result;
}

export function computeQueryWeights(rows) {
  const totals = aggregateClicksByUrl(rows);
  const weights = {};
  for (const row of rows) {
    const url = normalizeUrl(row.page);
    if (!weights[url]) weights[url] = {};
    weights[url][row.query] = row.clicks / totals[url];
  }
  return weights;
}

export function attributeConversions(gscRows, ga4Rows) {
  const weights = computeQueryWeights(gscRows);
  // Build conversion lookup by normalized URL
  const conversionsByUrl = {};
  for (const row of ga4Rows) {
    conversionsByUrl[normalizeUrl(row.page_path)] = row.conversions;
  }
  const result = {};
  for (const url of Object.keys(weights)) {
    const conv = conversionsByUrl[url];
    if (conv === undefined) continue;
    for (const query of Object.keys(weights[url])) {
      const attributed = conv * weights[url][query];
      result[query] = (result[query] || 0) + attributed;
    }
  }
  return result;
}

export function applyMinClicksThreshold(gscRows, minClicks) {
  const totals = aggregateClicksByUrl(gscRows);
  const keepUrls = new Set();
  const excludedUrls = [];
  for (const [url, clicks] of Object.entries(totals)) {
    if (clicks >= minClicks) keepUrls.add(url);
    else excludedUrls.push(url);
  }
  const filtered = gscRows.filter(r => keepUrls.has(normalizeUrl(r.page)));
  return { filtered, excluded_urls: excludedUrls };
}

export function crossData({ gscData, ga4Data, thresholds, periodDays, topN = 20 }) {
  const minClicks = thresholds.min_clicks_for_conversion_crossing || 10;
  const { filtered, excluded_urls } = applyMinClicksThreshold(gscData, minClicks);

  const attributed = attributeConversions(filtered, ga4Data);

  // Aggregate total clicks per query (across all filtered URLs)
  const clicksPerQuery = {};
  for (const row of filtered) {
    clicksPerQuery[row.query] = (clicksPerQuery[row.query] || 0) + row.clicks;
  }

  // Build top queries array with all metrics
  const queries = Object.keys(attributed).map(query => {
    const totalClicks = clicksPerQuery[query] || 0;
    const conv = attributed[query];
    return {
      query,
      total_clicks_seo: totalClicks,
      attributed_conversions: Math.round(conv * 10) / 10,
      reconstituted_conversion_rate_pct: totalClicks > 0
        ? Math.round((conv / totalClicks) * 1000) / 10
        : 0,
    };
  });

  // Sort desc by attributed conversions
  queries.sort((a, b) => b.attributed_conversions - a.attributed_conversions);

  return {
    period_days: periodDays,
    queries_crossed: queries.length,
    urls_excluded_low_clicks: excluded_urls.length,
    top_queries: queries.slice(0, topN),
    disclaimer: "Reconstitution probabiliste (ponderation proportionnelle GSC x GA4). Fiable pour prioriser, pas chiffre absolu.",
  };
}
