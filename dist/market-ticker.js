/* Landing crypto ticker (Chantier maquette — 2026-11-14). Same contract as
   landing-ticker.js: the public shell never loads bff-client.js (session/
   CSRF machinery is Academy-only), and "/v1/market/quotes" is an
   unauthenticated public GET, so this file talks to it directly with a
   plain fetch. It never fabricates a price: an instrument whose status
   isn't "ok" is simply left out, and the whole ticker hides itself when
   none of the 5 requested cryptos (BTC/ETH/SOL/BNB/XRP) resolve — exactly
   the honest-by-default behavior already shipped for the BRVM ticker and
   the Market Intelligence grid. Today, with no provider keys configured,
   that means hidden; the moment a key is set, real prices appear with no
   further code change. */
(function () {
  'use strict';

  const CRYPTO_SYMBOLS = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD'];

  // CSS-only colored circles with a glyph, not external brand logo image
  // assets — zero licensing risk, zero cost, same "honest and simple"
  // posture as the rest of this ticker. Colors follow each coin's own
  // widely-used brand color (not a DDA invention).
  const CRYPTO_META = {
    BTCUSD: { glyph: '₿', name: 'Bitcoin', cssClass: 'crypto-icon-btc' },
    ETHUSD: { glyph: 'Ξ', name: 'Ethereum', cssClass: 'crypto-icon-eth' },
    SOLUSD: { glyph: 'S', name: 'Solana', cssClass: 'crypto-icon-sol' },
    BNBUSD: { glyph: 'B', name: 'BNB', cssClass: 'crypto-icon-bnb' },
    XRPUSD: { glyph: 'X', name: 'XRP', cssClass: 'crypto-icon-xrp' }
  };

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function formatPrice(price) {
    const decimals = price >= 100 ? 0 : price >= 1 ? 2 : 4;
    return price.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  function renderTicker(quotes) {
    const root = document.getElementById('crypto-ticker');
    const track = document.getElementById('crypto-ticker-track');
    if (!root || !track) return;
    if (!quotes.length) {
      root.hidden = true;
      track.innerHTML = '';
      root.classList.remove('crypto-ticker-animated');
      return;
    }
    const items = quotes.map(({ symbol, price }) => {
      const meta = CRYPTO_META[symbol];
      return `
      <span class="crypto-ticker-item">
        <span class="crypto-ticker-icon ${meta.cssClass}" aria-hidden="true">${escapeHtml(meta.glyph)}</span>
        <span class="crypto-ticker-name">${escapeHtml(meta.name)}</span>
        <span class="crypto-ticker-price">$${escapeHtml(formatPrice(price))}</span>
      </span>
    `;
    }).join('');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = !reducedMotion && quotes.length > 1;
    track.innerHTML = shouldAnimate ? items + items : items;
    root.classList.toggle('crypto-ticker-animated', shouldAnimate);
    root.hidden = false;
  }

  async function init() {
    const base = String(window.DDA_BFF_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!base) return;
    try {
      const response = await fetch(`${base}/v1/market/quotes`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('market_quotes_failed');
      const body = await response.json();
      const instruments = body?.instruments;
      if (!instruments || typeof instruments !== 'object') throw new Error('market_quotes_invalid_response');
      const quotes = CRYPTO_SYMBOLS
        .map(symbol => ({ symbol, quote: instruments[symbol] }))
        .filter(({ quote }) => quote && quote.status === 'ok' && Number.isFinite(quote.price))
        .map(({ symbol, quote }) => ({ symbol, price: quote.price }));
      if (!quotes.length) {
        console.info('[DDA] Crypto ticker: market data reachable, no configured price to show yet.');
      }
      renderTicker(quotes);
    } catch (error) {
      console.info('[DDA] Crypto ticker: market data unavailable, banner hidden.', error);
      renderTicker([]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
