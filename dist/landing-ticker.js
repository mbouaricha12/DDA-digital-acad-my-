/* Landing BRVM publications ticker. The public shell never loads the
   authenticated app client (bff-client.js, with its session/CSRF
   machinery) — per the public/Academy shell contract, that stays
   Academy-only. "/v1/publications/brvm" is an unauthenticated public GET,
   so this file talks to it directly with a plain fetch and reuses the
   shared verification contract (brvm-publications.js) for what counts as
   a valid publication; it never re-decides that itself.
   Visibility rule: shown only when at least one verified, non-expired
   publication is available. A BFF outage and an empty registry both result
   in the banner staying hidden (never a permanent "coming soon" placeholder
   on the public landing page); they are distinguished only in console
   diagnostics, never in the UI. */
(function () {
  'use strict';

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
  }

  function renderTicker(publications) {
    const root = document.getElementById('brvm-ticker');
    const track = document.getElementById('brvm-ticker-track');
    if (!root || !track) return;
    if (!publications.length) {
      root.hidden = true;
      track.innerHTML = '';
      root.classList.remove('brvm-ticker-animated');
      return;
    }
    const items = publications.map(pub => `
      <a class="brvm-ticker-item" href="${escapeHtml(pub.documentUrl)}" target="_blank" rel="noopener noreferrer">
        <span class="brvm-ticker-badge">Vérifié</span>
        <span class="brvm-ticker-title">${escapeHtml(pub.title)}</span>
        <span class="brvm-ticker-meta">${escapeHtml(pub.source)} · ${escapeHtml(pub.referenceDate)}</span>
      </a>
    `).join('');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // A single publication, or a reduced-motion preference, never animates —
    // the track is simply the static (and already keyboard/scroll-reachable)
    // list. Multiple publications otherwise loop via a CSS animation that
    // pauses on hover/focus; duplicating the list once is what makes that
    // loop seamless, and is skipped entirely when there is nothing to loop.
    const shouldAnimate = !reducedMotion && publications.length > 1;
    track.innerHTML = shouldAnimate ? items + items : items;
    root.classList.toggle('brvm-ticker-animated', shouldAnimate);
    root.hidden = false;
  }

  async function init() {
    const base = String(window.DDA_BFF_BASE_URL || '').trim().replace(/\/+$/, '');
    if (!base) return;
    try {
      const response = await fetch(`${base}/v1/publications/brvm`, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('brvm_publications_failed');
      const body = await response.json();
      const items = body?.items;
      if (!Array.isArray(items)) throw new Error('brvm_publications_invalid_response');
      const verified = items.filter(window.DDABrvmPublications.isVerified);
      if (!verified.length) {
        console.info('[DDA] BRVM ticker: registry reachable, no verified publication to show yet.');
      }
      renderTicker(verified);
    } catch (error) {
      console.info('[DDA] BRVM ticker: publications service unavailable, banner hidden.', error);
      renderTicker([]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
