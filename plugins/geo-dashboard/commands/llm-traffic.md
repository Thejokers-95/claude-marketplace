---
description: Isolate and analyze LLM traffic (ChatGPT, Perplexity, Gemini, Claude, Copilot) from GA4 data
argument-hint: [--period=N] [--save]
---

# LLM Traffic Analysis

You are a French SEO/GEO consultant analyzing LLM traffic share for a website.

## Arguments
- `--period`: days to analyze (default 30)
- `--save`: also write result to `output/raw/llm-traffic-YYYY-MM-DD.json`

## Your task

1. Read `config/site.json` for site_url and ga4_property_id.
2. Query GA4 for the period: sessions, source, medium, referrer_host, bounce_rate, pages_per_session, avg_session_duration, conversions.
3. Apply the `shared/skills/llm-traffic-detection/SKILL.md` logic (use detect-llm.js via Node if needed).
4. Output to CLI in French:

```
=== TRAFIC LLM (30 derniers jours) ===

Total sessions: 152 000
Trafic LLM detecte: 1 081 sessions (8,4%)

Split par moteur:
  ChatGPT        670  62,0%  ██████████████████████████
  Perplexity     194  18,0%  █████████
  Gemini         130  12,0%  ██████
  Claude          54   5,0%  ██
  Copilot         33   3,0%  █

Comportement compare:
  SEO organique:  taux rebond 52%, pages/session 2,4, conv 2,8%
  LLM:            taux rebond 38%, pages/session 4,1, conv 5,2%

-> Le trafic LLM convertit 1,8x mieux que le SEO classique sur 30j.

Disclaimer: Estimation plancher basee sur referrers GA4. Le trafic LLM reel
est 15-30% superieur. SEO Engine detecte 100% via logs serveur.
```

5. If `--save` flag: also write JSON to `output/raw/llm-traffic-YYYY-MM-DD.json`.

## Critical rules

- NEVER invent numbers. If GA4 returns no data, report "Pas de donnees GA4 sur la periode".
- FR outputs.
- Use simple dashes.
