'use strict';

const fs = require('node:fs');
const path = require('node:path');

/* ==========================================================================
   PREMIUM / MEMBER RESOURCES REGISTRY — final pre-launch audit (2026-11),
   Chantier 3 (protection des ressources) + Chantier 2.4 (architecture pour
   ajouter de nouvelles ressources sans toucher au code).

   Why this exists: DDA's existing downloadable PDFs (checklist, glossaire,
   journal template) are plain static files under dist/resources/downloads/
   -- intentionally public, unauthenticated lead-magnet downloads linked
   directly from the landing page. That is correct for THOSE three files and
   is left untouched here.

   But nothing in the repo enforced membership on a downloadable resource at
   all: any file simply dropped into dist/ would be served to anyone who
   found or guessed its URL, Free or Premium, logged in or not -- the exact
   gap this audit was asked to close before new (Premium) resources get
   added. The fix mirrors bff/src/premium-content.js exactly: metadata
   lives in a registry, the actual file bytes live OUTSIDE dist/ (never
   statically served), and a download is only ever streamed by
   bff/src/app.js's authenticated GET /v1/resources/:id/download route
   after the SAME hasActivePremium()/session checks every other Premium
   route already uses.

   The registry below is intentionally empty: no resource files exist yet
   (this audit found none to migrate -- the 3 public PDFs stay public by
   design, see above). Adding a real resource later needs exactly two
   steps, no code change: (1) append one entry here with a `file` name,
   (2) drop that file under bff/resources-storage/ (DEFAULT_STORAGE_DIR
   below) with the matching name. GET /v1/resources already lists whatever
   is in this array; GET /v1/resources/:id/download already protects it.
   ========================================================================== */
const RESOURCE_REGISTRY = Object.freeze([]);

const DEFAULT_STORAGE_DIR = path.join(__dirname, '..', 'resources-storage');

function createPremiumResourcesStore({ registry = RESOURCE_REGISTRY, storageDir = DEFAULT_STORAGE_DIR, fsImpl = fs } = {}) {
  function listResources() {
    return registry
      .filter(entry => entry.status === 'published')
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(({ id, name, description, category, level, tags, membershipRequired, type, coverImage, format }) => ({
        id, name, description, category, level, tags, membershipRequired, type, coverImage, format
      }));
  }

  function findResource(id) {
    return registry.find(entry => entry.id === id && entry.status === 'published') || null;
  }

  // Streams the file to `res` only after the caller has already verified
  // the requester's membership for this exact resource -- this function
  // itself does not re-check entitlement, by design (single responsibility;
  // the route handler owns the security decision, this owns I/O).
  function streamResource(resource, res) {
    const filePath = path.join(storageDir, resource.file);
    if (!filePath.startsWith(storageDir)) return false; // defends resource.file against path traversal
    if (!fsImpl.existsSync(filePath)) return false;
    res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${resource.file.replace(/[^\w.\-]/g, '_')}"`);
    fsImpl.createReadStream(filePath).pipe(res);
    return true;
  }

  return { listResources, findResource, streamResource };
}

module.exports = { createPremiumResourcesStore, RESOURCE_REGISTRY, DEFAULT_STORAGE_DIR };
