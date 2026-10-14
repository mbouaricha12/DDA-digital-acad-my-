/* DDA standalone public-document runtime. */
(() => {
  'use strict';
  const key = document.body.dataset.document;
  const groups = window.DDA_PUBLIC_DOCUMENTS || {};
  const doc = groups.public?.[key] || groups.legal?.[key];
  if (!doc) return;
  const title = document.querySelector('[data-document-title]');
  const content = document.querySelector('[data-document-content]');
  if (title) title.textContent = doc.title;
  if (content) content.innerHTML = doc.content;
  document.title = `${doc.title} — Darius Digital Academy`;
  const description = document.querySelector('meta[name="description"]');
  const lead = content?.querySelector('.public-doc-lead')?.textContent?.trim();
  if (description && lead) description.setAttribute('content', lead);
  document.querySelectorAll('[data-document-nav]').forEach(link => {
    link.toggleAttribute('aria-current', link.dataset.documentNav === key);
  });
})();
