(function () {
  const $ = (s) => document.querySelector(s);

  let settings = {};
  let currentTheme = 'light';

  /* ---------- Thème ---------- */
  function themeVars(s) {
    const dark = currentTheme === 'dark';
    return {
      '--primary': s.primaryColor,
      '--secondary': s.secondaryColor,
      '--text': dark ? '#e6edf3' : s.textColor,
      '--bg': dark ? '#0d1520' : s.backgroundColor,
      '--header-bg': dark ? 'rgba(13, 21, 32, 0.85)' : s.headerBackground,
      '--header-text': dark ? '#e6edf3' : s.headerTextColor,
      '--footer-bg': dark ? '#070d14' : s.footerBackground,
      '--footer-text': dark ? '#a9b8c6' : s.footerTextColor,
      '--card-bg': dark ? '#141f2d' : '#ffffff'
    };
  }

  function applyThemeColors() {
    for (const [k, v] of Object.entries(themeVars(settings))) document.documentElement.style.setProperty(k, v);
  }

  function renderLogo(s) {
    const img = $('#brandMarkImg');
    const text = $('#brandMarkText');
    if (s.logoImage) {
      img.src = s.logoImage;
      img.classList.remove('hidden');
      text.classList.add('hidden');
    } else {
      img.classList.add('hidden');
      text.classList.remove('hidden');
    }

    const fav = $('#siteFavicon');
    if (fav) fav.href = s.logoImage || '';

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

  function applySettings(s) {
    settings = s;
    applyThemeColors();

    document.title = s.siteName + ' — ' + $('#pageTitle').textContent;
    $('#brandName').textContent = s.siteName;
    $('#brandFullName').textContent = s.siteFullName;
    $('#footerBrand').textContent = s.siteName;
    $('#footerTagline').textContent = s.tagline;
    $('#copyright').textContent = `© ${new Date().getFullYear()} ${s.siteName}. Tous droits réservés.`;

    renderLogo(s);

    const stored = localStorage.getItem('istc_theme');
    currentTheme = stored || s.defaultTheme || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    applyThemeColors();
    updateThemeIcon();
    if (!s.enableDarkMode) $('#themeToggle').classList.add('hidden');

    const annBar = $('#announcementBar');
    if (s.showAnnouncement && s.announcement) {
      annBar.textContent = s.announcement;
      annBar.classList.remove('hidden');
    }

    renderSocial(s);
  }

  function renderSocial(s) {
    const el = $('#socialLinks');
    el.innerHTML = '';
    const items = [
      { name: 'Facebook', key: 'facebook', label: 'f' },
      { name: 'Twitter', key: 'twitter', label: '𝕏' },
      { name: 'Instagram', key: 'instagram', label: 'IG' },
      { name: 'YouTube', key: 'youtube', label: '▶' }
    ];
    for (const item of items) {
      if (s[item.key]) {
        const a = document.createElement('a');
        a.href = s[item.key];
        a.target = '_blank';
        a.rel = 'noopener';
        a.title = item.name;
        a.textContent = item.label;
        el.appendChild(a);
      }
    }
  }

  function updateThemeIcon() {
    $('#themeToggle').textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }

  $('#themeToggle').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('istc_theme', currentTheme);
    applyThemeColors();
    updateThemeIcon();
  });

  $('#navToggle').addEventListener('click', () => {
    $('#mainNav').classList.toggle('open');
    $('#navToggle').classList.toggle('open');
  });
  $('#mainNav').querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      $('#mainNav').classList.remove('open');
      $('#navToggle').classList.remove('open');
    })
  );

  /* ---------- Utilitaires ---------- */
  function formatDate(d) {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return d;
    }
  }

  function excerpt(text, len) {
    const clean = text.replace(/\n+/g, ' ').trim();
    return clean.length > len ? clean.slice(0, len) + '…' : clean;
  }

  function initials(title) {
    return title.split(' ').slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function imageToken(url) {
    return url
      ? `<figure class="article-figure"><img src="${url}" alt="" loading="lazy"></figure>`
      : '';
  }

  function renderContent(content, images) {
    return content.split('\n').map((line) => {
      const only = line.trim().match(/^\{\{img:(\d)\}\}$/);
      if (only) return imageToken(images[Number(only[1]) - 1]);
      const parts = line.split(/\{\{img:(\d)\}\}/);
      if (parts.length === 1) return `<p>${escapeHtml(line.trim()) || '&nbsp;'}</p>`;
      let out = '';
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
          out += imageToken(images[Number(parts[i]) - 1]);
        } else if (parts[i].trim()) {
          out += `<p>${escapeHtml(parts[i].trim())}</p>`;
        }
      }
      return out;
    }).join('');
  }

  function renderArticle(a) {
    document.title = settings.siteName + ' — ' + a.title;
    $('#pageCategory').textContent = a.category;
    $('#pageTitle').textContent = a.title;
    $('#pageAvatar').textContent = initials(a.author || 'ISTC');
    $('#pageMeta').textContent = `${a.author} • ${formatDate(a.date)}`;
    if (a.image) {
      $('#pageImage').src = a.image;
      $('#pageImage').classList.remove('hidden');
    }
    $('#pageContent').classList.remove('loading');
    $('#pageContent').innerHTML = renderContent(a.content, a.images || []);
  }

  function renderSidebar(article, all) {
    const others = all.filter((a) => a.published && String(a.id) !== String(article.id));
    const sameCategory = others
      .filter((a) => a.category === article.category)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const rest = others
      .filter((a) => a.category !== article.category)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const suggestions = sameCategory.concat(rest).slice(0, 5);
    const box = $('#sidebarSuggestions');
    if (!suggestions.length) {
      box.innerHTML = '<p class="suggestion-meta">Aucun autre article pour le moment.</p>';
      return;
    }
    box.innerHTML = '';
    for (const a of suggestions) {
      const card = document.createElement('a');
      card.className = 'suggestion-card';
      card.href = '/article.html?id=' + a.id;
      card.innerHTML = `
        <div class="suggestion-thumb">
          ${a.image
            ? `<img src="${a.image}" alt="" loading="lazy">`
            : `<div class="placeholder">${initials(a.title)}</div>`}
        </div>
        <div class="suggestion-info">
          <h4>${a.title}</h4>
          <span class="suggestion-meta">${a.category} · ${formatDate(a.date)}</span>
        </div>`;
      card.addEventListener('click', () => {
        window.location.href = card.href;
        window.location.reload();
      });
      box.appendChild(card);
    }
  }

  function renderRelated(article, all) {
    const related = all
      .filter((a) => a.published && a.id !== article.id && a.category === article.category)
      .slice(0, 3);
    if (!related.length) {
      $('#relatedSection').classList.add('hidden');
      return;
    }
    const grid = $('#relatedGrid');
    grid.innerHTML = '';
    for (const a of related) {
      const card = document.createElement('a');
      card.className = 'mini-card';
      card.href = '/article.html?id=' + a.id;
      card.innerHTML = `
        <div class="mini-thumb">
          ${a.image
            ? `<img src="${a.image}" alt="${a.title}" loading="lazy">`
            : `<div class="placeholder">${initials(a.title)}</div>`}
        </div>
        <div class="mini-info">
          <span class="article-category">${a.category}</span>
          <h3>${a.title}</h3>
          <div class="mini-meta">
            <span>${a.author}</span>
            <span>${formatDate(a.date)}</span>
          </div>
        </div>`;
      grid.appendChild(card);
    }
  }

  async function init() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      $('#pageContent').textContent = 'Aucun article sélectionné.';
      return;
    }
    try {
      const [settingsRes, articleRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/articles/' + id)
      ]);
      applySettings(await settingsRes.json());
      const article = await articleRes.json();
      renderArticle(article);
      const allRes = await fetch('/api/articles');
      const all = await allRes.json();
      renderSidebar(article, all);
      renderRelated(article, all);
    } catch (e) {
      console.error(e);
      $('#pageContent').innerHTML =
        '<p>Cet article n\'existe pas ou n\'est pas disponible. <a href="/#actualites" class="back-link">Retour aux actualités →</a></p>';
    }
  }

  init();
})();