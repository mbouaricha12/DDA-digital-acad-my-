# DDA — DECISION_LOG

Les entrées distinguent une recommandation opératoire d’une décision commerciale du propriétaire. Les décisions qui touchent prix, droits ou paiements ne sont pas réputées approuvées par un simple test technique.

| ID | Date | Décision / recommandation | Portée et état |
|---|---|---|---|
| D-001 | 2026-11-18 | Employer **DDA Free** et **DDA Premium** comme nomenclature commerciale publique. Garder `advanced_modules` comme entitlement interne; préférer « droit aux modules avancés » en copie publique. | Recommandation de cohérence; ne change aucun gate. Confirmer le mapping commercial définitif avec le propriétaire. |
| D-002 | 2026-11-18 | `/launch/` décrit six leçons au catalogue, dont trois M0 incluses en Free et trois M1 sous droit avancé, hors périmètre Free. | Cohérent avec le texte live vérifié; ne pas requalifier les M1 en Free sans décision explicite. |
| D-003 | 2026-11-18 | Premium demeure un aperçu/démonstration; aucun paiement ni abonnement actif ne doit être annoncé. | Bloquant pour toute ouverture payante jusqu’à validation juridique, produit marchand, staging et cycle webhook/entitlement. |
| D-004 | 2026-11-18 | Ne pas modifier les contenus pédagogiques, le curriculum ou les permissions pendant la passe SEO/audit, sauf correctif technique isolé approuvé. | Respecté : seul le calcul du pourcentage de progression intacte a été changé. |
| D-005 | 2026-11-18 | Une validation locale/preview ne satisfait pas Visible Delivery; toute déclaration de livraison exige CI, merge autorisé, publication, test de domaine officiel et capture. | Règle active pour tous les agents. |
| D-006 | 2026-11-18 | PR #121 est fermée sans merge et ne doit pas être cherry-pickée en bloc; réutiliser seulement des protections vérifiées sur `main`. PR #245 est fusionnée. | État observé GitHub; toute nouvelle analyse doit comparer les branches à `origin/main`. |
| D-007 | 2026-11-18 | Les bundles M1 sont accessibles publiquement; `advanced_modules` n’est pas une autorisation BFF observée pour ces fichiers. | Ne pas déclarer les leçons M1 protégées. Construire le chargement BFF authentifié et supprimer les bundles publics dans une PR séparée avant toute offre avancée; préserver le curriculum et le droit logique. |
