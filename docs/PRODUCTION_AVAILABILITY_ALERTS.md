# Alertes email du health check de production

Le workflow `.github/workflows/production-availability.yml` vérifie le site public et le BFF toutes les 15 minutes. Si le job `availability` échoue, le job `alert` envoie un email via l’API Resend à `dariusdigitalacademy@gmail.com`.

## Secrets GitHub requis

Configurer les deux secrets au niveau du dépôt :

- `RESEND_API_KEY` : clé API Resend, conservée uniquement dans les secrets GitHub Actions.
- `RESEND_FROM_EMAIL` : expéditeur vérifié dans Resend, par exemple `DDA Monitoring <alerts@dariusdigitalacademy.com>`.

La clé ne doit jamais être ajoutée au dépôt, aux logs ou à une variable publique. L’adresse d’expédition doit correspondre à un domaine vérifié dans Resend ; l’adresse de test `onboarding@resend.dev` ne convient pas à une alerte de production destinée à un autre destinataire.

## Vérification manuelle

Après avoir configuré les secrets, lancer le workflow avec `workflow_dispatch` depuis GitHub Actions. Pour tester le chemin d’alerte sans provoquer une panne réelle, utiliser temporairement une branche de test ou un environnement contrôlé ; ne pas modifier la surveillance de production uniquement pour générer une alerte.

Le mail contient le dépôt, la branche, le commit et un lien direct vers le run GitHub Actions ayant échoué. Le destinataire est volontairement fixe dans le workflow afin d’éviter qu’un paramètre externe puisse rediriger les alertes vers une adresse non autorisée.
