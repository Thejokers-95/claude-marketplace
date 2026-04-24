# Node6 Claude Code Marketplace

> **Modular AI Business Operating Systems** for agencies, consultants, and teams.
> Install plugins, plug data sources, ship client-ready deliverables in minutes.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Claude Code Plugins](https://img.shields.io/badge/Claude%20Code-Plugins-orange.svg)](https://code.claude.com)
[![Node6](https://img.shields.io/badge/by-Node6.ai-blue.svg)](https://www.node6.ai)

---

## Quickstart

```
claude
/plugin marketplace add Thejokers-95/claude-marketplace
/plugin install geo-dashboard@node6-marketplace
/dashboard
```

Three commands, one command-ready SEO/GEO dashboard. No SaaS, no data leaves your machine.

---

## Why this marketplace

Claude Code is the most powerful terminal-native AI agent ever built. But until now, getting it to do serious business work meant writing your own skills, commands, agents, and prompts from scratch - every time.

This marketplace packages **production-grade AI business stacks** as plug-and-play Claude Code plugins. Each plugin is a vertical domain solved end-to-end: data ingestion, analysis, generation, reporting. Drop it in, connect your MCPs, run a slash command, get the deliverable.

- **Modular** : install only what you need, add more over time
- **Extensible** : every plugin is MIT-licensed, fork and adapt
- **Private by default** : all data stays on your machine, no third-party SaaS
- **Multi-tenant ready** : agencies can roll out identical plugin sets across consultants

---

## Available plugins

### `geo-dashboard` v1.0.0 - FREE

**Dashboard SEO and GEO (Generative Engine Optimization) for consultants and agencies.**

Cross-references Google Search Console + Google Analytics 4 + WordPress data in a single HTML report with:

- Raw performance (clicks, impressions, CTR, position) with 30-day comparison
- LLM traffic detection (ChatGPT, Perplexity, Gemini, Claude, Copilot referrers)
- Google Insights (cannibalization, zombie pages, quick wins)
- Keyword-to-conversion reconstitution (probabilistic GSC x GA4 crossing)
- SEO vs LLM behavior comparison (bounce rate, pages/session, conversion lift)
- 3 AI-generated priority actions for the week
- Dual theme (dark/light, auto via `prefers-color-scheme`)
- Screenshot-ready for LinkedIn, client emails, or internal reviews

**Install:**

```
/plugin marketplace add Thejokers-95/claude-marketplace
/plugin install geo-dashboard@node6-marketplace
```

**Commands included:**

| Command | Purpose |
|---|---|
| `/dashboard` | Full 7-block HTML dashboard |
| `/decay` | Pages losing traffic (GSC) |
| `/quick-wins` | Pos 4-10 keywords with CTR potential |
| `/llm-traffic` | LLM referrer breakdown by engine |
| `/weekly-report` | Client-ready markdown weekly report |
| `/geo-check` | MCP and config diagnostic |

**MCPs required** (user-side, one-time setup):
- Google Search Console (`uvx mcp-search-console`)
- Google Analytics 4 (official Google `analytics-mcp`)
- WordPress REST API (official WP MCP Adapter)

See [`plugins/geo-dashboard/README.md`](./plugins/geo-dashboard/README.md) for the full setup guide.

**Documentation:** French-first (target audience: FR SEO consultants). EN version planned for v2.

---

## Coming soon

The Node6 AI Business OS roadmap extends beyond SEO. These plugins are on the pipeline:

| Plugin | Category | Status | Tier |
|---|---|---|---|
| `seo-engine` | SEO/GEO full suite | Beta private | Premium |
| `rh-engine` | HR automation | Planned | Free lead magnet |
| `pm-engine` | Product management OS | Planned | Premium |
| `content-engine` | Content production pipeline | Planned | Free/Premium |

Want a specific plugin? [Open a request on node6.ai](https://www.node6.ai/contact).

---

## How it works

Each plugin in this marketplace is a self-contained Claude Code plugin:

```
plugins/
  geo-dashboard/
    .claude-plugin/plugin.json        # manifest
    commands/                          # slash commands
    skills/                            # reusable skills (TDD-tested JS)
    templates/                         # HTML templates with Mustache placeholders
    README.md                          # user documentation
    LICENSE                            # MIT
```

When you run `/plugin install geo-dashboard@node6-marketplace`, Claude Code:

1. Clones the marketplace repo metadata
2. Downloads the plugin files to your local Claude Code install
3. Registers the slash commands, skills, and hooks
4. Plugin is ready to use across any project you work on

---

## Philosophy

- **Local-first**: plugins run on your machine, talk to your MCPs, process your data. Nothing is ever uploaded to a Node6 server.
- **AI-native but human-validated**: all AI-generated output (recommendations, summaries) comes with mandatory disclaimers and is designed for human review before client delivery.
- **Freemium pragmatism**: free plugins are full-featured lead magnets, not crippleware. Premium plugins add production-grade features (multi-client, batch processing, rich reporting) that agencies will actually pay for.
- **Transparent upsell**: when a free plugin hits a scope boundary, it tells you what the premium version adds - no dark patterns.

---

## For plugin authors

Want to publish your own Claude Code plugin on this marketplace? We are open to contributions aligned with the Node6 AI Business OS vision.

Contact: contact@node6.ai

---

## About Node6

Node6 builds AI Business Operating Systems for the consulting and agency economy. We believe that in 2 years, every SEO consultant, HR manager, and product lead will be using Claude Code plugins to run their day-to-day.

- Website: https://www.node6.ai
- Founder: Fred Kinzi
- brAIn ecosystem ambassador (FR AI agencies)

---

## License

All code in this repository is MIT-licensed unless noted otherwise in individual plugin `LICENSE` files. See [LICENSE](./LICENSE).

Third-party attributions for derivative work (e.g. MIT-licensed prompt inspirations) are documented in each plugin's `NOTICES` file.
