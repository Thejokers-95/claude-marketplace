# SEO/GEO Dashboard

> Plugin Claude Code gratuit pour consultants SEO francophones.
> Genere un dashboard SEO et GEO en HTML, en croisant Google Search Console, Google Analytics 4 et WordPress.
> Detection trafic LLM, reconstitution keyword vers conversion, recommandations IA.
> Etage 0 de SEO Engine ([node6.ai/seo-engine](https://www.node6.ai/fr/os-metier-ia/seo-engine/)).

---

## Ce que fait le plugin

Une commande `/dashboard`, un rapport HTML complet en 30 secondes. Le plugin compile 6 blocs de donnees dans un fichier unique, screenshot-ready, prets pour LinkedIn ou partage client.

**Les 6 blocs** :
1. Performance brute (clics, impressions, CTR, position sur 30j)
2. Insights Google avances (cannibalisation, pages zombies, quick wins)
3. Visibilite dans les moteurs IA (ChatGPT, Perplexity, Gemini, Claude, Copilot)
4. Reconstitution keyword vers conversion (croisement GSC x GA4)
5. Comportement compare SEO classique vs LLM
6. 3 actions prioritaires de la semaine (generees par Claude)

Plus un bloc bonus presentant ce que SEO Engine (produit paye) ajoute.

---

## Installation en 2 commandes

Dans une session Claude Code :

```
/plugin marketplace add node6-ai/claude-marketplace
/plugin install geo-dashboard@claude-marketplace
```

Premiere utilisation : `/geo-check` pour valider la config, puis `/dashboard`.

---

## Prerequis

Le plugin s'appuie sur des outils externes que tu installes une fois sur ton poste.

### Obligatoires

| Outil | Version | Commande de verification |
|---|---|---|
| Claude Code | derniere | `claude --version` |
| Node.js | 18+ | `node --version` |
| Python | 3.11+ | `python --version` |
| pipx | 1.0+ | `python -m pipx --version` |
| uv (pour uvx) | 0.10+ | `python -m uv --version` |
| gcloud CLI | 400+ | `gcloud --version` |

### Comptes et acces

- Compte Google Search Console avec la propriete du site a analyser
- Propriete Google Analytics 4 active, acces en lecture
- Site WordPress avec REST API active + Application Password

---

## Configuration (une fois par site)

### 1. Installer les 3 MCPs

Le plugin s'appuie sur 3 MCPs (Model Context Protocol servers) que tu configures dans ton `~/.claude.json`. Si tu ne les as pas encore :

**MCP GSC (Google Search Console)**

```bash
uvx mcp-search-console
```

Au premier run, un navigateur s'ouvre, tu auth Google, le token est cache localement.

Config `~/.claude.json` :
```json
{
  "mcpServers": {
    "gsc": {
      "command": "uvx",
      "args": ["mcp-search-console"]
    }
  }
}
```

**MCP GA4 (officiel Google)**

```bash
pipx install analytics-mcp
gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/userinfo.email
gcloud services enable analyticsdata.googleapis.com
gcloud services enable analyticsadmin.googleapis.com
```

Config `~/.claude.json` :
```json
{
  "mcpServers": {
    "ga4-analytics": {
      "command": "analytics-mcp",
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/adc-or-service-account.json",
        "GOOGLE_PROJECT_ID": "ton-gcp-project-id"
      }
    }
  }
}
```

Sur Windows, chemin complet du binaire si pas dans le PATH :
```json
{
  "command": "C:\\Users\\<toi>\\.local\\bin\\analytics-mcp.exe"
}
```

**Important - 3 methodes d'auth GA4 supportees** :

1. **ADC via gcloud** (simple) : la commande `gcloud auth application-default login` ci-dessus. Token expire toutes les heures mais refresh auto.
2. **Service account** (stable long-terme) : cle JSON dediee, pas d'expiration. Recommande pour production.
3. **OAuth client custom** (fallback si Google bloque gcloud sur ton compte) : necessaire si tu vois "Application bloquee" lors du `gcloud auth login`.

**Procedure detaillee pour chaque methode + depannage "App bloquee" / "insufficient scopes" / bug #134** : voir [docs/ga4-auth-setup.md](../../docs/ga4-auth-setup.md) dans le monorepo source.

**MCP WordPress**

Deux options selon ton setup WP :

*Option A - Plugin MCP Adapter officiel WP* (recommande) :
```bash
claude mcp add --transport http wordpress https://your-site.com/wp-json/mcp/v1
```
Prerequis : plugin "MCP Adapter" active dans l'admin WP.

*Option B - REST API standard avec Application Password* :
1. Admin WP > Utilisateurs > ton profil > Mots de passe d'application > creer "Claude Code"
2. Copier le mot de passe genere (ne pas le perdre, il ne sera plus affiche)
3. Config `~/.claude.json` :
```json
{
  "mcpServers": {
    "wordpress": {
      "command": "npx",
      "args": ["-y", "gaupoit-wordpress-mcp"],
      "env": {
        "WP_URL": "https://your-site.com",
        "WP_USERNAME": "ton_user",
        "WP_APP_PASSWORD": "xxxx xxxx xxxx xxxx"
      }
    }
  }
}
```

### 2. Creer le fichier `config/site.json`

Apres install du plugin, copie l'exemple fourni :

```bash
cp config.example/site.json.example config/site.json
```

Edite avec les infos de ton site :

```json
{
  "site_url": "https://monsite.com",
  "ga4_property_id": "123456789",
  "wp_api_url": "https://monsite.com/wp-json",
  "timezone": "Europe/Paris",
  "language": "fr",
  "theme": "dark",
  "show_upgrade_hints": true,
  "thresholds": {
    "min_clicks_for_conversion_crossing": 10,
    "min_days_for_crossing": 30,
    "quick_wins_position_range": [4, 10],
    "quick_wins_ctr_benchmark_ratio": 0.5,
    "zombie_min_impressions": 500,
    "zombie_max_clicks": 5
  }
}
```

Pour trouver ton `ga4_property_id` : GA4 > Admin > Property Details.

### 3. Diagnostic

```
/geo-check
```

Rapport de statut FR qui liste chaque MCP, la config, les permissions. Si tout est vert, tu peux generer ton premier dashboard. Sinon, les messages d'erreur expliquent quoi corriger.

---

## Les 6 commandes

| Commande | Role | MCPs utilises | Output |
|---|---|---|---|
| `/dashboard` | Dashboard HTML complet | GSC + GA4 + WP | `output/dashboards/YYYY-MM-DD.html` |
| `/decay` | Pages en perte de trafic | GSC | stdout + `--save` optionnel |
| `/quick-wins` | Keywords positions 4-10 CTR sous-optimal | GSC | stdout + `--save` optionnel |
| `/llm-traffic` | Analyse trafic LLM par moteur | GA4 | stdout + `--save` optionnel |
| `/weekly-report` | Rapport client markdown | GSC + GA4 | `output/reports/YYYY-Www.md` |
| `/geo-check` | Diagnostic MCPs et config | Tous | stdout |

### Flags supportes sur `/dashboard`

| Flag | Valeurs | Defaut | Effet |
|---|---|---|---|
| `--compare` | `monthly`, `weekly`, `yoy` | `monthly` | Periode de comparaison des KPIs |
| `--period` | nombre de jours | `30` | Periode d'analyse |
| `--top` | nombre | `20` | Limite top-N dans les tables |
| `--theme` | `dark`, `light`, `auto` | config | Theme visuel |

Exemples :
```
/dashboard --compare=yoy
/dashboard --period=90 --theme=light
/dashboard --top=10
```

---

## Themes du dashboard

Le dashboard supporte deux themes :

- **dark** (defaut) : style Node6 Liquid Neon Bento, fond sombre, accents cyan/blue neon. Parfait pour screenshot LinkedIn et usage personnel consultant.
- **light** : fond clair, palette plus douce. Parfait pour partage client ou impression.

Tu peux basculer :
- Via `site.json` en mettant `"theme": "light"` ou `"auto"`
- Via flag `/dashboard --theme=light`
- En mode `auto`, le dashboard suit les preferences OS (prefers-color-scheme)

---

## Strategy upsell vers SEO Engine

Le plugin inclut 7 touchpoints d'information sur SEO Engine (le produit paye de Node6), toujours non intrusifs :

1. Bloc 7 "Ce que SEO Engine ajouterait" (5 features premium)
2. Annotations contextuelles dans blocs 3, 4, 6
3. Footer du dashboard
4. Disclaimer bloc 3 LLM vers logs serveur SEO Engine
5. Message si tu demandes une commande hors scope
6. Section "Limites" dans `/geo-check`
7. Footer de `/weekly-report`

Tu peux desactiver les annotations de niveau 2 (dans les blocs) en mettant `"show_upgrade_hints": false` dans `site.json`. Les autres touchpoints restent (ils sont marginaux).

**Aucun dark pattern** : pas de popup, pas de feature bridee avec message frustrant, pas d'interruption. Le plugin est entierement gratuit et fonctionnel.

---

## Ce que le plugin **ne fait pas** (reserve a SEO Engine paye)

- Export PDF client-ready avec branding
- Audit Core Web Vitals terrain via Chrome DevTools
- Scoring GEO 7 criteres detaille par URL
- Redaction SEO+GEO automatique (brief vers publication WP)
- Publication WordPress via MCP
- Logs serveur pour trafic LLM exact (100%)
- Mode multi-clients et batch
- DataForSEO integration
- Scheduling via n8n
- Subagents specialises

Voir [SEO Engine](https://www.node6.ai/fr/os-metier-ia/seo-engine/) pour ces fonctionnalites.

---

## Troubleshooting

### `/geo-check` retourne "GSC MCP indisponible"

```bash
uvx mcp-search-console
```

Au premier run, un navigateur s'ouvre. Si rien ne s'ouvre, verifier que tu n'as pas de proxy corporate qui bloque l'OAuth.

### `/geo-check` retourne "GA4 MCP indisponible"

1. Verifier que ADC est actif :
   ```bash
   gcloud auth application-default print-access-token
   ```
2. Si expire : `gcloud auth application-default login --scopes=openid,https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/userinfo.email`
3. Si "Application bloquee" : passer en service account ou OAuth custom, voir [docs/ga4-auth-setup.md](../../docs/ga4-auth-setup.md).

### `/geo-check` OK mais `/dashboard` hang sur GA4

Bug connu du MCP officiel Google (issue #134) : hang indefini avec ADC user OAuth.
Workaround : basculer vers service account JSON.
Voir Option B dans [docs/ga4-auth-setup.md](../../docs/ga4-auth-setup.md).

### "Warning: App not verified" au moment du GA4 OAuth

Normal avec un OAuth client custom (voir Option C du guide auth). Clique "Advanced > Continue to <app name>" en assumant que tu fais confiance a ta propre app.

### WordPress MCP "Failed to connect"

Causes possibles :
- Plugin MCP Adapter desactive cote WP : re-activer dans l'admin
- Token Application Password expire : regenerer dans admin WP > utilisateurs > mots de passe d'application
- URL WP incorrecte dans `site.json` : doit etre `https://monsite.com/wp-json` (sans `/wp/v2` a la fin)
- Corporate firewall bloque : tester `curl https://monsite.com/wp-json/` depuis la meme machine

### Dashboard bloc 4 vide ou "Pas assez de donnees"

Le croisement GSC x GA4 exige au minimum :
- 30 jours de donnees GSC
- URLs avec au moins 10 clics SEO sur la periode
- GA4 property ID correct et accessible

Si ton site est recent, patiente. Tu peux baisser `min_clicks_for_conversion_crossing` dans `site.json` a 5 pour debloquer (les resultats seront plus bruites).

### Le HTML genere depasse 500 Ko

C'est une regression. Verifier que `--top` n'est pas pousse a une valeur extreme. Normalement impossible avec les defauts.

### Recos IA semblent generiques ou inexactes

Le prompt de generation des recos a ete itere sur 3-5 sites. Si tu constates des recos non pertinentes sur ton site :
- Verifier que les donnees d'input (blocs 1-5) sont correctes
- Ouvrir une issue : https://github.com/node6-ai/claude-marketplace/issues avec le fichier `output/raw/YYYY-MM-DD.json` anonymise

---

## Mise a jour

```
/plugin update geo-dashboard
```

Les nouvelles versions sont publiees sur le marketplace Node6. Pas besoin de reconfigurer, ton `site.json` et tes MCPs restent en place.

---

## Desinstallation

```
/plugin uninstall geo-dashboard
```

Ca retire le plugin. Les fichiers `config/site.json`, `output/`, et les MCPs dans `~/.claude.json` ne sont pas touches (tu les as mis, tu les enleves si tu veux).

---

## License

MIT. Voir [LICENSE](./LICENSE).

## Credits et attributions

- Auteur principal : Fred Kinzi, Node6.ai
- Plugin framework : [Claude Code](https://code.claude.com) par Anthropic
- MCPs utilises :
  - GSC : [AminForou/mcp-gsc](https://github.com/AminForou/mcp-gsc) (MIT)
  - GA4 : [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp) (Apache-2.0, Google officiel)
  - WordPress : WordPress MCP Adapter officiel ou [gaupoit/wordpress-mcp](https://github.com/gaupoit/wordpress-mcp)
- Inspiration recos-generator : [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo) (MIT). Structure et framework GEO adaptes, prompt reecrit. Voir [NOTICES](./NOTICES).

## Support

- Issues : https://github.com/node6-ai/claude-marketplace/issues
- Contact : contact@node6.ai
- Docs complete : https://www.node6.ai/plugins/geo-dashboard/

## Vers SEO Engine

Ce plugin est l'**etage 0** de [SEO Engine](https://www.node6.ai/fr/os-metier-ia/seo-engine/), un OS metier IA complet pour consultants et agences SEO. Tu l'apprecies ? Decouvre la version complete qui ajoute la redaction, la publication, les audits CWV, le scoring GEO 7 criteres, le mode multi-clients, et bien plus.
