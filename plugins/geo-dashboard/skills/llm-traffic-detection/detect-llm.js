/**
 * LLM Traffic Detection - classifies GA4 sessions by engine type.
 * See SKILL.md for algorithm and engine list.
 */

export const ENGINE_PATTERNS = {
  'ChatGPT': [/chatgpt\.com/, /chat\.openai\.com/],
  'Perplexity': [/perplexity\.ai/],
  'Gemini': [/gemini\.google\.com/, /bard\.google\.com/],
  'Claude': [/claude\.ai/],
  'Copilot': [/copilot\.microsoft\.com/, /bing\.com\/chat/],
  'You': [/you\.com/],
  'Phind': [/phind\.com/],
  'Meta AI': [/meta\.ai/],
  'Other LLM': [/\.ai\b/, /ai-search/, /ai-chat/],
};

export function classifySession(session) {
  const referrer = (session.referrer_host || '').toLowerCase();

  // Check specific LLM patterns first (Other LLM last)
  const engineOrder = Object.keys(ENGINE_PATTERNS);
  for (const engine of engineOrder) {
    for (const pattern of ENGINE_PATTERNS[engine]) {
      if (pattern.test(referrer)) return `llm:${engine}`;
    }
  }

  // SEO organic
  const source = (session.source || '').toLowerCase();
  const medium = (session.medium || '').toLowerCase();
  if (medium === 'organic' && ['google', 'bing', 'yahoo', 'duckduckgo', 'ecosia'].includes(source)) {
    return 'seo:organic';
  }

  return 'other';
}

export function aggregateByTag(sessions) {
  const buckets = {};
  for (const s of sessions) {
    const tag = classifySession(s);
    if (!buckets[tag]) {
      buckets[tag] = {
        sessions: 0,
        conversions: 0,
        _bounce_weighted: 0,
        _pages_weighted: 0,
        _duration_weighted: 0,
      };
    }
    const b = buckets[tag];
    b.sessions += s.sessions || 0;
    b.conversions += s.conversions || 0;
    b._bounce_weighted += (s.bounce_rate || 0) * (s.sessions || 0);
    b._pages_weighted += (s.pages_per_session || 0) * (s.sessions || 0);
    b._duration_weighted += (s.avg_session_duration || 0) * (s.sessions || 0);
  }
  // Compute weighted averages
  for (const tag of Object.keys(buckets)) {
    const b = buckets[tag];
    if (b.sessions > 0) {
      b.bounce_rate = Math.round((b._bounce_weighted / b.sessions) * 10) / 10;
      b.pages_per_session = Math.round((b._pages_weighted / b.sessions) * 10) / 10;
      b.avg_duration_s = Math.round(b._duration_weighted / b.sessions);
      b.conversion_rate_pct = Math.round((b.conversions / b.sessions) * 1000) / 10;
    }
    delete b._bounce_weighted;
    delete b._pages_weighted;
    delete b._duration_weighted;
  }
  return buckets;
}

export function computeShares(aggregated) {
  let total = 0;
  let llmTotal = 0;
  let seoTotal = 0;
  for (const [tag, data] of Object.entries(aggregated)) {
    total += data.sessions || 0;
    if (tag.startsWith('llm:')) llmTotal += data.sessions || 0;
    else if (tag.startsWith('seo:')) seoTotal += data.sessions || 0;
  }
  return {
    total_sessions: total,
    llm_total: llmTotal,
    seo_total: seoTotal,
    llm_share_pct: total > 0 ? Math.round((llmTotal / total) * 1000) / 10 : 0,
    seo_share_pct: total > 0 ? Math.round((seoTotal / total) * 1000) / 10 : 0,
  };
}

export function detectLlmTraffic({ ga4Sessions, periodDays }) {
  const aggregated = aggregateByTag(ga4Sessions);
  const shares = computeShares(aggregated);

  // Extract per-engine stats
  const engines = Object.keys(aggregated)
    .filter(tag => tag.startsWith('llm:'))
    .map(tag => {
      const engineName = tag.substring(4);
      const data = aggregated[tag];
      return {
        name: engineName,
        sessions: data.sessions,
        share_pct: shares.llm_total > 0
          ? Math.round((data.sessions / shares.llm_total) * 1000) / 10
          : 0,
      };
    })
    .sort((a, b) => b.sessions - a.sessions);

  // Combined LLM behavior (weighted)
  let llmCombined = { sessions: 0, _bw: 0, _pw: 0, _dw: 0, conversions: 0 };
  for (const tag of Object.keys(aggregated)) {
    if (!tag.startsWith('llm:')) continue;
    const d = aggregated[tag];
    llmCombined.sessions += d.sessions;
    llmCombined._bw += (d.bounce_rate || 0) * d.sessions;
    llmCombined._pw += (d.pages_per_session || 0) * d.sessions;
    llmCombined._dw += (d.avg_duration_s || 0) * d.sessions;
    llmCombined.conversions += d.conversions || 0;
  }
  const llm = llmCombined.sessions > 0 ? {
    bounce_rate: Math.round((llmCombined._bw / llmCombined.sessions) * 10) / 10,
    pages_per_session: Math.round((llmCombined._pw / llmCombined.sessions) * 10) / 10,
    avg_duration_s: Math.round(llmCombined._dw / llmCombined.sessions),
    conversion_rate_pct: Math.round((llmCombined.conversions / llmCombined.sessions) * 1000) / 10,
  } : { bounce_rate: 0, pages_per_session: 0, avg_duration_s: 0, conversion_rate_pct: 0 };

  const seo = aggregated['seo:organic'] || { bounce_rate: 0, pages_per_session: 0, avg_duration_s: 0, conversion_rate_pct: 0 };

  return {
    period_days: periodDays,
    total_sessions: shares.total_sessions,
    llm_total_sessions: shares.llm_total,
    llm_share_pct: shares.llm_share_pct,
    seo_organic_sessions: shares.seo_total,
    seo_share_pct: shares.seo_share_pct,
    engines,
    behavior_comparison: {
      seo_organic: { bounce_rate: seo.bounce_rate, pages_per_session: seo.pages_per_session, avg_duration_s: seo.avg_duration_s, conversion_rate_pct: seo.conversion_rate_pct },
      llm,
    },
    disclaimer: "Estimation plancher basee sur referrers GA4. Le trafic LLM reel est 15-30% superieur. SEO Engine detecte 100% via logs serveur.",
  };
}
