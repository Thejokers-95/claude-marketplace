---
description: Diagnostic check for MCPs, config, and permissions required by the plugin
---

# Geo Check - Plugin Diagnostic

You are diagnosing the geo-dashboard plugin setup. Output EVERYTHING in French (user is a French-speaking SEO consultant).

## Your task

Run the following checks in order and report status for each. Use visual status markers: OK, AVERTISSEMENT, ERREUR.

### Check 1: Config file

- Read `config/site.json` from the current working directory
- If missing: ERREUR report "Fichier config/site.json introuvable. Copiez config.example/site.json.example vers config/site.json et remplissez-le."
- If present: check required fields (site_url, ga4_property_id, wp_api_url)
- Report each missing field as AVERTISSEMENT

### Check 2: GSC MCP

- Attempt to call the GSC MCP `list_sites` tool
- If success and the site_url from config appears in the list: OK "GSC connecte, site trouve"
- If success but site not in list: AVERTISSEMENT "GSC connecte mais site absent. Verifiez les permissions du compte Google."
- If fails: ERREUR "GSC MCP indisponible. Verifiez l'installation: uvx mcp-search-console et l'authentification OAuth."

### Check 3: GA4 MCP

- Attempt to call the GA4 MCP to list accessible properties
- If success and ga4_property_id from config is accessible: OK "GA4 connecte, propriete accessible"
- If success but property not accessible: AVERTISSEMENT "GA4 connecte mais propriete inaccessible. Verifiez que gcloud auth a le bon compte."
- If fails: ERREUR "GA4 MCP indisponible. Verifiez: pipx run analytics-mcp et gcloud auth application-default login"

### Check 4: WordPress MCP

- Attempt a GET on wp_api_url (via WordPress MCP)
- If success: OK "WordPress REST API accessible"
- If fails: ERREUR "WordPress MCP indisponible. Verifiez que le plugin MCP Adapter est installe OU utilisez l'alternative gaupoit/wordpress-mcp avec Application Password."

### Check 5: Data availability

- Call GSC get_analytics for last 30 days on site_url, limit 1
- If returns data: OK "Donnees GSC disponibles sur les 30 derniers jours"
- If no data: AVERTISSEMENT "Pas de donnees GSC sur 30 jours. Le site est peut-etre trop recent."

## Output format (French)

After running all checks, produce this final output:

```
=== DIAGNOSTIC GEO DASHBOARD ===

[Liste des checks avec statuts]

---

SYNTHESE:
- X checks OK
- Y avertissements
- Z erreurs

[Si tout OK]:
-> Pret a generer le dashboard. Tapez /dashboard

[Si erreurs]:
-> Corrigez les erreurs ci-dessus avant de continuer. Voir README pour details.

---

FONCTIONNALITES NON INCLUSES DANS LE PLUGIN GRATUIT:
- Audit CWV terrain (Chrome DevTools)
- Scoring GEO 7 criteres par URL
- Redaction SEO+GEO automatique
- Publication WordPress via MCP
- Logs serveur pour trafic LLM exact
- Mode multi-clients et batch
- Export PDF client-ready

-> Toutes disponibles dans SEO Engine: node6.ai/fr/os-metier-ia/seo-engine/
```

## Critical rules

- NEVER invent data. If an MCP is unavailable, report it as ERREUR.
- NEVER skip a check even if a previous one fails.
- ALL user-facing text in French.
- Use simple dashes (-), never em dashes.
- Output is pure text, no HTML.
