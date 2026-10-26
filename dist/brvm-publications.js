/* Shared BRVM publication contract — the single source of truth for what counts
   as a verified, displayable publication. Used by the Academy app (app.js) and
   the public landing ticker (landing-ticker.js) so neither page re-implements
   or re-interprets this business rule on its own. No publication is shown
   until a source, redistribution right and editorial verification are all
   recorded; an empty or rejected registry is intentional, never papered over
   with placeholder content. */
(function () {
  'use strict';

  const REQUIRED_FIELDS = Object.freeze([
    'id', 'title', 'source', 'sourceUrl', 'documentUrl', 'referenceDate', 'retrievedAt',
    'verificationStatus', 'freshnessStatus', 'redistributionRights'
  ]);

  function isVerified(publication) {
    if (!publication || typeof publication !== 'object') return false;
    if (REQUIRED_FIELDS.some(field => typeof publication[field] !== 'string' || !publication[field].trim())) return false;
    if (publication.verificationStatus !== 'verified') return false;
    if (publication.freshnessStatus !== 'current') return false;
    if (publication.redistributionRights !== 'authorized') return false;
    if (!/^https:\/\//i.test(publication.sourceUrl) || !/^https:\/\//i.test(publication.documentUrl)) return false;
    const referenceTime = Date.parse(publication.referenceDate);
    const retrievedTime = Date.parse(publication.retrievedAt);
    return Number.isFinite(referenceTime) && Number.isFinite(retrievedTime) && retrievedTime >= referenceTime;
  }

  window.DDABrvmPublications = Object.freeze({ REQUIRED_FIELDS, isVerified });
})();
