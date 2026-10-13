/* DDA Market Intelligence — pedagogical demo data only, never live quotes or signals. */
(function () {
  'use strict';
  const demo = Object.freeze({
    indices: Object.freeze([
      Object.freeze({ label: 'BRVM Composite', description: 'Indice large de la cote BRVM.' }),
      Object.freeze({ label: 'BRVM 30', description: 'Indice des valeurs les plus liquides de la cote.' })
    ]),
    calendar: Object.freeze([
      Object.freeze({ company: 'Société A', event: 'Détachement de dividende' }),
      Object.freeze({ company: 'Société B', event: 'Mise en paiement' }),
      Object.freeze({ company: 'Société C', event: 'Assemblée générale' })
    ])
  });
  const candlePatterns = Object.freeze([
    Object.freeze([6, 14, 4, 16, 9, 15, 5, 17]),
    Object.freeze([10, 15, 12, 6, 16, 8, 13, 7])
  ]);
  window.DDAMarketIntelligence = Object.freeze({ demo, candlePatterns });
})();
