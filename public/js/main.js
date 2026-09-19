(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let settings = {};
  let allArticles = [];
  let activeCategory = 'Tous';
  let currentTheme = 'light';

  const root = document.documentElement;

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
    for (const [k, v] of Object.entries(themeVars(settings))) root.style.setProperty(k, v);
  }

  function renderTheme() {
    const stored = localStorage.getItem('istc_theme');
    currentTheme = stored || settings.defaultTheme || 'light';
    root.setAttribute('data-theme', currentTheme);
    applyThemeColors();
    updateThemeIcon();
    if (!settings.enableDarkMode) $('#themeToggle').classList.add('hidden');
  }

  function updateThemeIcon() {
    const btn = $('#themeToggle');
    if (btn) btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }

  $('#themeToggle').addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', currentTheme);
    localStorage.setItem('istc_theme', currentTheme);
    applyThemeColors();
    updateThemeIcon();
  });

  /* ---------- Paramètres ---------- */
  function applySettings(s) {
    settings = s;
    applyThemeColors();

    document.title = s.siteName + ' — Actualités';
    $('#brandName').textContent = s.siteName;
    $('#brandFullName').textContent = s.siteFullName;
    $('#footerBrand').textContent = s.siteName;
    $('#footerTagline').textContent = s.tagline;
    $('#contactEmail').textContent = s.contactEmail;
    $('#contactPhone').textContent = s.contactPhone;
    $('#contactAddress').textContent = s.contactAddress;
    $('#heroText').textContent = s.heroText || '';
    $('#statInscriptions').textContent = s.registrationOpen ? 'Ouvertes' : 'Fermées';
    $('#copyright').textContent = `© ${new Date().getFullYear()} ${s.siteName}. Tous droits réservés.`;

    renderLogo(s);
    renderTheme();
    renderInscriptionSection(s);
    renderSocial(s);
    renderSEO(s);
    renderAnalytics(s);
    renderCustomCSS(s);

    const annBar = $('#announcementBar');
    if (s.showAnnouncement && s.announcement) {
      annBar.textContent = s.announcement;
      annBar.classList.remove('hidden');
    } else {
      annBar.classList.add('hidden');
    }
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
    if (fav) fav.href = s.favicon || s.logoImage || '';

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
    if (s.metaDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      meta.content = s.metaDescription;
    }
    if (s.metaKeywords) {
      let meta = document.querySelector('meta[name="keywords"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'keywords';
        document.head.appendChild(meta);
      }
      meta.content = s.metaKeywords;
    }
    if (s.ogImage) {
      let og = document.querySelector('meta[property="og:image"]');
      if (!og) {
        og = document.createElement('meta');
        og.setAttribute('property', 'og:image');
        document.head.appendChild(og);
      }
      og.content = s.ogImage;
    }
    if (s.siteName) {
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.content = s.siteName;
    }
    if (s.tagline) {
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.content = s.tagline;
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
        window.gtag = function () { dataLayer.push(arguments); };
        window.gtag('js', new Date());
        window.gtag('config', s.googleAnalyticsId);
      }
    }
  }

  function renderCustomCSS(s) {
    let style = document.getElementById('custom-css');
    if (s.customCss && s.customCss.trim()) {
      if (!style) {
        style = document.createElement('style');
        style.id = 'custom-css';
        document.head.appendChild(style);
      }
      style.textContent = s.customCss;
    } else if (style) {
      style.remove();
    }
  }

  function renderSocial(s) {
    const el = $('#socialLinks');
    if (!el) return;
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

  function renderInscriptionSection(s) {
    $('#inscriptionTitle').textContent = s.registrationTitle || 'Inscriptions à distance';
    $('#inscriptionText').textContent = s.registrationText || '';
    const deadline = $('#inscriptionDeadline');
    if (s.registrationDeadline) {
      deadline.textContent = '📅 Date limite : ' + formatDate(s.registrationDeadline);
      deadline.classList.remove('hidden');
    } else {
      deadline.classList.add('hidden');
    }
    renderPaymentBadges('#paymentBadges', s);
    const section = $('#inscription');
    const cta = section.querySelector('.inscription-cta .btn-hero');
    if (!s.registrationOpen) {
      section.querySelector('.eyebrow').textContent = 'Inscriptions suspendues';
      cta.style.opacity = '0.55';
      cta.style.pointerEvents = 'none';
      cta.textContent = 'Inscriptions fermées';
    }
  }

  function renderPaymentBadges(selector, s) {
    const el = $(selector);
    if (!el) return;
    el.innerHTML = '';
    const methods = [
      { key: 'orangeEnabled', name: 'Orange Money', icon: '/images/payments/orange-money.svg' },
      { key: 'mpesaEnabled', name: 'M-Pesa', icon: '/images/payments/mpesa.svg' },
      { key: 'visaEnabled', name: 'Visa', icon: '/images/payments/visa.svg' },
      { key: 'mastercardEnabled', name: 'Mastercard', icon: '/images/payments/mastercard.svg' }
    ];
    for (const m of methods) {
      if (s[m.key]) {
        const badge = document.createElement('span');
        badge.className = 'payment-badge';
        badge.innerHTML = `<img class="pay-logo" src="${m.icon}" alt="${m.name}">${m.name}`;
        el.appendChild(badge);
      }
    }
  }

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

  function relativeTime(dateStr) {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const days = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (days < 1) return "publié aujourd'hui";
      if (days === 1) return 'publié hier';
      if (days < 7) return 'publié il y a ' + days + ' jours';
      if (days < 30) return 'publié il y a ' + Math.floor(days / 7) + ' semaine' + (Math.floor(days / 7) > 1 ? 's' : '');
      return 'publié le ' + formatDate(dateStr);
    } catch (e) {
      return '';
    }
  }

  function excerpt(text, len) {
    const clean = text.replace(/\n+/g, ' ').trim();
    return clean.length > len ? clean.slice(0, len) + '…' : clean;
  }

  function initials(title) {
    return title.split(' ').slice(0, 3).map((w) => w[0]).join('').toUpperCase();
  }

  function thumbHTML(a, placeholderCls) {
    return a.image
      ? `<img src="${a.image}" alt="${a.title}" loading="lazy">`
      : `<div class="placeholder ${placeholderCls || ''}">${initials(a.title)}</div>`;
  }

  /* ---------- Filtre catégories ---------- */
  function renderCategories() {
    const cats = ['Tous', ...new Set(allArticles.filter((a) => a.published).map((a) => a.category))];
    const el = $('#categoryFilter');
    el.innerHTML = '';
    cats.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.textContent = c;
      if (i === 0) btn.classList.add('active');
      btn.addEventListener('click', () => {
        activeCategory = c;
        $$('#categoryFilter button').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderArticles();
      });
      el.appendChild(btn);
    });
  }

  /* ---------- Widget intelligent ---------- */
  function renderLiveWidget() {
    const latest = allArticles
      .filter((a) => a.published)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    const title = $('#liveTitle');
    if (!latest) {
      title.textContent = 'Aucune publication pour le moment';
      title.removeAttribute('href');
      $('#liveMeta').textContent = '';
      return;
    }
    title.textContent = latest.title.length > 46 ? latest.title.slice(0, 46) + '…' : latest.title;
    title.href = '/article.html?id=' + latest.id;
    $('#liveMeta').textContent = relativeTime(latest.date) + ' · ' + latest.category;
  }

  /* ---------- Grille d'articles ---------- */
  function renderArticles() {
    const grid = $('#articlesGrid');
    const list = allArticles
      .filter((a) => a.published && (activeCategory === 'Tous' || a.category === activeCategory))
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));

    renderLiveWidget();

    if (!list.length) {
      grid.innerHTML = '<div class="loading">Aucun article pour le moment.</div>';
      return;
    }

    grid.innerHTML = '';

    const [lead, ...rest] = list;

    const leadCard = document.createElement('a');
    leadCard.className = 'mini-card lead-card';
    leadCard.href = '/article.html?id=' + lead.id;
    leadCard.innerHTML = `
      <div class="mini-thumb">
        ${lead.featured ? '<span class="article-badge">À la une</span>' : ''}
        ${thumbHTML(lead, 'lead-placeholder')}
      </div>
      <div class="mini-info">
        <span class="article-category">${lead.category}</span>
        <h3>${lead.title}</h3>
        <p class="lead-excerpt">${excerpt(lead.content, 190)}</p>
        <div class="mini-meta">
          <span>${lead.author}</span>
          <span>${formatDate(lead.date)}</span>
        </div>
      </div>`;
    grid.appendChild(leadCard);

    for (const a of rest) {
      const card = document.createElement('a');
      card.className = 'mini-card';
      card.href = '/article.html?id=' + a.id;
      card.innerHTML = `
        <div class="mini-thumb">
          ${a.featured ? '<span class="article-badge">À la une</span>' : ''}
          ${thumbHTML(a)}
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

  /* ---------- Navigation ---------- */
  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    navToggle.classList.toggle('open');
  });

  $$('.main-nav a').forEach((a) => {
    a.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('open');
    });
  });

  /* ---------- Init ---------- */
  async function init() {
    try {
      const [settingsRes, articlesRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/articles')
      ]);
      applySettings(await settingsRes.json());
      allArticles = await articlesRes.json();
      renderCategories();
      renderArticles();
    } catch (e) {
      console.error('Erreur de chargement', e);
      $('#articlesGrid').innerHTML =
        '<div class="loading">Impossible de charger les actualités. Vérifiez que le serveur est démarré.</div>';
    }
  }

  init();
})();