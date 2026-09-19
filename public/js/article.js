(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let settings = {};
  let currentTheme = 'light';
  let currentArticle = null;

  function siteBase() {
    try {
      const seg = location.pathname.split('/').filter(Boolean);
      if (location.hostname.endsWith('github.io') && seg.length) return '/' + seg[0];
      return '';
    } catch (e) { return ''; }
  }
  const BASE = siteBase();
  function asset(p) {
    if (!p) return p;
    if (/^(https?:|data:|blob:)/i.test(p)) return p;
    if (p.charAt(0) === '/') return BASE + p;
    return p;
  }
  function pageUrl(path) {
    if (/^(https?:)/i.test(path)) return path;
    return asset(path.charAt(0) === '/' ? path : '/' + path);
  }

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
    try { for (const [k, v] of Object.entries(themeVars(settings))) document.documentElement.style.setProperty(k, v); } catch (e) {}
  }

  function renderLogo(s) {
    const img = $('#brandMarkImg'); const text = $('#brandMarkText');
    if (img && text) {
      if (s.logoImage) { img.src = asset(s.logoImage); img.classList.remove('hidden'); text.classList.add('hidden'); }
      else { img.classList.add('hidden'); text.classList.remove('hidden'); }
    }
    const fav = $('#siteFavicon'); if (fav) fav.href = s.favicon || s.logoImage || '/favicon.svg';
    const footerLogo = $('#footerLogo');
    if (footerLogo) {
      if (s.logoImage) { footerLogo.src = asset(s.logoImage); footerLogo.classList.remove('hidden'); }
      else footerLogo.classList.add('hidden');
    }
  }

  function applySettings(s) {
    settings = s || {};
    applyThemeColors();
    const bn = $('#brandName'); if (bn) bn.textContent = s.siteName || 'ISTC News';
    const bfn = $('#brandFullName'); if (bfn) bfn.textContent = s.siteFullName || '';
    const fb = $('#footerBrand'); if (fb) fb.textContent = s.siteName || 'ISTC News';
    const ft = $('#footerTagline'); if (ft) ft.textContent = s.tagline || '';
    const cp = $('#copyright'); if (cp) cp.textContent = `© ${new Date().getFullYear()} ${s.siteName || 'ISTC News'}. Tous droits réservés.`;
    renderLogo(s);
    let stored = null; try { stored = localStorage.getItem('istc_theme'); } catch (e) {}
    currentTheme = stored || s.defaultTheme || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    applyThemeColors(); updateThemeIcon();
    if (s.enableDarkMode === false) { const t = $('#themeToggle'); if (t) t.classList.add('hidden'); }
    const annBar = $('#announcementBar');
    if (annBar) {
      if (s.showAnnouncement && s.announcement) { annBar.textContent = s.announcement; annBar.classList.remove('hidden'); }
      else annBar.classList.add('hidden');
    }
    renderSocial(s);
    renderContact(s);
  }

  function renderSocial(s) {
    for (const sel of ['#headerSocial', '#sidebarSocial']) {
      const el = $(sel); if (!el) continue;
      el.innerHTML = '';
      const items = [];
      if (s.facebook) items.push({ href: s.facebook, label: '📘', name: 'Facebook' });
      if (s.twitter) items.push({ href: s.twitter, label: '𝕏', name: 'X' });
      if (s.youtube) items.push({ href: s.youtube, label: '▶', name: 'YouTube' });
      if (s.instagram) items.push({ href: s.instagram, label: '📸', name: 'Instagram' });
      const list = items.length ? items : [
        { href: '#', label: '📘', name: 'Facebook' },
        { href: '#', label: '𝕏', name: 'X' },
        { href: '#', label: '▶', name: 'YouTube' },
        { href: '#', label: '💬', name: 'WhatsApp' }
      ];
      for (const it of list) {
        const a = document.createElement('a');
        a.href = it.href; a.target = '_blank'; a.rel = 'noopener';
        a.title = it.name; a.className = 'social-link'; a.textContent = it.label;
        el.appendChild(a);
      }
    }
  }

  function renderContact(s) {
    const fe = $('#footerEmail');
    if (fe) { const a = fe.querySelector('a'); if (a) { a.textContent = s.contactEmail || ''; if (s.contactEmail) a.href = 'mailto:' + s.contactEmail; } }
    const fp = $('#footerPhone');
    if (fp) { const a = fp.querySelector('a'); if (a) { a.textContent = s.contactPhone || ''; if (s.contactPhone) a.href = 'tel:' + s.contactPhone.replace(/\s/g, ''); } }
  }

  function updateThemeIcon() { const b = $('#themeToggle'); if (b) b.textContent = currentTheme === 'dark' ? '☀️' : '🌙'; }

  const tt = $('#themeToggle');
  if (tt) tt.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    try { localStorage.setItem('istc_theme', currentTheme); } catch (e) {}
    applyThemeColors(); updateThemeIcon();
  });

  const nt = $('#navToggle');
  if (nt) nt.addEventListener('click', () => {
    const nav = $('#categoryNav');
    if (nav) nav.classList.toggle('open');
    nt.classList.toggle('open');
  });

  function renderDate() {
    const el = $('#currentDate'); if (!el) return;
    try { el.textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) {}
  }

  function formatDate(d) {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return d || ''; }
  }
  function shortDate(d) {
    try { return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch (e) { return d || ''; }
  }
  function initials(title) { return String(title || 'ISTC').split(' ').filter(Boolean).slice(0, 3).map((w) => w[0]).join('').toUpperCase(); }
  function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function imageToken(url) {
    return url ? `<figure class="article-figure"><img src="${asset(url)}" alt="" loading="lazy"></figure>` : '';
  }

  function renderContent(content, images) {
    return String(content || '').split('\n').map((line) => {
      const only = line.trim().match(/^\{\{img:(\d)\}\}$/);
      if (only) return imageToken((images || [])[Number(only[1]) - 1]);
      const parts = line.split(/\{\{img:(\d)\}\}/);
      if (parts.length === 1) return `<p>${escapeHtml(line.trim()) || '&nbsp;'}</p>`;
      let out = '';
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) out += imageToken((images || [])[Number(parts[i]) - 1]);
        else if (parts[i].trim()) out += `<p>${escapeHtml(parts[i].trim())}</p>`;
      }
      return out;
    }).join('');
  }

  function thumb(a) {
    if (a.image) return `<img src="${asset(a.image)}" alt="${escapeHtml(a.title)}" loading="lazy">`;
    return `<div class="placeholder">${escapeHtml(initials(a.title))}</div>`;
  }

  function renderArticle(a) {
    currentArticle = a;
    document.title = (settings.siteName || 'ISTC News') + ' — ' + a.title;
    const pc = $('#pageCategory'); if (pc) pc.textContent = a.category || 'Actualités';
    const pt = $('#pageTitle'); if (pt) pt.textContent = a.title;
    const ct = $('#crumbTitle'); if (ct) ct.textContent = a.title.slice(0, 60);
    const av = $('#pageAvatar'); if (av) av.textContent = initials(a.author || 'ISTC');
    const pm = $('#pageMeta'); if (pm) pm.textContent = `${a.author || 'ISTC'} • ${formatDate(a.date)}`;
    const an = $('#authorName'); if (an) an.textContent = a.author || 'ISTC';
    const aa = $('#authorAvatar'); if (aa) aa.textContent = initials(a.author || 'ISTC');
    const pi = $('#pageImage');
    if (pi) {
      if (a.image) { pi.src = asset(a.image); pi.alt = a.title; pi.classList.remove('hidden'); }
      else pi.classList.add('hidden');
    }
    const pcEl = $('#pageContent');
    if (pcEl) { pcEl.classList.remove('loading'); pcEl.innerHTML = renderContent(a.content, a.images || []); }

    // SEO dynamique façon ntemo
    const setMeta = (selector, value) => { if (!value) return; const m = document.querySelector(selector); if (m) m.content = value; };
    setMeta('meta[name="description"]', String(a.content || '').replace(/\n+/g, ' ').slice(0, 155));
    setMeta('meta[property="og:title"]', a.title);
    setMeta('meta[name="twitter:title"]', a.title);
    if (a.image) { setMeta('meta[property="og:image"]', a.image); setMeta('meta[name="twitter:image"]', a.image); }

    // Tags façon ntemo (catégorie + mots du titre)
    const tags = $('#articleTags');
    if (tags) {
      tags.innerHTML = '';
      const tagList = [a.category, ...(a.title.split(' ').filter((w) => w.length > 5).slice(0, 3))].filter(Boolean);
      for (const t of [...new Set(tagList)]) {
        const el = document.createElement('a');
        el.className = 'article-tag'; el.href = './#articlesSection'; el.textContent = '#' + t;
        tags.appendChild(el);
      }
    }
    bindShare();
  }

  function articleUrl(a) { return location.origin + pageUrl('/article.html?id=' + (a ? a.id : '')); }

  function bindShare() {
    const url = articleUrl(currentArticle);
    const title = currentArticle ? currentArticle.title : document.title;
    const wa = $('#artShareWa'); if (wa) wa.onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(title + ' ' + url), '_blank', 'noopener');
    const fb = $('#artShareFb'); if (fb) fb.onclick = () => window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank', 'noopener');
    const x = $('#artShareX'); if (x) x.onclick = () => window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url), '_blank', 'noopener');
    const cp = $('#artShareCopy'); if (cp) cp.onclick = async () => {
      try { await navigator.clipboard.writeText(url); cp.textContent = '✓ Copié'; } catch (e) { prompt('Copiez ce lien :', url); }
    };
  }

  function miniRow(a) {
    const el = document.createElement('a');
    el.className = 'mini-row'; el.href = pageUrl('/article.html?id=' + a.id);
    el.innerHTML = `<span class="mini-row-thumb">${thumb(a)}</span><span class="mini-row-body"><span class="mini-row-cat">${escapeHtml(a.category)} · ${shortDate(a.date)}</span><span class="mini-row-title">${escapeHtml(a.title)}</span></span>`;
    return el;
  }

  function newsCard(a) {
    const link = pageUrl('/article.html?id=' + a.id);
    const el = document.createElement('article');
    el.className = 'news-card';
    el.innerHTML = `<a class="news-thumb" href="${link}">${thumb(a)}<span class="news-cat">${escapeHtml(a.category)}</span></a><div class="news-body"><div class="news-meta"><span>${escapeHtml(a.author || 'ISTC')}</span><span>·</span><time>${shortDate(a.date)}</time></div><h3 class="news-title"><a href="${link}">${escapeHtml(a.title)}</a></h3></div>`;
    return el;
  }

  function renderSidebar(article, all) {
    const others = all.filter((a) => a.published && String(a.id) !== String(article.id));
    const same = others.filter((a) => a.category === article.category).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const rest = others.filter((a) => a.category !== article.category).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const suggestions = same.concat(rest).slice(0, 6);
    const box = $('#sidebarSuggestions');
    if (!box) return;
    if (!suggestions.length) { box.innerHTML = '<p class="suggestion-meta">Aucun autre article pour le moment.</p>'; return; }
    box.innerHTML = '';
    for (const a of suggestions) box.appendChild(miniRow(a));
  }

  function renderRelated(article, all) {
    const rel = all.filter((a) => a.published && String(a.id) !== String(article.id) && a.category === article.category).slice(0, 3);
    const sec = $('#relatedSection'); const grid = $('#relatedGrid');
    if (!sec || !grid) return;
    if (!rel.length) { sec.classList.add('hidden'); return; }
    sec.classList.remove('hidden');
    grid.innerHTML = '';
    for (const a of rel) grid.appendChild(newsCard(a));
  }

  function renderCategoryNav(all) {
    const nav = $('#categoryNav'); if (!nav) return;
    const cats = ['all', ...new Set(all.filter((a) => a.published).map((a) => a.category).filter(Boolean))];
    nav.innerHTML = '';
    for (const c of cats) {
      const a = document.createElement('a');
      a.href = './#articlesSection'; a.className = 'cat-link'; a.dataset.cat = c;
      a.textContent = c === 'all' ? 'Actualités' : c;
      nav.appendChild(a);
    }
  }

  async function fetchJson(urls) {
    for (const u of urls) {
      try { const r = await fetch(u); if (r.ok) return await r.json(); } catch (e) {}
    }
    throw new Error('fetch failed');
  }

  async function init() {
    renderDate();
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { const pc = $('#pageContent'); if (pc) pc.textContent = 'Aucun article sélectionné.'; return; }
    try {
      const [s, article] = await Promise.all([
        fetchJson(['/api/settings', './data/settings.json', 'data/settings.json', '/data/settings.json']),
        fetchJson(['/api/articles/' + id, './data/articles.json', 'data/articles.json', '/data/articles.json']).then((d) => Array.isArray(d) ? d.find((x) => String(x.id) === String(id)) : d)
      ]);
      applySettings(s);
      if (!article || article.error) throw new Error('not found');
      renderArticle(article);
      const all = await fetchJson(['/api/articles', './data/articles.json', 'data/articles.json', '/data/articles.json']);
      const list = Array.isArray(all) ? all : [];
      renderCategoryNav(list);
      renderSidebar(article, list);
      renderRelated(article, list);
    } catch (e) {
      console.error(e);
      const pc = $('#pageContent');
      if (pc) pc.innerHTML = '<p>Cet article n\'existe pas ou n\'est pas disponible. <a href="./#articlesSection" class="back-link">Retour aux actualités →</a></p>';
    }
  }

  init();
})();
