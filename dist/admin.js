(function () {
  'use strict';

  // DDA back-office (admin). The server exposes GET /v1/admin/overview,
  // /v1/admin/users and /v1/admin/memberships for reading, plus
  // POST /v1/admin/roles and DELETE /v1/admin/roles/:id for role
  // assignment/revocation (bff/src/app.js withAdmin, enforced owner-only by
  // admin-roles-store.js — never by anything this file decides). This
  // screen reflects exactly what the server allows: role controls only
  // render for an owner (see roleCell below), and every mutation still goes
  // through the server, which can still refuse it (403/409/400) regardless
  // of what the UI shows. Nothing here can ban a user or edit a membership;
  // that stays server-side work for a later lot.
  // Admin auth reuses the exact same session cookie as the learner app
  // (bff/src/app.js withAdmin → withUser): there is no separate admin login.

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }

  function formatDate(value) {
    if (!value) return '—';
    try { return new Date(value).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return '—'; }
  }

  const gate = document.getElementById('admin-gate');
  const gateTitle = document.getElementById('admin-gate-title');
  const gateDescription = document.getElementById('admin-gate-description');
  const gateAction = document.getElementById('admin-gate-action');
  const shell = document.getElementById('admin-shell');

  function showGate({ title, description, actionText = 'Retour à l’Academy', actionHref = 'academy.html' }) {
    document.querySelectorAll('.sidebar, .mobile-drawer, .mobile-drawer-backdrop, .mobile-nav, main .view').forEach(el => el.hidden = true);
    document.querySelector('.mobile-menu-toggle')?.setAttribute('hidden', 'true');
    // Hiding .sidebar above removes it from the desktop grid's auto-placement
    // (grid-template-columns:260px 1fr) — without collapsing to a single
    // column the same way #landing already does, `main` is auto-placed into
    // the sidebar's leftover 260px track instead of spanning the row,
    // squeezing the gate card into a narrow strip. public-shell is a
    // one-way flip here: showGate only runs during initial bootstrap and is
    // never reversed mid-session (a role change requires a reload).
    document.body.classList.add('public-shell');
    gateTitle.textContent = title;
    gateDescription.textContent = description;
    gateAction.textContent = actionText;
    gateAction.setAttribute('href', actionHref);
    gate.hidden = false;
  }

  // ---------- Navigation (sidebar / mobile drawer / bottom nav) ----------
  const views = document.querySelectorAll('main .view');
  const navButtons = document.querySelectorAll('[data-admin-view]');
  const contextTitle = document.getElementById('admin-context-title');
  const viewTitles = { overview: 'Aperçu', users: 'Utilisateurs', memberships: 'Abonnements', content: 'Contenu', resources: 'Ressources', library: 'Bibliothèque', progress: 'Progression', entitlements: 'Entitlements' };

  function showAdminView(id) {
    views.forEach(view => view.classList.toggle('active', view.id === `admin-view-${id}`));
    navButtons.forEach(button => button.classList.toggle('active', button.dataset.adminView === id));
    contextTitle.textContent = viewTitles[id] || 'Back-office';
    if (id === 'users' && !usersState.loaded) loadUsers(1);
    // Opening Memberships also warms the email-correlation map (above) with
    // page 1 of Users, best-effort, if nothing has populated it yet — purely
    // so the "Utilisateur" column has a chance to show an email instead of a
    // raw id on a fresh session. It never blocks the memberships render.
    if (id === 'memberships' && !usersState.loaded) loadUsers(1);
    if (id === 'memberships' && !membershipsState.loaded) loadMemberships(1);
    if (id === 'content' && !contentState.loaded) loadContent();
    if (id === 'resources' && !resourcesState.loaded) loadResources();
    if (id === 'library') loadLibrary();
  }

  navButtons.forEach(button => button.addEventListener('click', () => {
    showAdminView(button.dataset.adminView);
    closeDrawer();
  }));

  // ---------- Mobile drawer (same open/close pattern as the Academy app) ----------
  const drawerToggle = document.getElementById('admin-menu-toggle');
  const drawer = document.getElementById('admin-drawer');
  const drawerBackdrop = document.getElementById('admin-drawer-backdrop');
  const drawerClose = document.getElementById('admin-drawer-close');

  function closeDrawer() {
    if (!drawer) return;
    drawer.hidden = true;
    drawerBackdrop.hidden = true;
    drawerToggle?.setAttribute('aria-expanded', 'false');
  }
  function openDrawer() {
    drawer.hidden = false;
    drawerBackdrop.hidden = false;
    drawerToggle.setAttribute('aria-expanded', 'true');
  }
  drawerToggle?.addEventListener('click', () => (drawer.hidden ? openDrawer() : closeDrawer()));
  drawerClose?.addEventListener('click', closeDrawer);
  drawerBackdrop?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && drawer && !drawer.hidden) closeDrawer(); });

  // ---------- Header search: filters the existing admin sidebar nav items by
  // their real label text — same pattern as the Academy's topbar search
  // (dist/app.js initTopbarSearch). No fake search index, no new content.
  (function initAdminTopbarSearch() {
    const form = document.getElementById('admin-topbar-search-form');
    const input = document.getElementById('admin-topbar-search-input');
    if (!form || !input) return;
    form.addEventListener('submit', event => event.preventDefault());
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();
      document.querySelectorAll('.sidebar [data-admin-view]').forEach(item => {
        const label = item.textContent.trim().toLowerCase();
        item.style.display = !query || label.includes(query) ? '' : 'none';
      });
      document.querySelectorAll('.sidebar .nav-section-label').forEach(label => {
        let node = label.nextElementSibling;
        let hasVisible = false;
        while (node && !node.classList.contains('nav-section-label')) {
          if (node.matches('[data-admin-view]') && node.style.display !== 'none') hasVisible = true;
          node = node.nextElementSibling;
        }
        label.style.display = query && !hasVisible ? 'none' : '';
      });
    });
  })();

  // ---------- Header profile chip: read-only mirror of the connected admin's
  // identity. Name/e-mail come from the same /v1/me the learner app already
  // uses (window.DDABFF.getMe — no new route); role comes from the admin
  // overview call already made at boot. Never writes anything — this only
  // ever displays what the server already confirmed.
  function renderAdminProfileChip(role, me) {
    const chip = document.getElementById('admin-topbar-user');
    if (!chip) return;
    const name = (me && (me.display_name || me.email)) || 'Administrateur';
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'AD';
    document.getElementById('admin-topbar-avatar').textContent = initials;
    document.getElementById('admin-topbar-name').textContent = name;
    document.getElementById('admin-topbar-role').textContent = role || '—';
    chip.hidden = false;
  }

  // ---------- Overview ----------
  function renderMetrics(metrics) {
    const cards = [
      { key: 'active_sessions', label: 'Sessions actives' },
      { key: 'registered_users_total', label: 'Utilisateurs inscrits' },
      { key: 'memberships_by_status', label: 'Abonnements par statut' }
    ];
    const el = document.getElementById('admin-metrics');
    el.innerHTML = cards.map(card => {
      const metric = metrics[card.key];
      if (!metric || !metric.available) {
        return `<div class="panel admin-metric-card is-unavailable"><span>${escapeHtml(card.label)}</span><strong>Indisponible</strong><small>${escapeHtml(metric?.reason || 'Non calculé.')}</small></div>`;
      }
      if (card.key === 'memberships_by_status' && metric.value && typeof metric.value === 'object') {
        const parts = Object.entries(metric.value).map(([status, count]) => `${escapeHtml(status)} : ${count == null ? '—' : count}`).join(' · ');
        return `<div class="panel admin-metric-card"><span>${escapeHtml(card.label)}</span><strong style="font-size:16px">${parts || '—'}</strong></div>`;
      }
      return `<div class="panel admin-metric-card"><span>${escapeHtml(card.label)}</span><strong>${metric.value == null ? '—' : escapeHtml(metric.value)}</strong></div>`;
    }).join('');
  }

  // ---------- Users ----------
  // Role mutation is owner-only server-side (bff/src/app.js withAdmin + the
  // owner check inside admin-roles-store.js) — callerRole mirrors that, so
  // an admin (not an owner) never even sees controls that would just 403.
  let callerRole = null;
  const usersState = { page: 1, perPage: 20, loaded: false, lastUsers: [] };
  // Accumulates user_id -> email across every Users page the admin has
  // actually loaded in this session, so the Memberships table (which the
  // server only ever returns keyed by user_id — see bff/src/billing-store.js
  // listMemberships) can show a human-readable account instead of a bare
  // UUID whenever that account's page has already been seen. This never
  // calls a new route and never guesses: a user_id not yet seen on a Users
  // page is shown as-is, honestly, rather than papered over.
  const knownEmailsById = new Map();
  const roleFeedback = document.getElementById('admin-role-feedback');
  function setDataFeedback(id, message, kind = 'error') {
    const feedback = document.getElementById(id);
    if (!feedback) return;
    feedback.textContent = message || '';
    feedback.dataset.kind = kind;
    feedback.hidden = !message;
  }
  function apiDataError(status, label) {
    if (status === 401) return `${label} indisponibles : ta session administrateur a expiré.`;
    if (status === 403) return `${label} indisponibles : ton rôle ne permet pas cette consultation.`;
    if (status === 503) return `${label} indisponibles : le service serveur n’est pas configuré.`;
    return `${label} indisponibles pour le moment. Réessaie plus tard.`;
  }

  function showRoleFeedback(message, kind) {
    roleFeedback.textContent = message;
    roleFeedback.dataset.kind = kind;
    roleFeedback.hidden = false;
  }

  const ROLE_OPTIONS = [['', 'Aucun'], ['admin', 'admin'], ['owner', 'owner']];
  function roleCell(user) {
    if (callerRole !== 'owner') {
      return user.role ? `<span class="admin-role-tag" data-role="${escapeHtml(user.role)}">${escapeHtml(user.role)}</span>` : '—';
    }
    const options = ROLE_OPTIONS.map(([value, label]) => `<option value="${value}" ${((user.role || '') === value) ? 'selected' : ''}>${label}</option>`).join('');
    return `<select class="admin-role-select" data-user-id="${escapeHtml(user.user_id)}" data-email="${escapeHtml(user.email || user.user_id)}" data-previous="${escapeHtml(user.role || '')}">${options}</select>`;
  }

  // A role change is security-sensitive and not easily undone from this
  // screen (revoking the last owner is blocked server-side, but revoking or
  // granting any other role takes effect immediately) — so every change
  // asks for an explicit confirmation naming the account and the exact role
  // before the request is sent. Declining reverts the dropdown with no
  // network call at all, same as a server refusal.
  async function onRoleChange(event) {
    const select = event.target;
    const userId = select.dataset.userId;
    const email = select.dataset.email || userId;
    const previous = select.dataset.previous;
    const nextRole = select.value;
    const confirmMessage = nextRole
      ? `Attribuer le rôle "${nextRole}" à ${email} ?`
      : `Retirer le rôle administrateur de ${email} ? Ce compte perdra immédiatement l’accès au back-office.`;
    if (!window.confirm(confirmMessage)) {
      select.value = previous;
      return;
    }
    roleFeedback.hidden = true;
    const result = nextRole
      ? await window.DDABFF.assignAdminRole(userId, nextRole)
      : await window.DDABFF.revokeAdminRole(userId);
    if (!result.enabled) return;
    if (result.status === 200 || result.status === 204) {
      select.dataset.previous = nextRole;
      showRoleFeedback(nextRole ? `Rôle "${nextRole}" attribué.` : 'Rôle retiré.', 'success');
      return;
    }
    select.value = previous; // server refused — the dropdown must not show a role that was never actually granted
    const messages = {
      403: 'Seul un owner peut modifier les rôles.',
      409: 'Impossible de retirer le dernier owner restant.',
      400: 'Rôle invalide.'
    };
    showRoleFeedback(messages[result.status] || 'La modification a échoué.', 'error');
  }

  async function loadUsers(page) {
    usersState.page = page;
    let result;
    try {
      result = await window.DDABFF.getAdminUsers({ page, perPage: usersState.perPage });
    } catch {
      usersState.loaded = true;
      setDataFeedback('admin-users-feedback', 'Utilisateurs indisponibles pour le moment. Réessaie plus tard.');
      return;
    }
    usersState.loaded = true;
    if (result.status !== 200) {
      setDataFeedback('admin-users-feedback', apiDataError(result.status, 'Utilisateurs'));
      return;
    }
    setDataFeedback('admin-users-feedback', '');
    const { users, total } = result.data;
    usersState.lastUsers = users;
    users.forEach(user => { if (user.user_id && user.email) knownEmailsById.set(user.user_id, user.email); });
    const body = document.getElementById('admin-users-body');
    body.innerHTML = users.map(user => `
      <tr>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.display_name) || '—'}</td>
        <td><span class="admin-status-tag" data-status="${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
        <td>${roleCell(user)}</td>
        <td>${escapeHtml(user.ref) || '—'}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>${formatDate(user.last_sign_in_at)}</td>
        <td><button class="text-action" type="button" data-progress-user-id="${escapeHtml(user.user_id)}" data-progress-email="${escapeHtml(user.email || user.user_id)}">Voir</button></td>
        <td><button class="text-action" type="button" data-entitlements-user-id="${escapeHtml(user.user_id)}" data-entitlements-email="${escapeHtml(user.email || user.user_id)}">Gérer</button></td>
      </tr>`).join('') || `<tr><td colspan="9">Aucun utilisateur.</td></tr>`;
    body.querySelectorAll('.admin-role-select').forEach(select => select.addEventListener('change', onRoleChange));
    body.querySelectorAll('[data-progress-user-id]').forEach(button => button.addEventListener('click', () => {
      document.getElementById('admin-nav-progress').hidden = false;
      document.getElementById('admin-nav-progress-mobile').hidden = false;
      showAdminView('progress');
      loadProgress(button.dataset.progressUserId, button.dataset.progressEmail);
    }));
    body.querySelectorAll('[data-entitlements-user-id]').forEach(button => button.addEventListener('click', () => {
      document.getElementById('admin-nav-entitlements').hidden = false;
      document.getElementById('admin-nav-entitlements-mobile').hidden = false;
      showAdminView('entitlements');
      loadEntitlements(button.dataset.entitlementsUserId, button.dataset.entitlementsEmail);
    }));
    document.getElementById('admin-users-page-label').textContent = total != null ? `Page ${page} · ${total} au total` : `Page ${page}`;
    document.getElementById('admin-users-prev').disabled = page <= 1;
    document.getElementById('admin-users-next').disabled = users.length < usersState.perPage;
  }
  document.getElementById('admin-users-prev').addEventListener('click', () => { if (usersState.page > 1) loadUsers(usersState.page - 1); });
  document.getElementById('admin-users-next').addEventListener('click', () => loadUsers(usersState.page + 1));

  // CSV export of the currently loaded page only — the admin API is paged
  // and this stays a client-side convenience, not a new server endpoint.
  function csvCell(value) {
    const text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }
  document.getElementById('admin-users-export')?.addEventListener('click', () => {
    const rows = usersState.lastUsers || [];
    const header = ['email', 'display_name', 'status', 'role', 'ref', 'created_at', 'last_sign_in_at'];
    const lines = [header.join(',')].concat(rows.map(user => header.map(key => csvCell(user[key])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dda-utilisateurs-page-${usersState.page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // ---------- Memberships ----------
  const membershipsState = { page: 1, perPage: 20, loaded: false };
  async function loadMemberships(page) {
    membershipsState.page = page;
    let result;
    try {
      result = await window.DDABFF.getAdminMemberships({ page, perPage: membershipsState.perPage });
    } catch {
      membershipsState.loaded = true;
      setDataFeedback('admin-memberships-feedback', 'Abonnements indisponibles pour le moment. Réessaie plus tard.');
      return;
    }
    membershipsState.loaded = true;
    if (result.status !== 200) {
      setDataFeedback('admin-memberships-feedback', apiDataError(result.status, 'Abonnements'));
      return;
    }
    setDataFeedback('admin-memberships-feedback', '');
    const items = result.data.items || [];
    document.getElementById('admin-memberships-body').innerHTML = items.map(item => `
      <tr>
        <td>${escapeHtml(knownEmailsById.get(item.user_id) || item.user_id)}</td>
        <td>${escapeHtml(item.provider)}</td>
        <td><span class="admin-status-tag" data-status="${escapeHtml(item.status)}">${escapeHtml(item.status)}</span></td>
        <td>${escapeHtml(item.product_id) || '—'}</td>
        <td>${formatDate(item.starts_at)}</td>
        <td>${formatDate(item.ends_at)}</td>
        <td>${formatDate(item.updated_at)}</td>
      </tr>`).join('') || `<tr><td colspan="7">Aucun abonnement.</td></tr>`;
    // The memberships route reports no total (see bff/src/app.js) — "Suivant"
    // is enabled based on a full page coming back, never a guessed count.
    document.getElementById('admin-memberships-page-label').textContent = `Page ${page}`;
    document.getElementById('admin-memberships-prev').disabled = page <= 1;
    document.getElementById('admin-memberships-next').disabled = items.length < membershipsState.perPage;
  }
  document.getElementById('admin-memberships-prev').addEventListener('click', () => { if (membershipsState.page > 1) loadMemberships(membershipsState.page - 1); });
  document.getElementById('admin-memberships-next').addEventListener('click', () => loadMemberships(membershipsState.page + 1));

  // ---------- Content (read-only) ----------
  // There is no server endpoint for "what modules/lessons exist" — the
  // curriculum is static front-end data (LESSON_REGISTRY in dist/app.js).
  // Rather than hand-copy that registry into a second, parallel list here
  // (the exact duplication LESSON_REGISTRY's own header comment says it was
  // built to end), this reads dist/manus-routes.json: the single public
  // route manifest the site already keeps in sync with every published
  // page (tests/test_public_autonomous_pages.js, test_legacy_public_aliases
  // _contract.js), filtered to the lesson/module/premium routes. It is a
  // same-origin static file fetch, not a BFF call, so it renders even if
  // the admin API is degraded, and it carries no learner data — only the
  // public titles already served to every visitor.
  // Deliberately only Title + Route here: the manifest carries no
  // entitlement tier, and guessing one from the title string (e.g. "LAB4
  // (Premium)") would be unreliable for routes that don't spell it out
  // (P2.2 is premium_track in LESSON_REGISTRY but its title doesn't say so)
  // — an admin screen must never show a tier it cannot actually verify.
  const contentState = { loaded: false };
  const CONTENT_PATH_PATTERN = /#(lesson|premium-track|premium-lab|premium-assessment)/i;
  async function loadContent() {
    contentState.loaded = true;
    const body = document.getElementById('admin-content-body');
    try {
      const response = await fetch('manus-routes.json', { credentials: 'omit' });
      if (!response.ok) throw new Error(`manus-routes.json ${response.status}`);
      const manifest = await response.json();
      const rows = (manifest.routes || []).filter(route => CONTENT_PATH_PATTERN.test(route.path));
      body.innerHTML = rows.map(route => `
      <tr>
        <td>${escapeHtml(route.title)}</td>
        <td>${escapeHtml(route.path)}</td>
      </tr>`).join('') || `<tr><td colspan="2">Aucun contenu publié trouvé.</td></tr>`;
    } catch (error) {
      body.innerHTML = `<tr><td colspan="2">Liste du contenu indisponible (${escapeHtml(error.message)}).</td></tr>`;
    }
  }

  // ---------- Resources (read-only, mirrors VIDEO_REGISTRY) ----------
  // Same pattern as loadContent() above: a same-origin static file fetch of
  // the real, already-published registry (dist/video-registry.json), kept
  // byte-for-byte in sync with dist/app.js's VIDEO_REGISTRY by
  // tests/test_video_registry_mirror_contract.js — never a hand-typed second
  // copy of what the Academy actually serves.
  const resourcesState = { loaded: false };
  async function loadResources() {
    resourcesState.loaded = true;
    const body = document.getElementById('admin-resources-body');
    try {
      const response = await fetch('video-registry.json', { credentials: 'omit' });
      if (!response.ok) throw new Error(`video-registry.json ${response.status}`);
      const videos = await response.json();
      body.innerHTML = videos.map(video => `
      <tr>
        <td>${escapeHtml(video.title)}</td>
        <td>${escapeHtml(video.module) || '—'}</td>
        <td>${escapeHtml(video.access)}</td>
        <td>${escapeHtml(video.status)}</td>
        <td><a href="${escapeHtml(video.url)}" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a></td>
      </tr>`).join('') || `<tr><td colspan="5">Aucune ressource publiée trouvée.</td></tr>`;
    } catch (error) {
      body.innerHTML = `<tr><td colspan="5">Liste des ressources indisponible (${escapeHtml(error.message)}).</td></tr>`;
    }
  }

  // ---------- Bibliothèque DDA (final pre-launch audit follow-up, 2026-11) ----------
  // Real CRUD against bff/src/premium-resources-store.js's catalogue — not
  // the read-only video mirror above. Reads are open to any admin; create/
  // publish/unpublish/delete are owner-only, enforced server-side
  // (bff/src/app.js's withAdmin + `role !== 'owner'` checks) — this UI just
  // reflects that by hiding the form and action buttons for a non-owner.
  async function loadLibrary() {
    setDataFeedback('admin-library-feedback', '');
    document.getElementById('admin-library-create-form').hidden = callerRole !== 'owner';
    const body = document.getElementById('admin-library-body');
    let result;
    try { result = await window.DDABFF.getAdminResources(); }
    catch { setDataFeedback('admin-library-feedback', 'Bibliothèque indisponible pour le moment. Réessaie plus tard.'); return; }
    if (result.status !== 200) { setDataFeedback('admin-library-feedback', apiDataError(result.status, 'Bibliothèque')); return; }
    const items = result.data.items || [];
    body.innerHTML = items.map(item => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.category)}</td>
        <td><span class="admin-status-tag" data-status="${item.membershipRequired === 'premium' ? 'suspended' : 'active'}">${item.membershipRequired === 'premium' ? 'Premium' : 'Free'}</span></td>
        <td>${escapeHtml(item.file)}</td>
        <td><span class="admin-status-tag" data-status="${item.status === 'published' ? 'active' : 'suspended'}">${item.status === 'published' ? 'Publiée' : 'Brouillon'}</span></td>
        <td>${formatDate(item.updated_at)}</td>
        <td>${callerRole === 'owner' ? `<button class="text-action" type="button" data-library-toggle="${escapeHtml(item.id)}" data-library-status="${escapeHtml(item.status)}">${item.status === 'published' ? 'Dépublier' : 'Publier'}</button> <button class="text-action" type="button" data-library-delete="${escapeHtml(item.id)}">Supprimer</button>` : ''}</td>
      </tr>`).join('') || `<tr><td colspan="7">Aucune ressource dans la bibliothèque pour le moment.</td></tr>`;
    body.querySelectorAll('[data-library-toggle]').forEach(button => button.addEventListener('click', async () => {
      const nextStatus = button.dataset.libraryStatus === 'published' ? 'draft' : 'published';
      setDataFeedback('admin-library-feedback', '');
      const result = await window.DDABFF.updateAdminResource(button.dataset.libraryToggle, { status: nextStatus });
      if (!result.enabled) return;
      if (result.status === 200) { loadLibrary(); return; }
      setDataFeedback('admin-library-feedback', result.status === 403 ? 'Seul un owner peut publier ou dépublier une ressource.' : 'La mise à jour a échoué.');
    }));
    body.querySelectorAll('[data-library-delete]').forEach(button => button.addEventListener('click', async () => {
      if (!window.confirm('Supprimer définitivement cette ressource de la bibliothèque ?')) return;
      setDataFeedback('admin-library-feedback', '');
      const result = await window.DDABFF.deleteAdminResource(button.dataset.libraryDelete);
      if (!result.enabled) return;
      if (result.status === 204) { loadLibrary(); return; }
      setDataFeedback('admin-library-feedback', result.status === 403 ? 'Seul un owner peut supprimer une ressource.' : 'La suppression a échoué.');
    }));
  }
  document.getElementById('admin-library-create-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = {
      name: document.getElementById('admin-library-name').value.trim(),
      description: document.getElementById('admin-library-description').value.trim(),
      category: document.getElementById('admin-library-category').value.trim(),
      level: document.getElementById('admin-library-level').value.trim(),
      membershipRequired: document.getElementById('admin-library-membership').value,
      type: document.getElementById('admin-library-type').value.trim() || 'pdf',
      file: document.getElementById('admin-library-file').value.trim()
    };
    setDataFeedback('admin-library-feedback', '');
    const result = await window.DDABFF.createAdminResource(payload);
    if (!result.enabled) return;
    if (result.status === 200) {
      event.target.reset();
      document.getElementById('admin-library-type').value = 'pdf';
      loadLibrary();
      return;
    }
    const messages = { 400: `Champ invalide : ${result.data?.message || 'vérifie le formulaire.'}`, 403: 'Seul un owner peut ajouter une ressource.' };
    setDataFeedback('admin-library-feedback', messages[result.status] || 'La création a échoué.');
  });

  // ---------- Progression (one real learner at a time) ----------
  // Reads the exact same rows the learner's own GET /v1/progress exposes to
  // them (bff/src/app.js, dda-admin-progress-v1) — reached only from a
  // specific row in Utilisateurs, never a standalone "all learners" list,
  // because the server has no such aggregate query to honestly back one.
  async function loadProgress(userId, email) {
    document.getElementById('admin-progress-subject').textContent = `Progression de ${email}`;
    setDataFeedback('admin-progress-feedback', '');
    const body = document.getElementById('admin-progress-body');
    body.innerHTML = '';
    let result;
    try {
      result = await window.DDABFF.getAdminProgress(userId);
    } catch {
      setDataFeedback('admin-progress-feedback', 'Progression indisponible pour le moment. Réessaie plus tard.');
      return;
    }
    if (result.status !== 200) {
      setDataFeedback('admin-progress-feedback', apiDataError(result.status, 'Progression'));
      return;
    }
    const lessons = Object.entries(result.data.lessons || {});
    const check = value => value ? '✓' : '—';
    body.innerHTML = lessons.map(([lessonId, row]) => `
      <tr>
        <td>${escapeHtml(lessonId)}</td>
        <td>${check(row.lessonViewed)}</td>
        <td>${check(row.exerciseComplete)}</td>
        <td>${check(row.quizComplete)}</td>
        <td>${formatDate(row.updatedAt)}</td>
      </tr>`).join('') || `<tr><td colspan="5">Aucune progression enregistrée pour ce compte.</td></tr>`;
  }

  // ---------- Entitlements (owner-granted, additive to real Chariow membership) ----------
  // GET/POST/PATCH /v1/admin/entitlements* (bff/src/app.js, entitlements-store.js):
  // owner-only mutation, CSRF-protected, mandatory audit-logged "reason". The
  // grant form only renders for an owner (mirrors roleCell's owner-gating),
  // because the server would 403 any admin attempt anyway — same reasoning
  // that already governs the role dropdown above.
  const entitlementsState = { userId: null, email: null };
  function entitlementStatusTag(status) {
    return `<span class="admin-status-tag" data-status="${escapeHtml(status)}">${escapeHtml(status)}</span>`;
  }
  async function loadEntitlements(userId, email) {
    entitlementsState.userId = userId;
    entitlementsState.email = email;
    document.getElementById('admin-entitlements-subject').textContent = `Entitlements de ${email}`;
    setDataFeedback('admin-entitlements-feedback', '');
    const body = document.getElementById('admin-entitlements-body');
    body.innerHTML = '';
    const form = document.getElementById('admin-entitlements-grant-form');
    form.hidden = callerRole !== 'owner';
    let result;
    try {
      result = await window.DDABFF.getAdminEntitlements(userId);
    } catch {
      setDataFeedback('admin-entitlements-feedback', 'Entitlements indisponibles pour le moment. Réessaie plus tard.');
      return;
    }
    if (result.status !== 200) {
      setDataFeedback('admin-entitlements-feedback', apiDataError(result.status, 'Entitlements'));
      return;
    }
    renderEntitlementsBody(result.data.grants || []);
  }
  function renderEntitlementsBody(entitlements) {
    const body = document.getElementById('admin-entitlements-body');
    body.innerHTML = entitlements.map(row => `
      <tr>
        <td>${escapeHtml(row.entitlement_key)}</td>
        <td>${entitlementStatusTag(row.status)}</td>
        <td>${escapeHtml(row.granted_by) || '—'}</td>
        <td>${escapeHtml(row.reason) || '—'}</td>
        <td>${formatDate(row.expires_at)}</td>
        <td>${formatDate(row.updated_at)}</td>
        <td>${callerRole === 'owner' ? `<button class="text-action" type="button" data-entitlement-key="${escapeHtml(row.entitlement_key)}" data-entitlement-status="${escapeHtml(row.status)}">${row.status === 'active' ? 'Suspendre' : 'Réactiver'}</button>` : ''}</td>
      </tr>`).join('') || `<tr><td colspan="7">Aucun entitlement accordé à la main pour ce compte.</td></tr>`;
    body.querySelectorAll('[data-entitlement-key]').forEach(button => button.addEventListener('click', () => onEntitlementStatusToggle(button)));
  }
  async function onEntitlementStatusToggle(button) {
    const key = button.dataset.entitlementKey;
    const nextStatus = button.dataset.entitlementStatus === 'active' ? 'suspended' : 'active';
    const email = entitlementsState.email;
    const confirmMessage = nextStatus === 'suspended'
      ? `Suspendre l'entitlement "${key}" pour ${email} ?`
      : `Réactiver l'entitlement "${key}" pour ${email} ?`;
    if (!window.confirm(confirmMessage)) return;
    setDataFeedback('admin-entitlements-feedback', '');
    const result = await window.DDABFF.setAdminEntitlementStatus(entitlementsState.userId, key, nextStatus);
    if (!result.enabled) return;
    if (result.status === 200) {
      loadEntitlements(entitlementsState.userId, entitlementsState.email);
      return;
    }
    const messages = {
      403: 'Seul un owner peut modifier les entitlements.',
      404: 'Entitlement introuvable pour ce compte.',
      400: 'Statut invalide.'
    };
    setDataFeedback('admin-entitlements-feedback', messages[result.status] || 'La modification a échoué.');
  }
  document.getElementById('admin-entitlements-grant-form')?.addEventListener('submit', async event => {
    event.preventDefault();
    const key = document.getElementById('admin-entitlements-key').value;
    const reason = document.getElementById('admin-entitlements-reason').value.trim();
    const expiresAt = document.getElementById('admin-entitlements-expires').value || undefined;
    const email = entitlementsState.email;
    if (!reason) {
      setDataFeedback('admin-entitlements-feedback', 'La raison est obligatoire — elle est tracée dans l’audit.');
      return;
    }
    if (!window.confirm(`Accorder l'entitlement "${key}" à ${email} ?\nRaison : ${reason}`)) return;
    setDataFeedback('admin-entitlements-feedback', '');
    const result = await window.DDABFF.grantAdminEntitlement({ userId: entitlementsState.userId, entitlementKey: key, reason, expiresAt });
    if (!result.enabled) return;
    if (result.status === 200 || result.status === 201) {
      document.getElementById('admin-entitlements-reason').value = '';
      document.getElementById('admin-entitlements-expires').value = '';
      // loadEntitlements() clears this feedback element as soon as it starts
      // (same as every other load*() in this file) — await it first, then
      // show the success message, or it is wiped before anyone sees it.
      await loadEntitlements(entitlementsState.userId, entitlementsState.email);
      setDataFeedback('admin-entitlements-feedback', `Entitlement "${key}" accordé.`, 'success');
      return;
    }
    const messages = {
      403: 'Seul un owner peut accorder un entitlement.',
      400: 'Entitlement ou raison invalide.'
    };
    setDataFeedback('admin-entitlements-feedback', messages[result.status] || 'L’attribution a échoué.');
  });

  // ---------- Logout ----------
  document.getElementById('admin-logout')?.addEventListener('click', async () => {
    try { await window.DDABFF.logout(); } catch { /* best-effort — the session cookie may already be gone */ }
    window.location.href = 'academy.html#access';
  });

  // ---------- Boot: gate on the real server-derived role, never a client guess ----------
  (async function boot() {
    const networkState = document.getElementById('admin-network-state');
    if (!window.DDABFF || !window.DDABFF.enabled()) {
      networkState.classList.add('offline');
      showGate({
        title: 'Back-office non disponible ici.',
        description: 'Cet environnement n’est pas relié à un serveur DDA (aucun DDA_BFF_BASE_URL configuré) — le back-office a besoin du serveur pour vérifier qui est administrateur.'
      });
      return;
    }
    let result;
    try { result = await window.DDABFF.getAdminOverview(); }
    catch (error) {
      showGate({ title: 'Le back-office est momentanément indisponible.', description: 'La requête serveur a échoué. Réessaie dans un instant.' });
      return;
    }
    if (result.status === 401) {
      showGate({ title: 'Connecte-toi pour continuer.', description: 'Le back-office utilise la même session que l’Academy — connecte-toi d’abord.', actionText: 'Se connecter', actionHref: 'academy.html#access' });
      return;
    }
    if (result.status === 403) {
      showGate({ title: 'Accès réservé aux administrateurs.', description: 'Ce compte n’a pas de rôle administrateur DDA.' });
      return;
    }
    if (result.status === 503) {
      showGate({ title: 'Back-office non configuré côté serveur.', description: 'Le magasin de rôles administrateur n’est pas configuré sur ce serveur.' });
      return;
    }
    networkState.querySelector('span').textContent = `Connecté · ${result.data.caller.role}`;
    callerRole = result.data.caller.role;
    renderMetrics(result.data.metrics);
    showAdminView('overview');
    // Best-effort display only: if /v1/me fails for any reason, the chip
    // simply falls back to a generic "Administrateur" label — it never
    // blocks the back-office or retries into the role-mutation flow above.
    // getMe() returns the /v1/me body directly (or null), unlike the
    // {status, data} shape of the admin-only endpoints above.
    try { renderAdminProfileChip(callerRole, await window.DDABFF.getMe()); }
    catch { renderAdminProfileChip(callerRole, null); }
  })();
})();
