(function () {
  'use strict';

  // DDA back-office (admin). Read-only V1: the server exposes exactly three
  // admin routes today (GET /v1/admin/overview, /v1/admin/users,
  // /v1/admin/memberships) and no role-mutation route yet — so this screen
  // only ever reads. No action here can assign/revoke a role, ban a user or
  // change a membership; that stays server-side work for a later lot.
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
  const viewTitles = { overview: 'Aperçu', users: 'Utilisateurs', memberships: 'Abonnements' };

  function showAdminView(id) {
    views.forEach(view => view.classList.toggle('active', view.id === `admin-view-${id}`));
    navButtons.forEach(button => button.classList.toggle('active', button.dataset.adminView === id));
    contextTitle.textContent = viewTitles[id] || 'Back-office';
    if (id === 'users' && !usersState.loaded) loadUsers(1);
    if (id === 'memberships' && !membershipsState.loaded) loadMemberships(1);
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
  const usersState = { page: 1, perPage: 20, loaded: false };
  const roleFeedback = document.getElementById('admin-role-feedback');

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
    return `<select class="admin-role-select" data-user-id="${escapeHtml(user.user_id)}" data-previous="${escapeHtml(user.role || '')}">${options}</select>`;
  }

  async function onRoleChange(event) {
    const select = event.target;
    const userId = select.dataset.userId;
    const previous = select.dataset.previous;
    const nextRole = select.value;
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
    const result = await window.DDABFF.getAdminUsers({ page, perPage: usersState.perPage });
    usersState.loaded = true;
    if (result.status !== 200) return; // gate already shown at boot; nothing more to render
    const { users, total } = result.data;
    const body = document.getElementById('admin-users-body');
    body.innerHTML = users.map(user => `
      <tr>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.display_name) || '—'}</td>
        <td><span class="admin-status-tag" data-status="${escapeHtml(user.status)}">${escapeHtml(user.status)}</span></td>
        <td>${roleCell(user)}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>${formatDate(user.last_sign_in_at)}</td>
      </tr>`).join('') || `<tr><td colspan="6">Aucun utilisateur.</td></tr>`;
    body.querySelectorAll('.admin-role-select').forEach(select => select.addEventListener('change', onRoleChange));
    document.getElementById('admin-users-page-label').textContent = total != null ? `Page ${page} · ${total} au total` : `Page ${page}`;
    document.getElementById('admin-users-prev').disabled = page <= 1;
    document.getElementById('admin-users-next').disabled = users.length < usersState.perPage;
  }
  document.getElementById('admin-users-prev').addEventListener('click', () => { if (usersState.page > 1) loadUsers(usersState.page - 1); });
  document.getElementById('admin-users-next').addEventListener('click', () => loadUsers(usersState.page + 1));

  // ---------- Memberships ----------
  const membershipsState = { page: 1, perPage: 20, loaded: false };
  async function loadMemberships(page) {
    membershipsState.page = page;
    const result = await window.DDABFF.getAdminMemberships({ page, perPage: membershipsState.perPage });
    membershipsState.loaded = true;
    if (result.status !== 200) return;
    const items = result.data.items || [];
    document.getElementById('admin-memberships-body').innerHTML = items.map(item => `
      <tr>
        <td>${escapeHtml(item.user_id)}</td>
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
  })();
})();
