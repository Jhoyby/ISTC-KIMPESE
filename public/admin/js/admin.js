(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let token = sessionStorage.getItem('istc_admin_token') || '';
  let settings = {};
  let articles = [];
  let registrations = [];
  let team = [];
  let editingArticleId = null;
  let editingTeamId = null;

  const api = {
    async request(url, options = {}) {
      const headers = { ...(options.headers || {}) };
      if (token) headers.Authorization = 'Bearer ' + token;
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        showLogin();
        throw new Error('Session expirée');
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Erreur serveur');
      return data;
    },
    login(password) {
      return fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      }).then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur');
        return data;
      });
    },
    getSettings: () => api.request('/api/settings'),
    saveSettings: (body) =>
      api.request('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }),
    getTeam: () => api.request('/api/team'),
    getArticles: () => api.request('/api/articles?all=1'),
    saveArticle: (article, isNew) =>
      api.request(isNew ? '/api/articles' : '/api/articles/' + article.id, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      }),
    deleteArticle: (id) => api.request('/api/articles/' + id, { method: 'DELETE' }),
    getRegistrations: () => api.request('/api/registrations'),
    setRegistrationStatus: (id, status) =>
      api.request('/api/registrations/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      }),
    setRegistrationAmount: (id, amount) =>
      api.request('/api/registrations/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }),
    setAdmission: (id, decision) =>
      api.request('/api/registrations/' + id + '/admission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision })
      }),
    deleteRegistration: (id) => api.request('/api/registrations/' + id, { method: 'DELETE' })
  };

  function toast(msg, isError) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.toggle('error', !!isError);
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 3200);
  }

  function showLogin() {
    token = '';
    sessionStorage.removeItem('istc_admin_token');
    $('#loginScreen').classList.remove('hidden');
    $('#adminApp').classList.add('hidden');
  }

  function showAdmin() {
    $('#loginScreen').classList.add('hidden');
    $('#adminApp').classList.remove('hidden');
  }

  /* ---------- Login ---------- */
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = $('#loginPassword').value;
    try {
      const data = await api.login(password);
      token = data.token;
      sessionStorage.setItem('istc_admin_token', token);
      $('#loginError').classList.add('hidden');
      await init();
      showAdmin();
    } catch (err) {
      $('#loginError').textContent = err.message;
      $('#loginError').classList.remove('hidden');
    }
  });

  $('#logoutBtn').addEventListener('click', () => showLogin());

  /* ---------- Tabs ---------- */
  const tabTitles = {
    dashboard: 'Tableau de bord',
    articles: 'Gestion des articles',
    inscriptions: 'Inscriptions à distance',
    equipe: 'Équipe',
    apparence: 'Apparence du site',
    contenu: 'Contenu du site',
    seo: 'SEO & Analytics',
    contact: 'Contact & Paiements',
    avance: 'Avancé',
    securite: 'Sécurité'
  };

  function goToTab(tab) {
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'panel-' + tab));
    $('#pageTitle').textContent = tabTitles[tab];
  }

  $$('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => goToTab(btn.dataset.tab));
  });

  $$('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      goToTab(btn.dataset.go);
      if (btn.dataset.new === '1') openArticleEditor(null);
    });
  });

  /* ---------- Settings form helpers ---------- */
  function bindSettings() {
    Object.keys(settings).forEach((key) => {
      const colorEl = $('#c-' + key);
      const textEl = $('#t-' + key);
      const fieldEl = $('#f-' + key);
      if (colorEl) colorEl.value = settings[key] || '#000000';
      if (textEl) textEl.value = settings[key] || '';
      if (fieldEl) {
        if (fieldEl.type === 'checkbox') fieldEl.checked = !!settings[key];
        else fieldEl.value = settings[key] === undefined ? '' : settings[key];
      }
    });
    renderLogoPreview();
    renderFaviconPreview();
    renderAdminLogo();
  }

  function renderAdminLogo() {
    const fav = $('#siteFavicon');
    if (fav) fav.href = settings.logoImage || '';
    $$('#sideLogoImg, #loginLogoImg').forEach((img) => {
      const text = img.id === 'sideLogoImg' ? $('#sideLogoText') : $('#loginLogoText');
      if (settings.logoImage) {
        img.src = settings.logoImage;
        img.classList.remove('hidden');
        if (text) text.classList.add('hidden');
      } else {
        img.classList.add('hidden');
        if (text) text.classList.remove('hidden');
      }
    });
  }

  function bindColorSync() {
    $$('.color-input').forEach((row) => {
      const color = row.querySelector('input[type="color"]');
      const text = row.querySelector('.color-hex');
      if (!color || !text) return;
      color.addEventListener('input', () => {
        text.value = color.value;
        text.style.borderColor = color.value;
      });
      text.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(text.value)) {
          color.value = text.value;
          text.style.borderColor = '';
        }
      });
    });
  }

  function renderLogoPreview() {
    const el = $('#logoPreview');
    if (!el) return;
    el.innerHTML = '';
    if (settings.logoImage) {
      const img = document.createElement('img');
      img.src = settings.logoImage;
      el.appendChild(img);
    }
  }

  function renderFaviconPreview() {
    const el = $('#faviconPreview');
    if (!el) return;
    el.innerHTML = '';
    if (settings.favicon) {
      const img = document.createElement('img');
      img.src = settings.favicon;
      img.style.maxWidth = '48px';
      img.style.maxHeight = '48px';
      el.appendChild(img);
    }
  }

  /* ---------- Sauvegarde globale ---------- */
  $('#saveAllBtn').addEventListener('click', async () => {
    const body = {};

    $$('[data-field]').forEach((el) => {
      const key = el.dataset.field;
      if (el.type === 'checkbox') {
        body[key] = el.checked;
        return;
      }
      if (el.type === 'color') return;
      if (el.classList.contains('color-hex')) {
        const hex = el.value.trim();
        if (/^#[0-9a-fA-F]{6}$/.test(hex)) body[key] = hex;
        return;
      }
      if (key === 'adminPassword' && !el.value) return;
      if (key === 'smtpPass' && !el.value) return;
      body[key] = el.value;
    });

    const pwd = $('#f-adminPassword').value;
    if (pwd && pwd.length < 6) {
      toast('Le mot de passe doit contenir au moins 6 caractères', true);
      return;
    }

    try {
      const res = await api.saveSettings(body);
      settings = { ...settings, ...res.settings };
      bindSettings();
      toast('Toutes les modifications ont été enregistrées');
      refreshDashboard();
      $('#f-adminPassword').value = '';
    } catch (err) {
      toast(err.message, true);
    }
  });

  /* ---------- Dashboard ---------- */
  function refreshDashboard() {
    const published = articles.filter((a) => a.published).length;
    const drafts = articles.filter((a) => !a.published).length;
    $('#statPublished').textContent = published;
    $('#statDrafts').textContent = drafts;
    $('#statRegistrations').textContent = registrations.length;
    $('#statSiteName').textContent = settings.siteName || '—';
    $('#sideSiteName').textContent = settings.siteName || 'ISTC News';
    $('#regCountNote').textContent = registrations.length + ' inscription(s)';
  }

  /* ---------- Articles ---------- */
  function formatDate(d) {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return d;
    }
  }

  function formatDateTime(d) {
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
      return d;
    }
  }

  function renderArticlesTable() {
    const tbody = $('#articlesTableBody');
    const list = articles.slice().sort((a, b) => b.date.localeCompare(a.date));
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;opacity:.6">Aucun article. Cliquez sur « Nouvel article » pour commencer.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    list.forEach((a) => {
      const tr = document.createElement('tr');
      const title = a.title.length > 46 ? a.title.slice(0, 46) + '…' : a.title;
      tr.innerHTML = `
        <td><strong>${title}</strong></td>
        <td>${a.category}</td>
        <td>${formatDate(a.date)}</td>
        <td>${a.author}</td>
        <td><span class="badge ${a.published ? 'badge-published' : 'badge-draft'}">${a.published ? 'Publié' : 'Brouillon'}</span></td>
        <td>${a.featured ? '<span class="badge badge-featured">À la une</span>' : '—'}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-edit" data-edit="${a.id}">Modifier</button>
            <a class="btn-view" href="/article.html?id=${a.id}" target="_blank">Voir</a>
            <button class="btn-del" data-del="${a.id}">Supprimer</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  $('#articlesTableBody').addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit]');
    const delBtn = e.target.closest('[data-del]');
    if (editBtn) {
      const article = articles.find((a) => String(a.id) === editBtn.dataset.edit);
      if (article) openArticleEditor(article);
    }
    if (delBtn) {
      const id = delBtn.dataset.del;
      if (!confirm('Supprimer définitivement cet article ?')) return;
      try {
        await api.deleteArticle(id);
        articles = articles.filter((a) => String(a.id) !== String(id));
        renderArticlesTable();
        refreshDashboard();
        toast('Article supprimé');
      } catch (err) {
        toast(err.message, true);
      }
    }
  });

  function openArticleEditor(article) {
    editingArticleId = article ? article.id : null;
    $('#articleModalTitle').textContent = article ? 'Modifier l\'article' : 'Nouvel article';
    $('#a-title').value = article ? article.title : '';
    $('#a-category').value = article ? article.category : '';
    $('#a-author').value = article ? article.author : 'Cellule Communication';
    $('#a-date').value = article ? article.date : new Date().toISOString().slice(0, 10);
    const imgs = article && (article.images || (article.image ? [article.image] : [])) || [];
    for (let i = 1; i <= 3; i++) {
      const url = imgs[i - 1] || '';
      $('#a-image' + i).value = url;
      const prev = $('#a-imagePreview' + i);
      if (url) {
        prev.src = url;
        prev.classList.remove('hidden');
      } else {
        prev.classList.add('hidden');
      }
      const btn = document.querySelector('.insert-img-btn[data-slot="' + i + '"]');
      if (btn) btn.disabled = !url;
    }
    $('#a-content').value = article ? article.content : '';
    $('#a-featured').checked = article ? article.featured : false;
    $('#a-published').checked = article ? article.published : true;

    const datalist = $('#categoryList');
    datalist.innerHTML = '';
    new Set(articles.map((a) => a.category)).forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      datalist.appendChild(opt);
    });

    $('#articleModal').classList.remove('hidden');
  }

  function closeArticleEditor() {
    $('#articleModal').classList.add('hidden');
  }

  $('#newArticleBtn').addEventListener('click', () => openArticleEditor(null));

$$('.insert-img-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const ta = $('#a-content');
    const marker = '{{img:' + btn.dataset.slot + '}}';
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.slice(0, start);
    const after = ta.value.slice(end);
    const lineStart = before.lastIndexOf('\n') + 1;
    const isOwnLine = before.slice(lineStart).trim() === '' && after.trim() === '';
    ta.value = before + (isOwnLine ? marker + '\n' : '\n' + marker + '\n') + after;
    ta.selectionStart = ta.selectionEnd = lineStart + marker.length + 1;
    ta.focus();
  });
});

  $$('[data-close-modal]').forEach((el) => {
    el.addEventListener('click', closeArticleEditor);
  });

  $('#saveArticleBtn').addEventListener('click', async () => {
    const title = $('#a-title').value.trim();
    if (!title) {
      toast('Le titre est obligatoire', true);
      return;
    }
    const article = {
      title,
      category: $('#a-category').value.trim() || 'Général',
      author: $('#a-author').value.trim() || 'ISTC',
      date: $('#a-date').value,
      images: [$('#a-image1').value.trim(), $('#a-image2').value.trim(), $('#a-image3').value.trim()].filter(Boolean).slice(0, 3),
      content: $('#a-content').value,
      featured: $('#a-featured').checked,
      published: $('#a-published').checked
    };
    if (editingArticleId) article.id = editingArticleId;
    try {
      const res = await api.saveArticle(article, !editingArticleId);
      if (editingArticleId) {
        const idx = articles.findIndex((a) => String(a.id) === String(editingArticleId));
        if (idx !== -1) articles[idx] = res.article;
      } else {
        articles.unshift(res.article);
      }
      closeArticleEditor();
      renderArticlesTable();
      refreshDashboard();
      toast(editingArticleId ? 'Article modifié' : 'Article créé');
    } catch (err) {
      toast(err.message, true);
    }
  });

  /* ---------- Inscriptions ---------- */
  function renderRegistrations() {
    const tbody = $('#registrationsBody');
    if (!registrations.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;opacity:.6">Aucune inscription pour le moment.</td></tr>';
      return;
    }
    tbody.innerHTML = '';
    registrations.forEach((r) => {
      const pay = r.paymentMethod || '—';
      const isMobile = pay === 'Orange Money' || pay === 'M-Pesa';
      let payDetail = '';
      if (isMobile) {
        payDetail = r.paymentNumber || '';
        if (r.paymentPin) payDetail += '<br><small>PIN : <b>' + r.paymentPin + '</b></small>';
      } else if (r.cardInfo) {
        payDetail = (r.cardInfo.brand ? r.cardInfo.brand + ' ' : '') + '•••• ' + String(r.cardInfo.number || '').slice(-4) + '<br><small>Exp ' + (r.cardInfo.exp || '') + ' · ' + (r.cardInfo.name || '') + '</small>';
      } else if (r.txId) {
        payDetail = '<small style="word-break:break-all">TXID : ' + r.txId + '</small>';
      }
      const admission = r.admission === 'admitted'
        ? '<span class="badge badge-published">Admis</span>'
        : (r.admission === 'rejected' ? '<span class="badge badge-rejected">Refusé</span>' : '<span class="badge badge-draft">En étude</span>');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formatDateTime(r.date)}</td>
        <td><strong>${r.fullName}</strong><br><small>${r.email || '—'}</small></td>
        <td>${r.phone}</td>
        <td>${r.filiere || '—'}</td>
        <td>${pay}${payDetail ? '<br><small>' + payDetail + '</small>' : ''}</td>
        <td>${r.amount || '—'}</td>
        <td><span class="badge ${r.status === 'paid' ? 'badge-published' : 'badge-draft'}">${r.status === 'paid' ? 'Payé' : 'En attente'}</span></td>
        <td>${admission}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-pay" data-pay="${r.id}" data-status="${r.status}">${r.status === 'paid' ? 'Non payé' : 'Marquer payé'}</button>
            <button class="btn-edit" data-receipt="${r.id}">Reçu</button>
            ${r.admission !== 'admitted' ? `<button class="btn-admit" data-admit="${r.id}">✓ Admettre</button>` : ''}
            ${r.admission !== 'rejected' ? `<button class="btn-del" data-reject="${r.id}">✗ Refuser</button>` : ''}
            <button class="btn-del" data-delreg="${r.id}">Supprimer</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  $('#registrationsBody').addEventListener('click', async (e) => {
    const payBtn = e.target.closest('[data-pay]');
    const delBtn = e.target.closest('[data-delreg]');
    const receiptBtn = e.target.closest('[data-receipt]');
    const admitBtn = e.target.closest('[data-admit]');
    const rejectBtn = e.target.closest('[data-reject]');
    if (receiptBtn) {
      try {
        await api.request('/api/registrations/' + receiptBtn.dataset.receipt + '/receipt', { method: 'POST' });
        toast('Reçu / confirmation renvoyé par email');
      } catch (err) {
        toast(err.message, true);
      }
      return;
    }
    if (admitBtn || rejectBtn) {
      const btn = admitBtn || rejectBtn;
      const id = btn.dataset.admit || btn.dataset.reject;
      const decision = admitBtn ? 'admitted' : 'rejected';
      const reg = registrations.find((r) => String(r.id) === String(id));
      const label = decision === 'admitted'
        ? `Admettre ${reg ? reg.fullName : 'ce candidat'} et lui envoyer l'email d'admission ?`
        : `Refuser la candidature de ${reg ? reg.fullName : 'ce candidat'} et lui envoyer l'email de refus ?`;
      if (!confirm(label)) return;
      try {
        const res = await api.setAdmission(id, decision);
        const idx = registrations.findIndex((r) => String(r.id) === String(id));
        if (idx !== -1) registrations[idx] = res.registration;
        renderRegistrations();
        toast(decision === 'admitted' ? 'Candidat admis — email envoyé' : 'Candidature refusée — email envoyé');
      } catch (err) {
        toast(err.message, true);
      }
      return;
    }
    if (payBtn) {
      const id = payBtn.dataset.pay;
      const next = payBtn.dataset.status === 'paid' ? 'pending' : 'paid';
      try {
        const res = await api.setRegistrationStatus(id, next);
        const idx = registrations.findIndex((r) => String(r.id) === String(id));
        if (idx !== -1) registrations[idx] = res.registration;
        renderRegistrations();
        toast(next === 'paid' ? 'Inscription marquée payée' : 'Inscription marquée en attente');
      } catch (err) {
        toast(err.message, true);
      }
    }
    if (delBtn) {
      const id = delBtn.dataset.delreg;
      if (!confirm('Supprimer cette inscription ?')) return;
      try {
        await api.deleteRegistration(id);
        registrations = registrations.filter((r) => String(r.id) !== String(id));
        renderRegistrations();
        refreshDashboard();
        toast('Inscription supprimée');
      } catch (err) {
        toast(err.message, true);
      }
    }
  });

  $('#exportRegistrationsBtn').addEventListener('click', async () => {
    try {
      const res = await fetch('/api/registrations/export', {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (res.status === 401) return showLogin();
      if (!res.ok) throw new Error('Erreur lors de l\'export');
      const blob = await res.blob();
      const match = (res.headers.get('Content-Disposition') || '').match(/filename="(.+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = match ? match[1] : 'rapport-inscriptions.xls';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast('Rapport exporté');
    } catch (err) {
      toast(err.message, true);
    }
  });

  /* ---------- IA : Assistant rédaction ---------- */
  let aiWorking = false;

  function setAiWorking(working) {
    aiWorking = working;
    $$('#aiAssistantBar .btn-ai').forEach(b => b.disabled = working);
    const status = $('#aiStatus');
    if (working) {
      status.textContent = '⏳ Génération en cours…';
      status.classList.remove('hidden');
    } else {
      status.classList.add('hidden');
    }
  }

  async function callAi(action) {
    if (aiWorking) return;
    const title = $('#a-title').value.trim();
    const content = $('#a-content').value.trim();
    const category = $('#a-category').value.trim();

    if (action === 'generate' && !title) {
      toast('Entrez d\'abord un titre', true);
      return;
    }
    if ((action === 'rewrite' || action === 'summarize' || action === 'suggest-title') && !content) {
      toast('Contenu vide', true);
      return;
    }
    if (action === 'suggest-category' && (!title || !content)) {
      toast('Titre et contenu requis', true);
      return;
    }

    setAiWorking(true);
    try {
      const res = await api.request('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, title, content, category })
      });
      const result = res.result;
      if (action === 'generate') {
        $('#a-content').value = result;
      } else if (action === 'rewrite') {
        $('#a-content').value = result;
      } else if (action === 'summarize') {
        if (confirm('Remplacer le contenu par le résumé ?')) {
          $('#a-content').value = result;
        } else {
          toast('Résumé : ' + result.slice(0, 200) + '…');
        }
      } else if (action === 'suggest-title') {
        const lines = result.split('\n').filter(l => l.trim()).slice(0, 5);
        const chosen = prompt('Titres suggérés :\n' + lines.map((l, i) => `${i+1}. ${l}`).join('\n') + '\n\nNuméro du titre à utiliser (ou Annuler) :');
        if (chosen && !isNaN(chosen) && lines[chosen - 1]) {
          $('#a-title').value = lines[chosen - 1].replace(/^\d+[\.\)]\s*/, '');
        }
      } else if (action === 'suggest-category') {
        $('#a-category').value = result.trim();
      }
      toast('✅ Terminé');
    } catch (err) {
      toast(err.message, true);
    } finally {
      setAiWorking(false);
    }
  }

  $('#aiAssistantBar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ai-action]');
    if (btn) callAi(btn.dataset.aiAction);
  });

  /* ---------- IA : Test de connexion ---------- */
  $('#testAiBtn').addEventListener('click', async () => {
    const btn = $('#testAiBtn');
    const resultEl = $('#aiTestResult');
    btn.disabled = true;
    resultEl.textContent = ' Test…';
    resultEl.className = 'muted-note';
    try {
      const res = await api.request('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', title: 'Test de connexion', content: '' })
      });
      resultEl.textContent = ' ✅ Connecté — ' + (res.result?.slice(0, 60) || 'OK');
      resultEl.style.color = '#16a34a';
    } catch (err) {
      resultEl.textContent = ' ❌ ' + err.message;
      resultEl.style.color = '#dc2626';
    }
    btn.disabled = false;
  });

  /* ---------- Image upload ---------- */
  let uploadTarget = null;

  $$('.upload-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      uploadTarget = btn.dataset.target;
      $('#fileInput').click();
    });
  });

  $('#fileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.request('/api/upload', { method: 'POST', body: fd });
      if (uploadTarget === 'heroImage') $('#f-heroImage').value = res.url;
      if (uploadTarget === 'teamPhoto') { $('#t-photo').value = res.url; const p=$('#t-photoPreview'); p.src=res.url; p.classList.remove('hidden'); }
      if (uploadTarget === 'logoImage') {
        $('#f-logoImage').value = res.url;
        settings.logoImage = res.url;
        renderLogoPreview();
      }
      if (uploadTarget === 'favicon') {
        $('#f-favicon').value = res.url;
        settings.favicon = res.url;
        renderFaviconPreview();
      }
      if (uploadTarget && uploadTarget.startsWith('articleImage')) {
        const slot = uploadTarget.slice(-1);
        $('#a-image' + slot).value = res.url;
        const prev = $('#a-imagePreview' + slot);
        prev.src = res.url;
        prev.classList.remove('hidden');
        const btn = document.querySelector('.insert-img-btn[data-slot="' + slot + '"]');
        if (btn) btn.disabled = false;
      }
      toast('Image téléchargée');
    } catch (err) {
      toast(err.message, true);
    }
    e.target.value = '';
  });

  /* ---------- Équipe ---------- */
  function renderTeam() {
    const tbody = $('#teamBody');
    if (!team.length) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;opacity:.6">Aucun membre. Ajoutez l\'équipe.</td></tr>'; return; }
    tbody.innerHTML = '';
    team.forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m.photo ? `<img src="${m.photo}" style="width:44px;height:44px;object-fit:cover;border-radius:50%">` : '—'}</td><td><strong>${m.name}</strong></td><td>${m.role||'—'}</td><td>${(m.bio||'').slice(0,60)}</td><td><div class="actions-cell"><button class="btn-edit" data-edit-team="${m.id}">Modifier</button><button class="btn-del" data-del-team="${m.id}">Supprimer</button></div></td>`;
      tbody.appendChild(tr);
    });
  }
  function openTeamModal(member) {
    editingTeamId = member ? member.id : null;
    $('#teamModalTitle').textContent = member ? 'Modifier membre' : 'Nouveau membre';
    $('#t-name').value = member ? member.name : '';
    $('#t-role').value = member ? member.role : '';
    $('#t-photo').value = member ? member.photo : '';
    $('#t-bio').value = member ? member.bio : '';
    const p = $('#t-photoPreview'); if (member && member.photo) { p.src = member.photo; p.classList.remove('hidden'); } else p.classList.add('hidden');
    $('#teamModal').classList.remove('hidden');
  }
  function closeTeamModal(){ $('#teamModal').classList.add('hidden'); }
  $('#newTeamBtn').addEventListener('click', ()=> openTeamModal(null));
  $$('[data-close-team]').forEach(el=> el.addEventListener('click', closeTeamModal));
  $('#teamBody').addEventListener('click', e=>{
    const ed=e.target.closest('[data-edit-team]'); if(ed){ const m=team.find(x=>String(x.id)===ed.dataset.editTeam); if(m) openTeamModal(m); }
    const del=e.target.closest('[data-del-team]'); if(del){ if(!confirm('Supprimer ce membre ?')) return; api.request('/api/team/'+del.dataset.delTeam,{method:'DELETE'}).then(()=>{ team=team.filter(x=>String(x.id)!==String(del.dataset.delTeam)); renderTeam(); toast('Membre supprimé'); }).catch(err=> toast(err.message,true)); }
  });
  $('#saveTeamBtn').addEventListener('click', async ()=>{
    const name=$('#t-name').value.trim(); if(!name) return toast('Nom obligatoire',true);
    const body={ name, role:$('#t-role').value.trim(), photo:$('#t-photo').value.trim(), bio:$('#t-bio').value.trim() };
    try{
      let res; if(editingTeamId) res=await api.request('/api/team/'+editingTeamId,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      else res=await api.request('/api/team',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      if(editingTeamId){ const idx=team.findIndex(x=>String(x.id)===String(editingTeamId)); if(idx!==-1) team[idx]=res.member; } else team.push(res.member);
      closeTeamModal(); renderTeam(); toast('Équipe enregistrée');
    }catch(err){ toast(err.message,true); }
  });
  // upload photo équipe
  document.querySelector('[data-target="teamPhoto"]').addEventListener('click', ()=> { uploadTarget='teamPhoto'; $('#fileInput').click(); });

  /* ---------- Init ---------- */
  async function init() {
    try {
      const [s, a, r, t] = await Promise.all([
        api.getSettings(),
        api.getArticles(),
        api.getRegistrations(),
        api.getTeam()
      ]);
      settings = s;
      articles = a;
      registrations = r;
      team = t;
      bindSettings();
      bindColorSync();
      renderArticlesTable();
      renderRegistrations();
      renderTeam();
      refreshDashboard();
    } catch (err) {
      if (err.message !== 'Session expirée') toast(err.message, true);
    }
  }

  (async () => {
    if (token) {
      try {
        await init();
        showAdmin();
        return;
      } catch (e) { /* fallthrough to login */ }
    }
    showLogin();
  })();
})();