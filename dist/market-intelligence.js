/* DDA Market Intelligence — pedagogical context only, never live quotes or signals. */
(function () {
  'use strict';
  const demo = Object.freeze({
    indices: Object.freeze([
      Object.freeze({ label: 'BRVM Composite', description: 'Indice large de la cote BRVM.' }),
      Object.freeze({ label: 'BRVM 30', description: 'Indice des valeurs les plus liquides de la cote.' })
    ]),
    calendar: Object.freeze([]),
    sources: Object.freeze([
      Object.freeze({ label: 'Cours des actions', type: 'Marché officiel', description: 'Cours, variations et informations de la cote à vérifier sur BRVM.', href: 'https://www.brvm.org/fr/cours-actions/0' }),
      Object.freeze({ label: 'Résumé du marché', type: 'Indices & activités', description: 'Indices, capitalisations, volumes et activités publiés par la BRVM.', href: 'https://www.brvm.org/fr/resume' }),
      Object.freeze({ label: 'Sociétés cotées', type: 'Émetteurs', description: 'Répertoire officiel des sociétés cotées et des émetteurs.', href: 'https://www.brvm.org/fr/emetteurs/societes-cotees' }),
      Object.freeze({ label: 'Rapports des sociétés', type: 'Documents', description: 'Rapports et publications à consulter avant toute analyse.', href: 'https://www.brvm.org/fr/rapports-societes-cotees' }),
      Object.freeze({ label: 'Comment investir à la BRVM', type: 'Repère pédagogique', description: 'Règles et étapes officielles pour comprendre l’accès au marché.', href: 'https://www.brvm.org/fr/comment-investir-la-brvm' })
    ])
  });
  const candlePatterns = Object.freeze([
    Object.freeze([6, 14, 4, 16, 9, 15, 5, 17]),
    Object.freeze([10, 15, 12, 6, 16, 8, 13, 7])
  ]);
  window.DDAMarketIntelligence = Object.freeze({ demo, candlePatterns });
})();
