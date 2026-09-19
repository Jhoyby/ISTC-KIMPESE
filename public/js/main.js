(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let settings = {};
  let allArticles = [];
  let activeCategory = 'all';
  let visibleCount = 6;
  const PAGE_SIZE = 6;
  let currentTheme = 'light';
  let shareUrl = '';
  let shareTitle = '';

  const root = document.documentElement;

  /* ---------- Thème ---------- */
  function themeVars(s) {
    const dark = currentTheme === 'dark';
    return {
      '--primary': s.primaryColor || '#1a7a3c',
      '--secondary': s.secondaryColor || '#f5c518',
      '--text': dark ? '#e6edf3' : (s.textColor || '#16222e'),
      '--bg': dark ? '#0d1520' : (s.backgroundColor || '#f6f8fb'),
      '--header-bg': dark ? 'rgba(13, 21, 32, 0.92)' : (s.headerBackground || '#ffffff'),
      '--header-text': dark ? '#e6edf3' : (s.headerTextColor || '#16222e'),
      '--footer-bg': dark ? '#070d14' : (s.footerBackground || '#0d1f14'),
      '--footer-text': dark ? '#a9b8c6' : (s.footerTextColor || '#d7e3da'),
      '--card-bg': dark ? '#141f2d' : '#ffffff'
    };
  }

  function applyThemeColors() {
    try {
      for (const [k, v] of Object.entries(themeVars(settings))) root.style.setProperty(k, v);
    } catch (e) {}
  }

  function updateThemeIcon() {
    const btn = $('#themeToggle');
    if (btn) btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }

  function renderTheme() {
    const stored = null;
    try { stored = localStorage.getItem('istc_theme'); } catch (e) {}
    currentTheme = stored || settings.defaultTheme || 'light';
    root.setAttribute('data-theme', currentTheme);
    applyThemeColors();
    updateThemeIcon();
    if (settings.enableDarkMode === false) {
      const t = $('#themeToggle');
      if (t) t.classList.add('hidden');
    }
  }

  const themeBtn = $('#themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', currentTheme);
    try { localStorage.setItem('istc_theme', currentTheme); } catch (e) {}
    applyThemeColors();
    updateThemeIcon();
  });

  /* ---------- Date du jour façon ntemo ---------- */
  function renderDate() {
    const el = $('#currentDate');
    if (!el) return;
    try {
      const now = new Date();
      el.textContent = now.toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) {
      el.textContent = new Date().toDateString();
    }
  }

  /* ---------- Settings ---------- */
  function applySettings(s) {
    settings = s || {};
    applyThemeColors();

    const siteName = s.siteName || 'ISTC News';
    document.title = siteName + ' — Actualités officielles';
    const bn = $('#brandName'); if (bn) bn.textContent = siteName;
    const bfn = $('#brandFullName'); if (bfn) bfn.textContent = s.siteFullName || '';
    const fb = $('#footerBrand'); if (fb) fb.textContent = siteName;
    const ft = $('#footerTagline'); if (ft) ft.textContent = s.tagline || '';
    const cp = $('#copyright');
    if (cp) cp.textContent = `© ${new Date().getFullYear()} ${siteName}. Tous droits réservés.`;

    const fe = $('#footerEmail');
    if (fe) {
      const a = fe.querySelector('a');
      if (a && s.contactEmail) { a.textContent = s.contactEmail; a.href = 'mailto:' + s.contactEmail; }
      else if (a) { a.textContent = s.contactEmail || ''; }
    }
    const fp = $('#footerPhone');
    if (fp) {
      const a = fp.querySelector('a');
      if (a && s.contactPhone) { a.textContent = s.contactPhone; a.href = 'tel:' + s.contactPhone.replace(/\s/g, ''); }
    }
    const fa = $('#footerAddress');
    if (fa) {
      const sp = fa.querySelector('span:last-child');
      if (sp) sp.textContent = s.contactAddress || '';
    }

    renderLogo(s);
    renderTheme();
    renderHeaderSocial(s);
    renderSEO(s);
    renderAnalytics(s);
    renderCustomCSS(s);

    const annBar = $('#announcementBar');
    if (annBar) {
      if (s.showAnnouncement && s.announcement) {
        annBar.textContent = s.announcement;
        annBar.classList.remove('hidden');
      } else {
        annBar.classList.add('hidden');
      }
    }
  }

  function renderLogo(s) {
    const img = $('#brandMarkImg');
    const text = $('#brandMarkText');
    if (img && text) {
      if (s.logoImage) {
        img.src = s.logoImage;
        img.classList.remove('hidden');
        text.classList.add('hidden');
      } else {
        img.classList.add('hidden');
        text.classList.remove('hidden');
      }
    }
    const fav = $('#siteFavicon');
    if (fav) fav.href = s.favicon || s.logoImage || '/favicon.svg';
    const footerLogo = $('#footerLogo');
    if (footerLogo) {
      if (s.logoImage) {
        footerLogo.src = s.logoImage;
        footerLogo.classList.remove('hidden');
      } else {
        footerLogo.classList.add('hidden');
      }
    }
  }

  function renderSEO(s) {
    const setMeta = (sel, attr, val) => {
      if (!val) return;
      let m = document.querySelector(sel);
      if (!m) { m = document.createElement('meta'); document.head.appendChild(m);
        if (sel.includes('property')) m.setAttribute('property', sel.match(/property="([^"]+)"/)?.[1] || '');
        else m.setAttribute('name', sel.match(/name="([^"]+)"/)?.[1] || '');
      }
      m.content = val;
    };
    if (s.metaDescription) setMeta('meta[name="description"]', 0, s.metaDescription);
    if (s.metaKeywords) {
      let m = document.querySelector('meta[name="keywords"]');
      if (!m) { m = document.createElement('meta'); m.name = 'keywords'; document.head.appendChild(m); }
      m.content = s.metaKeywords;
    }
    if (s.ogImage) {
      let og = document.querySelector('meta[property="og:image"]');
      if (og) og.content = s.ogImage;
    }
  }

  function renderAnalytics(s) {
    if (s.googleAnalyticsId) {
      if (!document.getElementById('ga-script')) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(s.googleAnalyticsId);
        document.head.appendChild(script);
      }
      if (!window.gtag) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', s.googleAnalyticsId);
      }
    }
  }

  function renderCustomCSS(s) {
    let style = document.getElementById('custom-css');
    if (s.customCss && s.customCss.trim()) {
      if (!style) { style = document.createElement('style'); style.id = 'custom-css'; document.head.appendChild(style); }
      style.textContent = s.customCss;
    } else if (style) style.remove();
  }

  function renderHeaderSocial(s) {
    const box = $('#headerSocial');
    if (!box) return;
    const links = [];
    if (s.facebook) links.push({ href: s.facebook, label: '📘', name: 'Facebook' });
    if (s.twitter) links.push({ href: s.twitter, label: '𝕏', name: 'X' });
    if (s.youtube) links.push({ href: s.youtube, label: '▶', name: 'YouTube' });
    if (s.instagram) links.push({ href: s.instagram, label: '📸', name: 'Instagram' });
    const waNumber = (s.contactPhone || '').replace(/[^0-9+]/g, '');
    const waHref = waNumber ? 'https://wa.me/' + waNumber.replace(/^\+/, '') : null;
    // Toujours afficher au moins WhatsApp / Facebook fallback comme ntemo
    box.innerHTML = '';
    const defaults = links.length ? links : [
      { href: s.facebook || '#', label: '📘', name: 'Facebook' },
      { href: s.twitter || '#', label: '𝕏', name: 'X' },
      { href: s.youtube || '#', label: '▶', name: 'YouTube' },
      { href: waHref || '#', label: '💬', name: 'WhatsApp' }
    ];
    for (const l of defaults) {
      const a = document.createElement('a');
      a.href = l.href;
      a.className = 'social-link' + (l.name === 'WhatsApp' ? ' whatsapp' : '');
      a.setAttribute('aria-label', l.name);
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = l.label;
      box.appendChild(a);
    }
  }

  /* ---------- Utilitaires ---------- */
  function formatDate(d) {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) { return d || ''; }
  }

  function shortDate(d) {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return d || ''; }
  }

  function excerpt(text, len) {
    const clean = String(text || '').replace(/\n+/g, ' ').trim();
    return clean.length > len ? clean.slice(0, len).trim() + '…' : clean;
  }

  function initials(title) {
    return String(title || 'ISTC').split(' ').filter(Boolean).slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function thumbHTML(a, cls) {
    if (a.image) return `<img src="${a.image}" alt="${escapeHtml(a.title)}" loading="lazy">`;
    return `<div class="placeholder ${cls || ''}">${escapeHtml(initials(a.title))}</div>`;
  }

  function catBadge(cat) {
    return `<span class="article-category">${escapeHtml(cat || 'Actualités')}</span>`;
  }

  function publishedList() {
    return allArticles.filter((a) => a.published).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  function filteredList() {
    const list = publishedList();
    if (activeCategory === 'all') return list;
    return list.filter((a) => a.category === activeCategory);
  }

  /* ---------- Navigation catégories façon ntemo ---------- */
  function renderCategoryNav() {
    const nav = $('#categoryNav');
    if (!nav) return;
    const cats = ['all', ...new Set(publishedList().map((a) => a.category).filter(Boolean))];
    // Garde les liens statiques si déjà présents, sinon reconstruit
    nav.innerHTML = '';
    const labels = { all: 'Actualités' };
    for (const c of cats) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'cat-link' + (c === activeCategory ? ' active' : '');
      a.dataset.cat = c;
      a.textContent = labels[c] || c;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        setCategory(c);
        const sec = $('#articlesSection');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      nav.appendChild(a);
    }
  }

  function setCategory(c) {
    activeCategory = c;
    visibleCount = PAGE_SIZE;
    $$('#categoryNav .cat-link').forEach((el) => el.classList.toggle('active', el.dataset.cat === c));
    renderAll();
  }

  // Liens footer avec data-cat
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-cat]');
    if (!t) return;
    if (t.classList.contains('cat-link')) return; // déjà géré
    e.preventDefault();
    setCategory(t.dataset.cat || 'all');
    const sec = $('#articlesSection');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Featured ---------- */
  function renderFeatured() {
    const list = publishedList();
    const wrap = $('#featuredSection');
    if (!wrap) return;
    if (!list.length) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    const feat = list.find((a) => a.featured) || list[0];
    const link = '/article.html?id=' + feat.id;
    const img = $('#featuredImg');
    if (img) {
      if (feat.image) { img.src = feat.image; img.alt = feat.title; img.classList.remove('hidden'); }
      else { img.classList.add('hidden'); }
    }
    const fl = $('#featuredLink'); if (fl) fl.href = link;
    const fc = $('#featuredCat'); if (fc) fc.innerHTML = catBadge(feat.category);
    const ttl = $('#featuredTitleLink'); if (ttl) { ttl.textContent = feat.title; ttl.href = link; }
    const ex = $('#featuredExcerpt'); if (ex) ex.textContent = excerpt(feat.content, 180);
    const au = $('#featuredAuthor'); if (au) au.textContent = 'Par ' + (feat.author || 'ISTC');
    const dt = $('#featuredDate'); if (dt) dt.textContent = formatDate(feat.date);
  }

  /* ---------- Cartes façon ntemo ---------- */
  function articleCard(a, opts) {
    opts = opts || {};
    const link = '/article.html?id=' + a.id;
    const card = document.createElement('article');
    card.className = 'news-card' + (opts.large ? ' news-card-large' : '') + (opts.small ? ' news-card-small' : '');
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <a class="news-thumb" href="${link}" aria-label="${escapeHtml(a.title)}">
        ${thumbHTML(a)}
        <span class="news-cat">${escapeHtml(a.category || 'Actualités')}</span>
      </a>
      <div class="news-body">
        <div class="news-meta"><span>${escapeHtml(a.author || 'ISTC')}</span><span>·</span><time>${shortDate(a.date)}</time></div>
        <h3 class="news-title"><a href="${link}">${escapeHtml(a.title)}</a></h3>
        ${opts.excerpt ? `<p class="news-excerpt">${escapeHtml(excerpt(a.content, 110))}</p>` : ''}
        <div class="news-actions">
          <a class="news-read" href="${link}">Lire l'article →</a>
          <button class="news-share" data-share-id="${a.id}" aria-label="Partager">⤴</button>
        </div>
      </div>`;
    return card;
  }

  function miniRow(a) {
    const link = '/article.html?id=' + a.id;
    const el = document.createElement('a');
    el.className = 'mini-row';
    el.href = link;
    el.setAttribute('role', 'listitem');
    el.innerHTML = `
      <span class="mini-row-thumb">${thumbHTML(a)}</span>
      <span class="mini-row-body">
        <span class="mini-row-cat">${escapeHtml(a.category || 'Actualités')} · ${shortDate(a.date)}</span>
        <span class="mini-row-title">${escapeHtml(a.title)}</span>
      </span>`;
    return el;
  }

  /* ---------- Grilles ---------- */
  function renderArticles() {
    const grid = $('#articlesGrid');
    if (!grid) return;
    const list = filteredList();
    const count = $('#articlesCount');
    if (count) count.textContent = list.length + (list.length > 1 ? ' articles' : ' article');

    grid.innerHTML = '';
    if (!list.length) {
      grid.innerHTML = '<div class="loading">Aucun article dans cette catégorie pour le moment.</div>';
      const lm = $('#loadMoreContainer'); if (lm) lm.classList.add('hidden');
      return;
    }
    const slice = list.slice(0, visibleCount);
    for (const a of slice) grid.appendChild(articleCard(a, { excerpt: true }));

    const lm = $('#loadMoreContainer');
    const btn = $('#loadMoreBtn');
    if (lm && btn) {
      if (visibleCount >= list.length) lm.classList.add('hidden');
      else {
        lm.classList.remove('hidden');
        btn.textContent = 'Afficher plus (' + (list.length - visibleCount) + ' restants)';
      }
    }
  }

  function renderLireAussi() {
    const grid = $('#lireAussiGrid');
    if (!grid) return;
    const list = publishedList();
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<div class="loading">Aucun article.</div>'; return; }
    const featId = (list.find((a) => a.featured) || list[0]).id;
    const others = list.filter((a) => String(a.id) !== String(featId)).slice(0, 6);
    for (const a of others) grid.appendChild(miniRow(a));
  }

  function renderPourVous() {
    const grid = $('#pourVousGrid');
    if (!grid) return;
    const list = publishedList().slice(0, 4);
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<div class="loading">Aucun article.</div>'; return; }
    for (const a of list) grid.appendChild(articleCard(a, { large: true }));
  }

  function renderPlusActu() {
    const grid = $('#plusActuGrid');
    if (!grid) return;
    const list = publishedList().slice(4, 12);
    grid.innerHTML = '';
    if (!list.length) { grid.innerHTML = '<div class="loading">Plus d’articles bientôt.</div>'; return; }
    for (const a of list) grid.appendChild(articleCard(a));
  }

  function renderCategorySections() {
    const wrap = $('#catSectionsGrid');
    if (!wrap) return;
    wrap.innerHTML = '';
    const list = publishedList();
    const cats = [...new Set(list.map((a) => a.category).filter(Boolean))].slice(0, 5);
    if (!cats.length) return;
    for (const cat of cats) {
      const items = list.filter((a) => a.category === cat).slice(0, 4);
      if (!items.length) continue;
      const sec = document.createElement('section');
      sec.className = 'cat-section';
      sec.innerHTML = `<header class="section-header"><h3 class="section-title section-title-sm">${escapeHtml(cat)}</h3><a href="#" class="cat-more" data-cat="${escapeHtml(cat)}">Voir tout →</a></header><div class="cat-grid"></div>`;
      const g = sec.querySelector('.cat-grid');
      const [first, ...rest] = items;
      if (first) g.appendChild(articleCard(first, { large: true, excerpt: true }));
      const side = document.createElement('div');
      side.className = 'cat-side';
      for (const a of rest.slice(0, 3)) side.appendChild(miniRow(a));
      g.appendChild(side);
      wrap.appendChild(sec);
    }
  }

  function renderAll() {
    renderFeatured();
    renderArticles();
    renderLireAussi();
    renderPourVous();
    renderPlusActu();
    renderCategorySections();
  }

  /* ---------- Load more / Search ---------- */
  const loadBtn = $('#loadMoreBtn');
  if (loadBtn) loadBtn.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderArticles();
  });

  // Recherche façon ntemo (champ injecté si absent)
  function ensureSearch() {
    const header = document.querySelector('#articlesSection .section-header');
    if (!header || $('#articleSearch')) return;
    const wrap = document.createElement('div');
    wrap.className = 'section-search';
    wrap.innerHTML = `<input id="articleSearch" type="search" placeholder="Rechercher un article…" aria-label="Rechercher">`;
    header.appendChild(wrap);
    const input = wrap.querySelector('input');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      const grid = $('#articlesGrid');
      if (!grid) return;
      const list = filteredList().filter((a) =>
        !q || (a.title + ' ' + a.content + ' ' + a.category).toLowerCase().includes(q)
      );
      grid.innerHTML = '';
      if (!list.length) { grid.innerHTML = '<div class="loading">Aucun résultat.</div>'; return; }
      for (const a of list.slice(0, visibleCount)) grid.appendChild(articleCard(a, { excerpt: true }));
    });
  }

  /* ---------- Partage façon ntemo (WhatsApp prioritaire) ---------- */
  function openShare(id, title) {
    const a = allArticles.find((x) => String(x.id) === String(id));
    shareTitle = title || (a ? a.title : document.title);
    shareUrl = a ? (location.origin + '/article.html?id=' + a.id) : location.href;
    const m = $('#shareModal');
    if (m) m.classList.remove('hidden');
    const st = $('#shareTitle');
    if (st) st.textContent = 'Partager : ' + shareTitle.slice(0, 60) + (shareTitle.length > 60 ? '…' : '');
  }

  function closeShare() {
    const m = $('#shareModal');
    if (m) m.classList.add('hidden');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-share-id]');
    if (btn) {
      e.preventDefault(); e.stopPropagation();
      openShare(btn.dataset.shareId);
      return;
    }
    const more = e.target.closest('.cat-more');
    if (more) {
      e.preventDefault();
      setCategory(more.dataset.cat || 'all');
      const sec = $('#articlesSection');
      if (sec) sec.scrollIntoView({ behavior: 'smooth' });
    }
  });

  const shareClose = $('#shareClose');
  if (shareClose) shareClose.addEventListener('click', closeShare);
  const shareBackdrop = $('#shareBackdrop');
  if (shareBackdrop) shareBackdrop.addEventListener('click', closeShare);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeShare(); });

  const waBtn = $('#shareWhatsapp');
  if (waBtn) waBtn.addEventListener('click', () => {
    window.open('https://wa.me/?text=' + encodeURIComponent(shareTitle + ' ' + shareUrl), '_blank', 'noopener');
  });
  const fbBtn = $('#shareFacebook');
  if (fbBtn) fbBtn.addEventListener('click', () => {
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
  });
  const twBtn = $('#shareTwitter');
  if (twBtn) twBtn.addEventListener('click', () => {
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareTitle) + '&url=' + encodeURIComponent(shareUrl), '_blank', 'noopener');
  });
  const cpBtn = $('#shareCopy');
  if (cpBtn) cpBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(shareUrl); cpBtn.querySelector('span:last-child').textContent = 'Lien copié ✓'; }
    catch (e) { prompt('Copiez ce lien :', shareUrl); }
    setTimeout(closeShare, 600);
  });

  /* ---------- Nav mobile ---------- */
  const navToggle = $('#navToggle');
  if (navToggle) navToggle.addEventListener('click', () => {
    const nav = $('#categoryNav');
    if (nav) nav.classList.toggle('open');
    navToggle.classList.toggle('open');
  });

  /* ---------- Fetch avec fallback statique (GitHub Pages) ---------- */
  async function fetchJson(urls) {
    for (const u of urls) {
      try {
        const r = await fetch(u);
        if (r.ok) return await r.json();
      } catch (e) { /* essaie suivant */ }
    }
    throw new Error('Fetch failed: ' + urls.join(', '));
  }

  /* ---------- Init ---------- */
  async function init() {
    renderDate();
    try {
      const [s, arts] = await Promise.all([
        fetchJson(['/api/settings', './data/settings.json', 'data/settings.json', '/data/settings.json']),
        fetchJson(['/api/articles', './data/articles.json', 'data/articles.json', '/data/articles.json'])
      ]);
      applySettings(s);
      allArticles = Array.isArray(arts) ? arts : [];
      renderCategoryNav();
      ensureSearch();
      renderAll();
    } catch (e) {
      console.error('Erreur de chargement', e);
      // Données de secours minimales pour affichage
      applySettings({ siteName: 'ISTC News', siteFullName: 'Institut Supérieur de Techniques Commerciales', tagline: '', enableDarkMode: true, defaultTheme: 'light' });
      const grid = $('#articlesGrid');
      if (grid) grid.innerHTML = '<div class="loading">Impossible de charger les actualités. Vérifiez que le serveur est démarré ou que les fichiers data/ sont publiés.</div>';
    }
  }

  init();
})();
