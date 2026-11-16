/* DDA — Market & Economic News Ticker (2026-11-16).
 *
 * Honest-by-default ticker: it only displays data that the BFF actually
 * returns as verified. There is no fabricated headline, no fake "live"
 * timestamp and no third-party news scrape. Three states are explicit:
 *   - ready:  verified BRVM publications and/or configured market quotes;
 *   - empty:  sources reachable but nothing verified to show;
 *   - offline/not configured: no BFF base or transient failure.
 *
 * The component is intentionally data-source agnostic: when a licensed
 * economic-news feed is connected to the BFF, it can be mapped here without
 * changing the public markup. Until then the bar states its real status.
 */
(function () {
  'use strict';

  const root = document.getElementById('dda-news-ticker');
  const track = document.getElementById('dda-news-ticker-track');
  const freshness = document.getElementById('dda-news-ticker-freshness');
  if (!root || !track || !freshness) return;

  const base = String(window.DDA_BFF_BASE_URL || '').trim().replace(/\/+$/, '');
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[char]));
  }

  function setState(state, label) {
    root.dataset.state = state;
    freshness.textContent = label;
  }

  function dateLabel(iso) {
    const time = Date.parse(iso);
    if (!Number.isFinite(time)) return '';
    try {
      return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(time));
    } catch {
      return '';
    }
  }

  function priceLabel(value) {
    try {
      return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: value >= 100 ? 0 : value >= 1 ? 2 : 4 }).format(value);
    } catch {
      return String(value);
    }
  }

  function itemHtml({ category, title, meta, href }) {
    const inner = `
      <span class="dda-news-ticker-cat">${escapeHtml(category)}</span>
      <strong>${escapeHtml(title)}</strong>
      <span class="dda-news-ticker-meta">${escapeHtml(meta)}</span>`;
    return href
      ? `<a class="dda-news-ticker-item" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : `<span class="dda-news-ticker-item">${inner}</span>`;
  }

  function render(items, stateLabel) {
    if (!items.length) {
      track.innerHTML = '<span class="dda-news-ticker-item is-status">Veille économique — source vérifiée en attente</span>';
      setState('empty', stateLabel || 'en attente');
      return;
    }
    const html = items.map(itemHtml).join('');
    track.innerHTML = reducedMotion ? html : html + html;
    const fetchedAt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
    setState('ready', `sources vérifiées · ${fetchedAt}`);
  }

  function publicationItem(publication) {
    const contract = window.DDABrvmPublications;
    if (contract?.isVerified && !contract.isVerified(publication)) return null;
    const title = String(publication.title || '').trim();
    if (!title) return null;
    const date = dateLabel(publication.referenceDate);
    const source = String(publication.source || 'BRVM').trim();
    return {
      category: 'BRVM',
      title,
      meta: [source, date].filter(Boolean).join(' · '),
      href: publication.documentUrl,
    };
  }

  function quoteItem(label, quote) {
    if (!quote || quote.status !== 'ok' || !Number.isFinite(quote.price)) return null;
    const asOf = quote.asOf ? dateLabel(quote.asOf) : '';
    return {
      category: 'MARCHÉ',
      title: `${label || 'Instrument'} ${priceLabel(quote.price)}`,
      meta: ['Cours disponible', asOf].filter(Boolean).join(' · '),
      href: '',
    };
  }

  async function getJson(path) {
    const response = await fetch(`${base}${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function init() {
    if (!base) {
      render([], 'sources non configurées');
      return;
    }

    const [publications, quotes] = await Promise.allSettled([
      getJson('/v1/publications/brvm'),
      getJson('/v1/market/quotes'),
    ]);

    const items = [];
    if (publications.status === 'fulfilled' && Array.isArray(publications.value?.items)) {
      for (const publication of publications.value.items) {
        const item = publicationItem(publication);
        if (item) items.push(item);
      }
    }
    if (quotes.status === 'fulfilled' && quotes.value?.instruments && typeof quotes.value.instruments === 'object') {
      for (const [symbol, quote] of Object.entries(quotes.value.instruments)) {
        const item = quoteItem(quote?.label || symbol, quote);
        if (item) items.push(item);
      }
    }

    if (items.length) {
      render(items);
      return;
    }
    const reachable = publications.status === 'fulfilled' || quotes.status === 'fulfilled';
    render([], reachable ? 'aucune donnée vérifiée' : 'sources indisponibles');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
