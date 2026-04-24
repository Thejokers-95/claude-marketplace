---
name: llm-traffic-detection
description: Isolates traffic originating from LLM search engines (ChatGPT, Perplexity, Gemini, Claude, Copilot, etc.) using GA4 referrer patterns. Use when the dashboard needs to show LLM visibility split and SEO vs LLM behavior comparison.
---

# LLM Traffic Detection Skill

## Purpose

Identify and segment GA4 sessions coming from LLM-based search engines by matching referrer patterns. Estimates plancher (under-reports by 15-30% since some LLM traffic lacks referrer).

## Input

- `ga4_sessions`: array of { session_id, source, medium, referrer_host, sessions, users, bounce_rate, pages_per_session, avg_session_duration, conversions } rows

## Engine detection patterns

```javascript
const ENGINE_PATTERNS = {
  'ChatGPT': [/chatgpt\.com/, /chat\.openai\.com/],
  'Perplexity': [/perplexity\.ai/],
  'Gemini': [/gemini\.google\.com/, /bard\.google\.com/],
  'Claude': [/claude\.ai/],
  'Copilot': [/copilot\.microsoft\.com/, /bing\.com\/chat/],
  'You': [/you\.com/],
  'Phind': [/phind\.com/],
  'Meta AI': [/meta\.ai/],
  'Other LLM': [/\.ai\//, /ai-search/, /ai-chat/],
};
```

Order matters: check specific patterns before "Other LLM" catchall.

## Algorithm

1. Classify each session:
   - If referrer_host matches any ENGINE_PATTERNS, tag as `llm:<engine_name>`
   - If source/medium indicates organic search (google / organic, bing / organic), tag as `seo:organic`
   - Else tag as `other` (social, direct, paid, referral)

2. Aggregate metrics per tag:
   - Total sessions, users, conversions
   - Avg bounce rate, avg pages/session, avg session duration (weighted by sessions)

3. Compute share percentages:
   - LLM total / overall total
   - SEO organic total / overall total
   - Per-engine share within LLM

## Output

```json
{
  "period_days": 30,
  "total_sessions": 152000,
  "llm_total_sessions": 1081,
  "llm_share_pct": 8.4,
  "seo_organic_sessions": 12847,
  "seo_share_pct": 99.4,
  "engines": [
    {"name": "ChatGPT", "sessions": 670, "share_pct": 62.0},
    {"name": "Perplexity", "sessions": 194, "share_pct": 18.0},
    {"name": "Gemini", "sessions": 130, "share_pct": 12.0},
    {"name": "Claude", "sessions": 54, "share_pct": 5.0},
    {"name": "Copilot", "sessions": 33, "share_pct": 3.0}
  ],
  "behavior_comparison": {
    "seo_organic": {"bounce_rate": 52, "pages_per_session": 2.4, "avg_duration_s": 92, "conversion_rate_pct": 2.8},
    "llm": {"bounce_rate": 38, "pages_per_session": 4.1, "avg_duration_s": 227, "conversion_rate_pct": 5.2}
  },
  "disclaimer": "Estimation plancher basee sur referrers GA4. Le trafic LLM reel est 15-30% superieur. SEO Engine detecte 100% via logs serveur."
}
```

## Implementation

Logic in `shared/skills/llm-traffic-detection/detect-llm.js`, see unit tests.

## Limitations

- Referrer-based detection only (not logs), under-estimates by 15-30%
- Does not detect LLM crawlers (GPTBot, PerplexityBot, etc.) that bypass referrer
- ENGINE_PATTERNS list needs periodic update as new engines appear
