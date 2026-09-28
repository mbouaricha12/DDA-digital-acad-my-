# DDA — Trading & Financial Markets Learning OS

DDA doit devenir un **Trading & Financial Markets Learning Operating System**.
Promesse : **Learn Markets. Build Skills. Prove Progress.**

## Site actuel

Le site est un prototype SPA statique servi depuis `dist/`. Il contient déjà :

- la landing publique et l’accès local ;
- le Darius Terminal / Dashboard apprenant ;
- le Parcours M0 et les leçons authored M0/M1 ;
- exercices, quiz, feedback et progression locale ;
- Journal & Plan, Ressources, Market Intelligence de démonstration et Broker Hub factuel ;
- profil, support, PWA/offline et low-data.

Les données de compte et de progression restent locales. Aucun paiement, broker,
flux de marché réel, IA ou backend n’est activé.

## Lancer en local

```bash
python3 -m http.server 4173 --bind 0.0.0.0 --directory dist
```

Puis ouvrir `http://127.0.0.1:4173/`.

## Tests

```bash
for f in tests/test_*.js tests/smoke_app_boot.js; do node "$f" || exit 1; done
```

Les documents `DDA_Instruction_Finale_Agent_Unique_V1.md`,
`DDA_TERMINAL_FOUNDATION_SCOPE_VALIDATION.md` et
`DDA_INFORMATION_ARCHITECTURE_TARGET.md` cadrent la gouvernance, le Terminal
Foundation et la structure cible sans autoriser de publication ou connexion
externe supplémentaire.
