# DDA Academy — Déploiement externe du BFF (Render / Railway)

**Cible Supabase :** `dda-academy-p3`  
**Région :** `eu-west-1` / Ireland  
**URL API Supabase :** `https://vcvrjogdhdakrwmemoxl.supabase.co`

Ce dépôt contient deux manifests : `render.yaml` et `railway.json`. Aucun secret n'est versionné.

## Variables obligatoires

| Variable | Valeur / origine | Secret |
|---|---|---:|
| `SUPABASE_URL` | `https://vcvrjogdhdakrwmemoxl.supabase.co` | Non |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Project Settings → API → publishable key | Non, mais à garder côté serveur | 
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API → service role key | **Oui** |
| `SESSION_ENCRYPTION_KEY` | `openssl rand -base64 32 \\| tr '+/' '-_' \\| tr -d '='` | **Oui** |
| `ALLOWED_ORIGINS` | Origine HTTPS exacte de l'app, ex. `https://app.example.dda.academy` | Non |
| `BFF_COOKIE_SECURE` | `true` | Non |
| `EMAIL_REDIRECT_TO` | `https://app.example.dda.academy/#access` | Non |
| `SESSION_IDLE_MS` | `43200000` (12 h) | Non |
| `SESSION_ABSOLUTE_MS` | `2592000000` (30 jours) | Non |
| `PORT` | Injecté par Render/Railway | Non |

Ne jamais utiliser `*` dans `ALLOWED_ORIGINS`. La `SERVICE_ROLE_KEY` et la clé de chiffrement ne doivent jamais être placées dans GitHub, dans `render.yaml`, dans `railway.json` ou dans le chat.

## Option A — Render

1. Ouvrir Render → **New +** → **Blueprint**.
2. Connecter le dépôt GitHub `mbouaricha12/DDA-digital-acad-my-`.
3. Sélectionner le fichier `render.yaml` à la racine.
4. Vérifier que le service est un **Web Service**, que `rootDir` vaut `bff` et que le health check est `/healthz` (sans émission de cookie).
5. Dans **Environment → Secret Files / Environment Variables**, renseigner les variables marquées `sync: false` :
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_ENCRYPTION_KEY`
   - `ALLOWED_ORIGINS`
   - `EMAIL_REDIRECT_TO`
6. Générer la clé de chiffrement localement, puis la coller directement dans Render :

```bash
openssl rand -base64 32 | tr '+/' '-_' | tr -d '='
```

7. Déployer et attendre le health check vert.
8. Récupérer l'URL Render, par exemple `https://dda-academy-bff.onrender.com`.
9. Si un domaine `api.example.dda.academy` est utilisé, le rattacher dans Render, activer TLS et conserver l'URL canonique dans le frontend.

## Option B — Railway

1. Installer et authentifier Railway CLI :

```bash
npm install -g @railway/cli
railway login
```

2. Créer ou sélectionner un projet Railway, puis lier le dépôt :

```bash
railway init
railway link
```

3. Configurer les variables non secrètes :

```bash
railway variables set \
  SUPABASE_URL=https://vcvrjogdhdakrwmemoxl.supabase.co \
  BFF_COOKIE_SECURE=true \
  SESSION_IDLE_MS=43200000 \
  SESSION_ABSOLUTE_MS=2592000000
```

4. Ajouter les variables sensibles depuis Railway Dashboard → **Variables**, ou via la CLI sans les écrire dans un fichier versionné :

```bash
railway variables set SUPABASE_PUBLISHABLE_KEY='...' \
  SUPABASE_SERVICE_ROLE_KEY='...' \
  SESSION_ENCRYPTION_KEY='...' \
  ALLOWED_ORIGINS='https://app.example.dda.academy' \
  EMAIL_REDIRECT_TO='https://app.example.dda.academy/#access'
```

5. Déployer :

```bash
railway up
```

6. Générer un domaine Railway ou rattacher `api.example.dda.academy` via **Settings → Networking**.
7. Vérifier que le service écoute le `PORT` injecté par Railway et que `/healthz` répond `200` sans cookie.

## Validation post-déploiement

Remplacer `BFF_URL` par l'URL réelle du service :

```bash
BFF_URL='https://api.example.dda.academy'
curl -i "$BFF_URL/healthz"
curl -i "$BFF_URL/v1/security/csrf"
curl -i -X OPTIONS "$BFF_URL/v1/auth/login" \
  -H 'Origin: https://app.example.dda.academy' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,x-csrf-token'
```

À vérifier avant de connecter le frontend :

- `/v1/security/csrf` répond `204` et émet un cookie CSRF ;
- `/healthz` répond `200` sans `Set-Cookie` ;
- le preflight CORS autorise uniquement l'origine frontend ;
- une requête sans `Origin` ou avec une mauvaise origine est rejetée ;
- le serveur refuse de démarrer si un secret obligatoire manque ;
- le serveur refuse les origines wildcard/non-HTTPS, un redirect e-mail hors allowlist et une clé de chiffrement qui ne décode pas en 32 octets ;
- les logs ne contiennent aucune clé, cookie, mot de passe ou e-mail complet ;
- `GET /v1/me` retourne `401` sans cookie de session ;
- le parcours réel inscription → vérification → connexion est testé avec une adresse de test dédiée.

## Configuration frontend après publication

Définir `window.DDA_BFF_BASE_URL` avant `bff-client.js`, avec l'URL HTTPS réelle du BFF :

```html
<script>
  window.DDA_BFF_BASE_URL = 'https://api.example.dda.academy';
</script>
```

Ne pas activer cette URL dans le frontend avant d'avoir validé le CORS, les cookies `Secure`, le domaine, l'envoi d'e-mail et la révocation de session.

## Blocages actuels

La session ne dispose pas d'un compte Render/Railway connecté, d'un domaine API contrôlé ni de la `SUPABASE_SERVICE_ROLE_KEY`. Le déploiement externe doit donc être déclenché par le propriétaire depuis Render/Railway, ou après connexion d'un connecteur d'infrastructure adapté.
