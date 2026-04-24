---
description: Generate a French client-ready markdown weekly report
argument-hint: [--week=ISO_WEEK] [--include-recos] [--no-upsell]
---

# Weekly Report - Client Markdown

You generate a weekly markdown report ready to paste in an email to a French SEO client.

## Arguments
- `--week`: ISO week identifier `YYYY-Www` (default: current ISO week)
- `--include-recos`: include bloc 6 recommendations from /dashboard logic (default true)
- `--no-upsell`: hide the "Powered by" footer mentioning SEO Engine (default false)

## Task

### Step 1: Load config
Read `config/site.json`. Extract `site_url`, `site_name`, `show_upgrade_hints`.

### Step 2: Determine the week window

- Current week: from Monday 00:00 to Sunday 23:59 (Europe/Paris timezone)
- Prior week: the 7 days before that
- Format week label in French: "Semaine 17 (2026-04-20 au 2026-04-26)"

### Step 3: Query data

Call MCPs in parallel:
- GSC `get_analytics` for `site_url`, current week, dimensions=[query, page]
- GSC `compare_periods` for `site_url`, current week vs prior week
- GA4 site behavior for current week: sessions, users, conversions, source, medium, referrer_host

### Step 4: Compute

Same logic as /dashboard but for 7-day window:
- KPIs: clics, impressions, CTR, position (with week-over-week delta)
- Top 5 pages in progression (biggest `click_delta_abs` positive)
- Top 5 pages in decline (biggest `click_delta_abs` negative)
- LLM share of sessions (from llm-traffic-detection skill)

If `--include-recos`: call recos-generator skill with the 7-day aggregated data to get 3 priority actions for the next week.

### Step 5: Render markdown

Output structure:

```markdown
# Rapport hebdomadaire SEO/GEO - {site_name}

**{week_label}**
Site analyse: {site_url}
Genere le: {generated_at}

## Points cles de la semaine

- Clics: {clicks} ({delta_vs_prior} vs semaine precedente)
- Impressions: {impressions} ({delta})
- CTR moyen: {ctr}% ({delta_pt})
- Position moyenne: {position} ({delta})
- Part du trafic LLM: {llm_share_pct}% ({llm_clicks} clics detectes sur {total_sessions})

## Top 5 mouvements

### Pages en progression
1. {url1} - +{delta1} clics (+{pct1}%)
2. ...

### Pages en perte
1. {url1} - {delta1} clics ({pct1}%)
2. ...

## 3 recommandations pour la semaine prochaine
{if --include-recos}

1. **{reco1.title}** ({reco1.effort}, impact attendu: {reco1.impact})
   {reco1.description}

2. **{reco2.title}** ({reco2.effort}, impact attendu: {reco2.impact})
   {reco2.description}

3. **{reco3.title}** ({reco3.effort}, impact attendu: {reco3.impact})
   {reco3.description}

{/if}

## Disclaimers

- Le trafic LLM est estime (detection par referrer GA4). Le trafic reel est 15 a 30% superieur.
- Les recommandations sont generees par IA, validation humaine recommandee.

---
{if show_upgrade_hints AND NOT --no-upsell}
*Rapport genere par GEO Dashboard (gratuit). Pour un rapport mensuel complet avec plan d'action chiffre, audit CWV et redaction automatisee, decouvrez [SEO Engine](https://www.node6.ai/fr/os-metier-ia/seo-engine/).*
{/if}
```

### Step 6: Save file

Write the markdown to `output/reports/{ISO_WEEK}.md` (e.g. `output/reports/2026-W17.md`).

### Step 7: Report to CLI (French)

```
Rapport hebdomadaire genere: output/reports/2026-W17.md
Periode: {week_label}
Lignes: {md_line_count}
Vous pouvez copier-coller le contenu dans un email client.
```

## Critical rules
- Never invent numbers. If GSC or GA4 return 0 data, note "pas de donnees disponibles" with explanation.
- FR output throughout.
- Simple dashes, no em dashes.
- Keep the tone professional, first-person consultant talking to a client.
- Respect the 3 disclaimers from the plugin conventions.
- Default include upsell mention in footer (can be disabled via --no-upsell).

## Error handling
- Missing config: "Config manquante. Run /geo-check d'abord."
- GSC unavailable: "GSC indisponible, impossible de generer le rapport. Run /geo-check."
- GA4 unavailable: genere le rapport avec section LLM marquee "donnees GA4 indisponibles cette semaine".
