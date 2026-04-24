---
name: html-dashboard-render
description: Injects aggregated dashboard data into the HTML template with placeholder substitution (Mustache-like syntax) and produces the final dashboard file. Use after all blocs 1-6 are computed.
---

# HTML Dashboard Render Skill

## Purpose

Take raw JSON data + HTML template with Mustache-like placeholders, produce a final standalone HTML file under 500 KB.

## Input

- `template_path`: absolute path to `plugins/geo-dashboard/templates/dashboard.html`
- `data`: full dashboard data JSON (meta, bloc1-6, bloc7 features list, theme, show_upgrade_hints)
- `output_path`: where to write the final HTML

## Placeholder syntax

- `{{key}}` - simple variable substitution (escaped HTML)
- `{{{key}}}` - raw HTML injection (for SVG inline, use with caution)
- `{{#if key}}...{{/if}}` - conditional block
- `{{#each array}}...{{/each}}` with `{{this}}`, `{{@index}}` inside

## Algorithm

1. Read template file
2. Apply in order:
   - `{{#each ...}}` loops (iterate array items, recursively substitute inner variables)
   - `{{#if ...}}` conditionals (keep or strip block based on truthiness)
   - `{{{raw}}}` injections
   - `{{key}}` substitutions (HTML escape)
3. Validate output size < 500 KB
4. Write to output_path

## Implementation

Logic in `shared/skills/html-dashboard-render/render.js`, fully unit-tested.

## When NOT to use

- Dynamic interactive dashboards (no JS framework here)
- Multi-page reports (single file only)
- Server-side rendered layouts (we produce static file only)
