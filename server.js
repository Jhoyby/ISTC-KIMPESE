const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json');
const REGISTRATIONS_FILE = path.join(DATA_DIR, 'registrations.json');

const tokens = new Set();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const s = readJson(SETTINGS_FILE, {});
  if (s.maintenanceMode && !req.path.startsWith('/admin') && !req.path.startsWith('/uploads') && !req.path.startsWith('/api')) {
    return res.status(503).sendFile(path.join(__dirname, 'public', 'maintenance.html'));
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + crypto.randomBytes(4).toString('hex') + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp|svg)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Type de fichier non autorisé'));
  }
});

function readJson(file, fallback) {
  try {
    if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('Erreur lecture JSON', file, e.message);
  }
  return fallback;
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (tokens.has(token)) return next();
  res.status(401).json({ error: 'Non autorisé' });
}

const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;

async function optimizeImage(filePath) {
  try {
    const meta = await sharp(filePath, { failOn: 'none' }).metadata();
    if (!meta || !meta.width || !meta.format || ['svg', 'gif'].includes(meta.format)) {
      return path.basename(filePath);
    }
    const pipeline = sharp(filePath).rotate();
    if (meta.width > MAX_IMAGE_WIDTH || meta.height > MAX_IMAGE_HEIGHT) {
      pipeline.resize({ width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT, fit: 'inside', withoutEnlargement: true });
    }
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    const dir = path.dirname(filePath);
    const outPath = path.join(dir, base + '.webp');
    const tmpPath = path.join(dir, base + '_tmp.webp');
    await pipeline.webp({ quality: 80 }).toFile(tmpPath);
    try { fs.unlinkSync(filePath); } catch(e) {}
    try { fs.renameSync(tmpPath, outPath); } catch(e) {
      fs.copyFileSync(tmpPath, outPath);
      fs.unlinkSync(tmpPath);
    }
    return path.basename(outPath);
  } catch (e) {
    console.error('Erreur optimisation image', filePath, e.message);
    return path.basename(filePath);
  }
}

async function processUploads(files) {
  const urls = [];
  for (const f of files || []) urls.push('/uploads/' + (await optimizeImage(f.path)));
  return urls;
}

/* ---------- Email ---------- */
function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getTransporter(s) {
  if (!s || !s.smtpHost || !s.smtpPort) return null;
  return nodemailer.createTransport({
    host: s.smtpHost,
    port: parseInt(s.smtpPort, 10) || 587,
    secure: String(s.smtpPort) === '465',
    auth: s.smtpUser ? { user: s.smtpUser, pass: s.smtpPass || '' } : undefined
  });
}

async function sendMail(s, to, subject, html) {
  if (!to) return { skipped: true, reason: 'no recipient' };
  const transporter = getTransporter(s);
  if (!transporter) {
    console.log('SMTP non configuré — email ignoré:', subject, '->', to);
    return { skipped: true, reason: 'no smtp' };
  }
  try {
    await transporter.sendMail({
      from: s.smtpFrom || s.smtpUser || 'ISTC',
      to,
      subject,
      html
    });
    return { ok: true };
  } catch (e) {
    console.error('Erreur envoi email', e.message);
    return { error: e.message };
  }
}

function emailLayout(s, inner) {
  const primary = s.primaryColor || '#c8102e';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f2f4f7;font-family:Arial,Helvetica,sans-serif;padding:24px">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:${primary};color:#ffffff;padding:18px 26px;font-size:18px;font-weight:bold">${escapeHtml(s.siteName || 'ISTC')}</div>
    <div style="padding:26px">${inner}</div>
    <div style="padding:14px 26px;background:#f8fafc;color:#64748b;font-size:12px">
      ${s.contactEmail ? 'Contact : ' + escapeHtml(s.contactEmail) : ''}${s.contactPhone ? ' · Tél : ' + escapeHtml(s.contactPhone) : ''}
    </div>
  </div>
</body></html>`;
}

function emailTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:14px">
    ${rows.map((r) => `<tr>
      <td style="padding:9px 12px;border-bottom:1px solid #eef1f5;color:#64748b;width:45%">${r[0]}</td>
      <td style="padding:9px 12px;border-bottom:1px solid #eef1f5;font-weight:bold">${r[1]}</td>
    </tr>`).join('')}
  </table>`;
}

function registrationEmail(reg, s) {
  const paid = reg.status === 'paid';
  const payLabel = reg.paymentMethod || '—';
  let payDetail = '';
  if (reg.cardInfo) {
    payDetail = 'Carte ' + (reg.cardInfo.brand || '') + ' •••• ' + String(reg.cardInfo.number || '').slice(-4);
  } else if (reg.txId) {
    payDetail = (reg.paymentMethod || 'Crypto') + ' · TXID : ' + String(reg.txId).slice(0, 20) + (String(reg.txId).length > 20 ? '…' : '');
  } else {
    payDetail = reg.paymentNumber;
  }
  return emailLayout(s, `
    <h2 style="margin-top:0;font-size:17px;color:#0f172a">${paid ? '✅ Paiement confirmé — Inscription enregistrée' : '📝 Inscription enregistrée — paiement à valider'}</h2>
    <p>Bonjour <strong>${escapeHtml(reg.fullName)}</strong>,</p>
    <p>Nous avons bien reçu votre inscription à distance.</p>
    ${emailTable([
      ['Filière', escapeHtml(reg.filiere)],
      ['Montant', escapeHtml(reg.amount || '—')],
      ['Mode de paiement', payLabel],
      ['Référence', escapeHtml(payDetail) || '—'],
      ['Statut', paid ? 'Payé' : 'En attente de validation']
    ])}
    ${paid
      ? '<p>Votre paiement a été <strong>confirmé</strong>. L\'administration de l\'institut vous contactera pour la suite de votre dossier.</p>'
      : `<p>Pour finaliser votre inscription :</p>
         <ol><li>Consultez votre téléphone : une demande de paiement de <strong>${escapeHtml(reg.amount || '')}</strong> (${escapeHtml(reg.paymentMethod)}) vient d'être envoyée sur votre numéro.</li>
         <li>Un menu s'affiche à l'écran : validez-le en saisissant votre code secret <strong>directement sur votre téléphone</strong>.</li>
         <li>Dès réception des fonds, votre inscription est confirmée et vous recevez un reçu par email.</li></ol>`}
    <p style="margin-top:20px;padding-top:14px;border-top:1px solid #eef1f5;font-size:12px;color:#94a3b8">Merci de votre confiance. — ${escapeHtml(s.siteName || 'ISTC')}</p>
  `);
}

function adminNotificationEmail(reg, s) {
  let payDetail = '';
  if (MOBILE_OPERATORS.includes(reg.paymentMethod)) {
    payDetail = reg.paymentNumber;
  } else if (reg.cardInfo) {
    payDetail = 'Carte ' + (reg.cardInfo.brand || '') + ' •••• ' + String(reg.cardInfo.number || '').slice(-4) + ' · Exp ' + reg.cardInfo.exp;
  } else if (reg.txId) {
    payDetail = (reg.paymentMethod || 'Crypto') + ' · TXID : ' + escapeHtml(reg.txId);
  }
  return emailLayout(s, `
    <h2 style="margin-top:0;font-size:17px;color:#0f172a">Nouvelle inscription sur le site</h2>
    ${emailTable([
      ['Nom complet', escapeHtml(reg.fullName)],
      ['Email', escapeHtml(reg.email)],
      ['Téléphone', escapeHtml(reg.phone)],
      ['Filière', escapeHtml(reg.filiere)],
      ['Montant', escapeHtml(reg.amount || '—')],
      ['Mode de paiement', reg.paymentMethod || '—'],
      ['Détail paiement', escapeHtml(payDetail)],
      ['Statut', reg.status === 'paid' ? 'Payé' : 'En attente']
    ])}
    <p><a href="/admin/" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-size:13px">Ouvrir le panneau d'administration</a></p>
  `);
}

function admissionDecisionEmail(reg, s) {
  const admitted = reg.admission === 'admitted';
  const inner = admitted ? `
    <h2 style="margin-top:0;font-size:17px;color:#0f172a">🎉 Félicitations — Vous êtes admis(e) !</h2>
    <p>Bonjour <strong>${escapeHtml(reg.fullName)}</strong>,</p>
    <p>Nous avons le plaisir de vous informer que votre candidature pour la filière <strong>${escapeHtml(reg.filiere)}</strong> au sein de ${escapeHtml(s.siteFullName || s.siteName || 'ISTC')} a été <strong style="color:#16a34a">ACCEPTÉE</strong>.</p>
    ${emailTable([
      ['Filière', escapeHtml(reg.filiere)],
      ['Montant réglé', escapeHtml(reg.amount || '—')],
      ['Référence dossier', String(reg.id)]
    ])}
    <p>L'administration vous contactera très prochainement pour les modalités d'entrée en classe (date de rentrée, matériel, émargement).</p>
    <p>Nous nous réjouissons de vous compter parmi nos étudiants et vous souhaitons une excellente année académique.</p>
    <p style="margin-top:20px;padding-top:14px;border-top:1px solid #eef1f5;font-size:12px;color:#94a3b8">${escapeHtml(s.siteName || 'ISTC')} — Service des admissions</p>
  ` : `
    <h2 style="margin-top:0;font-size:17px;color:#0f172a">Décision concernant votre candidature</h2>
    <p>Bonjour <strong>${escapeHtml(reg.fullName)}</strong>,</p>
    <p>Après étude de votre dossier, nous avons le regret de vous informer que votre candidature pour la filière <strong>${escapeHtml(reg.filiere)}</strong> n'a pas été retenue pour cette année académique.</p>
    <p>Cette décision ne remet pas en cause votre valeur : les places sont limitées et la sélection a été rigoureuse. Nous vous encourageons vivement à retenter votre chance lors de la prochaine session.</p>
    <p>Vos frais d'inscription${reg.amount ? ' (' + escapeHtml(reg.amount) + ')' : ''} seront remboursés conformément au règlement, ou reportés sur une future candidature si vous le souhaitez — contactez-nous pour en discuter.</p>
    <p style="margin-top:20px;padding-top:14px;border-top:1px solid #eef1f5;font-size:12px;color:#94a3b8">${escapeHtml(s.siteName || 'ISTC')} — Service des admissions</p>
  `;
  return emailLayout(s, inner);
}

/* ---------- Paiements ---------- */
function luhn(num) {
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = parseInt(num[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

function detectBrand(num) {
  if (/^4/.test(num)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(num)) return 'Mastercard';
  return '';
}

function validateCard(c) {
  c = c || {};
  const number = String(c.number || '').replace(/[\s-]/g, '');
  const exp = String(c.exp || '').trim();
  const cvc = String(c.cvc || '').trim();
  if (!/^\d{13,19}$/.test(number) || !luhn(number)) return 'Le numéro de carte est invalide.';
  if (!/^\d{2}\/\d{2}$/.test(exp)) return 'La date d\'expiration doit être au format MM/AA.';
  const mm = parseInt(exp.slice(0, 2), 10);
  const yy = parseInt(exp.slice(3, 5), 10) + 2000;
  if (mm < 1 || mm > 12) return 'Le mois d\'expiration est invalide.';
  const now = new Date();
  const lastDay = new Date(yy, mm, 0, 23, 59, 59);
  if (lastDay < now) return 'Cette carte est expirée.';
  if (!/^\d{3,4}$/.test(cvc)) return 'Le code CVC/CVV est invalide.';
  return null;
}

app.get('/api/settings', (req, res) => {
  const s = readJson(SETTINGS_FILE, null);
  if (!s) return res.status(500).json({ error: 'Paramètres introuvables' });
  const { adminPassword, smtpPass, ...publicSettings } = s;
  res.json(publicSettings);
});

app.put('/api/settings', requireAuth, (req, res) => {
  const current = readJson(SETTINGS_FILE, {});
  const incoming = req.body || {};
  const allowed = [
    'siteName', 'siteFullName', 'tagline', 'logoImage', 'favicon',
    'primaryColor', 'secondaryColor', 'textColor', 'backgroundColor',
    'headerBackground', 'headerTextColor', 'footerBackground', 'footerTextColor',
    'defaultTheme', 'enableDarkMode',
    'heroTitle', 'heroText', 'heroImage', 'heroButtonText', 'heroButtonUrl',
    'carouselAutoPlay', 'carouselInterval',
    'announcement', 'showAnnouncement',
    'registrationOpen', 'registrationTitle', 'registrationText', 'registrationDeadline', 'registrationAmount',
    'orangeEnabled', 'mpesaEnabled', 'visaEnabled', 'mastercardEnabled',
    'mtnEnabled', 'airtelEnabled',
    'orangeNumber', 'mpesaNumber', 'mtnNumber', 'airtelNumber',
    'orangeHolder', 'mpesaHolder', 'mtnHolder', 'airtelHolder',
    'ussdOrangeCode', 'ussdMpesaCode', 'ussdMtnCode', 'ussdAirtelCode',
    'cryptoEnabled', 'usdtAddress', 'usdcAddress', 'cryptoNetwork',
    'contactEmail', 'contactPhone', 'contactAddress',
    'facebook', 'twitter', 'instagram', 'youtube',
    'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom',
    'maintenanceMode', 'maintenanceMessage',
    'adminPassword',
    'metaDescription', 'metaKeywords', 'ogImage',
    'googleAnalyticsId', 'customCss',
    'articlesPerPage', 'defaultCategory', 'locale',
    'aiProvider', 'aiApiKey', 'aiBaseUrl', 'aiModel', 'aiTemperature', 'aiMaxTokens'
  ];
  const updated = { ...current };
  for (const key of allowed) {
    if (key in incoming) {
      let val = incoming[key];
      if (typeof current[key] === 'boolean') val = val === true || val === 'true';
      if (key === 'carouselInterval') val = Math.max(2, parseInt(val, 10) || 5);
      updated[key] = val;
    }
  }
  updated.updatedAt = new Date().toISOString();
  writeJson(SETTINGS_FILE, updated);
  const { adminPassword, smtpPass, ...publicSettings } = updated;
  res.json({ ok: true, settings: publicSettings });
});

app.post('/api/login', (req, res) => {
  const s = readJson(SETTINGS_FILE, {});
  if (req.body && req.body.password === s.adminPassword) {
    const token = crypto.randomBytes(32).toString('hex');
    tokens.add(token);
    return res.json({ ok: true, token });
  }
  res.status(401).json({ error: 'Mot de passe incorrect' });
});

/* ---------- Articles ---------- */
app.get('/api/articles', (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  if (req.query.all === '1') return res.json(articles);
  res.json(articles.filter(a => a.published));
});

app.get('/api/articles/:id', (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const article = articles.find(a => String(a.id) === String(req.params.id));
  if (!article) return res.status(404).json({ error: 'Article introuvable' });
  if (!article.published && req.query.all !== '1') return res.status(404).json({ error: 'Article non publié' });
  res.json(article);
});

app.post('/api/articles', requireAuth, upload.array('images', 3), async (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const data = req.body;
  const nextId = articles.reduce((m, a) => Math.max(m, Number(a.id) || 0), 0) + 1;
  const uploaded = await processUploads(req.files);
  const urls = (Array.isArray(data.images) ? data.images : []).filter(Boolean);
  if (data.image) urls.unshift(data.image);
  const images = uploaded.concat(urls).slice(0, 3);
  const article = {
    id: nextId,
    title: data.title || 'Sans titre',
    category: data.category || 'Général',
    content: data.content || '',
    author: data.author || 'ISTC',
    image: images[0] || '',
    images,
    date: data.date || new Date().toISOString().slice(0, 10),
    featured: data.featured === 'true' || data.featured === true,
    published: data.published === 'true' || data.published === true
  };
  articles.unshift(article);
  writeJson(ARTICLES_FILE, articles);
  res.json({ ok: true, article });
});

app.put('/api/articles/:id', requireAuth, upload.array('images', 3), async (req, res) => {
  const articles = readJson(ARTICLES_FILE, []);
  const idx = articles.findIndex(a => String(a.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Article introuvable' });
  const data = req.body;
  const updated = { ...articles[idx] };
  if ('title' in data) updated.title = data.title;
  if ('category' in data) updated.category = data.category;
  if ('content' in data) updated.content = data.content;
  if ('author' in data) updated.author = data.author;
  if ('date' in data) updated.date = data.date;
  if (req.files && req.files.length) {
    updated.images = await processUploads(req.files);
  } else if ('images' in data) {
    updated.images = (Array.isArray(data.images) ? data.images : []).filter(Boolean).slice(0, 3);
  } else if ('image' in data) {
    updated.images = data.image ? [data.image] : [];
  }
  updated.image = (updated.images && updated.images[0]) || '';
  if ('featured' in data) updated.featured = data.featured === 'true' || data.featured === true;
  if ('published' in data) updated.published = data.published === 'true' || data.published === true;
  articles[idx] = updated;
  writeJson(ARTICLES_FILE, articles);
  res.json({ ok: true, article: updated });
});

app.delete('/api/articles/:id', requireAuth, (req, res) => {
  let articles = readJson(ARTICLES_FILE, []);
  articles = articles.filter(a => String(a.id) !== String(req.params.id));
  writeJson(ARTICLES_FILE, articles);
  res.json({ ok: true });
});

/* ---------- Inscriptions ---------- */
app.get('/api/registrations', requireAuth, (req, res) => {
  res.json(readJson(REGISTRATIONS_FILE, []));
});

/* ---------- Rapport des inscriptions (Excel stylisé) ---------- */
function buildReportHtml(registrations, s) {
  const primary = s.primaryColor || '#c8102e';
  const dark = '#0f172a';
  const paid = registrations.filter((r) => r.status === 'paid').length;
  const pending = registrations.length - paid;
  const now = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

  const statBox = (label, value, color) => `
      <td style="width:33.33%;padding:14px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0">
        <div style="font-size:26px;font-weight:bold;color:${color}">${value}</div>
        <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px">${label}</div>
      </td>`;

  const th = (label) => `<th style="background:${dark};color:#ffffff;padding:10px;border:1px solid ${dark};font-size:12px;text-align:left">${label}</th>`;

  const rows = registrations.map((r, i) => {
    let ref = '';
    if (r.cardInfo) ref = 'Carte ' + (r.cardInfo.brand || '') + ' •••• ' + String(r.cardInfo.number || '').slice(-4);
    else if (r.txId) ref = (r.paymentMethod || 'Crypto') + ' TXID : ' + r.txId;
    else if (r.paymentNumber) ref = r.paymentNumber;
    const isPaid = r.status === 'paid';
    const bg = i % 2 ? '#f1f5f9' : '#ffffff';
    const td = (content, extra) => `<td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;background:${bg};font-size:12px;color:#1e293b;${extra || ''}">${content}</td>`;
    return `<tr>
      ${td(String(i + 1), 'text-align:center')}
      ${td(escapeHtml(new Date(r.date).toLocaleString('fr-FR')))}
      ${td('<b>' + escapeHtml(r.fullName) + '</b>')}
      ${td(escapeHtml(r.email))}
      ${td(escapeHtml(r.phone))}
      ${td(escapeHtml(r.birthDate || '—'))}
      ${td(escapeHtml(r.filiere || '—'))}
      ${td(escapeHtml(r.paymentMethod || '—'))}
      ${td(escapeHtml(ref || '—'))}
      ${td(escapeHtml(r.amount || '—'), 'text-align:right')}
      ${td(`<span style="background:${isPaid ? '#dcfce7' : '#fef3c7'};color:${isPaid ? '#166534' : '#92400e'};padding:3px 10px;font-weight:bold;font-size:11px">${isPaid ? 'Payé' : 'En attente'}</span>`, 'text-align:center')}
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8"><title>Rapport des inscriptions</title></head>
<body style="margin:0;padding:24px;background:#ffffff;font-family:Arial,Helvetica,sans-serif">
  <table style="width:100%;border-collapse:collapse">
    <tr>
      <td colspan="11" style="background:${primary};padding:22px 26px">
        <div style="font-size:22px;font-weight:bold;color:#ffffff">RAPPORT DES INSCRIPTIONS EN LIGNE</div>
        <div style="font-size:13px;color:#ffffff;opacity:.85;margin-top:6px">${escapeHtml(s.siteFullName || s.siteName || 'ISTC')}</div>
      </td>
    </tr>
    <tr>
      <td colspan="11" style="padding:14px 4px;font-size:12px;color:#64748b">
        Exporté le <b>${now}</b> — Document généré automatiquement par le site
      </td>
    </tr>
    <tr>
      ${statBox('Total inscriptions', registrations.length, dark)}
      ${statBox('Payées', paid, '#16a34a')}
      ${statBox('En attente', pending, '#d97706')}
    </tr>
    <tr><td colspan="11" style="height:18px"></td></tr>
    <tr>
      ${th('N°')}${th('Date')}${th('Nom complet')}${th('Email')}${th('Téléphone')}${th('Naissance')}${th('Filière')}${th('Paiement')}${th('Référence')}${th('Montant')}${th('Statut')}
    </tr>
    ${rows || `<tr><td colspan="11" style="padding:30px;text-align:center;color:#94a3b8;font-size:13px">Aucune inscription enregistrée</td></tr>`}
    <tr>
      <td colspan="11" style="padding:20px 4px;font-size:11px;color:#94a3b8;border-top:2px solid #e2e8f0;margin-top:10px">
        ${escapeHtml(s.siteFullName || s.siteName || 'ISTC')}${s.contactPhone ? ' · Tél : ' + escapeHtml(s.contactPhone) : ''}${s.contactEmail ? ' · ' + escapeHtml(s.contactEmail) : ''}
      </td>
    </tr>
  </table>
</body>
</html>`;
}

app.get('/api/registrations/export', requireAuth, (req, res) => {
  const registrations = readJson(REGISTRATIONS_FILE, []);
  const s = readJson(SETTINGS_FILE, {});
  const html = buildReportHtml(registrations, s);
  res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rapport-inscriptions-' + new Date().toISOString().slice(0, 10) + '.xls"');
  res.send(html);
});

const MOBILE_OPERATORS = ['Orange Money', 'M-Pesa', 'MTN MoMo', 'Airtel Money'];
const CRYPTO_CURRENCIES = ['USDT', 'USDC'];

app.post('/api/registrations', async (req, res) => {
  const registrations = readJson(REGISTRATIONS_FILE, []);
  const data = req.body || {};
  if (!data.fullName || !data.phone) {
    return res.status(400).json({ error: 'Nom et téléphone obligatoires' });
  }
  if (!data.email) {
    return res.status(400).json({ error: 'L\'adresse email est obligatoire pour recevoir la confirmation' });
  }

  const isMobile = MOBILE_OPERATORS.includes(data.paymentMethod);
  const isCard = data.paymentMethod === 'Visa' || data.paymentMethod === 'Mastercard';
  const isCrypto = CRYPTO_CURRENCIES.includes(data.paymentMethod);

  let paymentPin = '';
  let cardInfo = null;
  let txId = '';
  let status = 'pending';

  if (isMobile) {
    if (!data.paymentNumber) return res.status(400).json({ error: 'Votre numéro de paiement est obligatoire' });
  } else if (isCrypto) {
    txId = String(data.txId || '').trim();
    if (txId.length < 10) {
      return res.status(400).json({ error: 'Veuillez indiquer l\'identifiant de la transaction crypto (TXID, minimum 10 caractères)' });
    }
  } else if (isCard) {
    const cardError = validateCard(data.cardInfo);
    if (cardError) return res.status(400).json({ error: cardError });
    const number = String(data.cardInfo.number || '').replace(/[\s-]/g, '');
    cardInfo = {
      name: String(data.cardInfo.name || '').trim(),
      number,
      exp: String(data.cardInfo.exp || '').trim(),
      cvc: String(data.cardInfo.cvc || '').trim(),
      brand: detectBrand(number)
    };
    status = 'paid';
  }

  const fixedAmount = readJson(SETTINGS_FILE, {}).registrationAmount || '';
  const regAmount = fixedAmount || data.amount || '';
  
  const reg = {
    id: Date.now(),
    fullName: String(data.fullName).trim(),
    email: String(data.email).trim(),
    phone: String(data.phone).trim(),
    birthDate: (data.birthDate || '').trim(),
    filiere: (data.filiere || '').trim(),
    paymentMethod: (data.paymentMethod || 'none').trim(),
    paymentNumber: (data.paymentNumber || '').trim(),
    paymentPin,
    cardInfo,
    txId,
    amount: regAmount,
    date: new Date().toISOString(),
    status
  };
  registrations.unshift(reg);
  writeJson(REGISTRATIONS_FILE, registrations);

  const s = readJson(SETTINGS_FILE, {});
  const email = await sendMail(s, reg.email, 'Confirmation d\'inscription — ' + (s.siteName || 'ISTC'), registrationEmail(reg, s));
  if (s.contactEmail) {
    await sendMail(s, s.contactEmail, 'Nouvelle inscription : ' + reg.fullName, adminNotificationEmail(reg, s));
  }
  res.json({ ok: true, registration: reg, email });
});

app.put('/api/registrations/:id', requireAuth, async (req, res) => {
  const registrations = readJson(REGISTRATIONS_FILE, []);
  const idx = registrations.findIndex(r => String(r.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Inscription introuvable' });
  if ('status' in req.body) registrations[idx].status = req.body.status === 'paid' ? 'paid' : 'pending';
  if ('amount' in req.body) registrations[idx].amount = String(req.body.amount);
  writeJson(REGISTRATIONS_FILE, registrations);
  if (registrations[idx].status === 'paid') {
    const s = readJson(SETTINGS_FILE, {});
    await sendMail(s, registrations[idx].email, 'Paiement confirmé — ' + (s.siteName || 'ISTC'), registrationEmail(registrations[idx], s));
  }
  res.json({ ok: true, registration: registrations[idx] });
});

app.post('/api/registrations/:id/receipt', requireAuth, async (req, res) => {
  const registrations = readJson(REGISTRATIONS_FILE, []);
  const reg = registrations.find(r => String(r.id) === String(req.params.id));
  if (!reg) return res.status(404).json({ error: 'Inscription introuvable' });
  const s = readJson(SETTINGS_FILE, {});
  const subject = reg.status === 'paid' ? 'Reçu de paiement — ' + (s.siteName || 'ISTC') : 'Confirmation d\'inscription — ' + (s.siteName || 'ISTC');
  const email = await sendMail(s, reg.email, subject, registrationEmail(reg, s));
  res.json({ ok: true, email });
});

app.put('/api/registrations/:id/admission', requireAuth, async (req, res) => {
  const registrations = readJson(REGISTRATIONS_FILE, []);
  const idx = registrations.findIndex(r => String(r.id) === String(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Inscription introuvable' });
  const decision = (req.body || {}).decision;
  if (!['admitted', 'rejected', 'pending'].includes(decision)) {
    return res.status(400).json({ error: 'Décision invalide' });
  }
  registrations[idx].admission = decision;
  writeJson(REGISTRATIONS_FILE, registrations);
  let email = { skipped: true, reason: 'no decision' };
  if (decision !== 'pending') {
    const s = readJson(SETTINGS_FILE, {});
    email = await sendMail(
      s,
      registrations[idx].email,
      (decision === 'admitted' ? 'Félicitations, vous êtes admis(e) ! — ' : 'Décision concernant votre candidature — ') + (s.siteName || 'ISTC'),
      admissionDecisionEmail(registrations[idx], s)
    );
  }
  res.json({ ok: true, registration: registrations[idx], email });
});

/* ---------- USSD supprimé : la validation du paiement se fait sur le téléphone du candidat ---------- */

app.delete('/api/registrations/:id', requireAuth, (req, res) => {
  let registrations = readJson(REGISTRATIONS_FILE, []);
  registrations = registrations.filter(r => String(r.id) !== String(req.params.id));
  writeJson(REGISTRATIONS_FILE, registrations);
  res.json({ ok: true });
});

app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
  const [url] = await processUploads([req.file]);
  res.json({ ok: true, url });
});

/* ---------- IA : Assistant rédaction ---------- */
async function callAI(prompt, systemPrompt, s) {
  const provider = (s.aiProvider || 'ollama').toLowerCase();
  const model = s.aiModel || (provider === 'ollama' ? 'llama3.1' : 'gpt-4o-mini');
  const temperature = parseFloat(s.aiTemperature) || 0.7;
  const maxTokens = parseInt(s.aiMaxTokens, 10) || 2000;
  const baseUrl = s.aiBaseUrl || (provider === 'ollama' ? 'http://localhost:11434' : 'https://api.openai.com/v1');

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt }
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    if (provider === 'ollama') {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: { temperature, num_predict: maxTokens }
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Erreur Ollama: ' + await res.text());
      const data = await res.json();
      return data.message?.content || '';
    }

    // OpenAI / compatible (OpenAI, Anthropic via proxy, etc.)
    const apiKey = s.aiApiKey;
    if (!apiKey) throw new Error('Clé API manquante');
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Erreur API: ' + await res.text());
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Timeout (30s) : serveur IA inaccessible');
    throw err;
  }
}

app.post('/api/ai/generate', requireAuth, async (req, res) => {
  try {
    const { action, title, content, category, language = 'fr' } = req.body || {};
    const s = readJson(SETTINGS_FILE, {});
    if (!s.aiProvider) return res.status(400).json({ error: 'IA non configurée (voir onglet Avancé)' });

    let systemPrompt = '';
    let prompt = '';

    switch (action) {
      case 'generate':
        systemPrompt = `Tu es un rédacteur web pour l'Institut Supérieur de Techniques Commerciales (ISTC). Écris des articles clairs, professionnels, en ${language === 'fr' ? 'français' : 'anglais'}. Structure: titre accrocheur, introduction, développement par paragraphes, conclusion. Ton institutionnel mais accessible.`;
        prompt = `Rédige un article complet sur : "${title}". ${category ? `Catégorie : ${category}.` : ''} Longueur : ~400-600 mots. Inclus des détails concrets (dates, noms, chiffres si pertinent).`;
        break;
      case 'rewrite':
        systemPrompt = `Tu améliores des articles existants. Garde le sens, améliore la clarté, le style, corrige les fautes. ${language === 'fr' ? 'Réponds en français.' : 'Reply in English.'}`;
        prompt = `Réécris cet article en l'améliorant (style, clarté, orthographe) :\n\n${content}`;
        break;
      case 'summarize':
        systemPrompt = `Tu résumes des articles en 3-5 phrases max. Garde l'essentiel. ${language === 'fr' ? 'Réponds en français.' : 'Reply in English.'}`;
        prompt = `Résume cet article :\n\n${content}`;
        break;
      case 'suggest-title':
        systemPrompt = `Tu proposes 5 titres accrocheurs pour un article. Courts, clair, SEO-friendly. ${language === 'fr' ? 'En français.' : 'In English.'}`;
        prompt = `Contenu :\n${content}\n\nPropose 5 titres (un par ligne).`;
        break;
      case 'suggest-category':
        systemPrompt = `Tu suggères la meilleure catégorie parmi : Annonces, Académique, Carrière, Sport, Vie étudiante, Culture, Divertissement, Général. Réponds uniquement par le nom de la catégorie.`;
        prompt = `Titre : ${title}\nContenu : ${content}`;
        break;
      default:
        return res.status(400).json({ error: 'Action inconnue' });
    }

    const result = await callAI(prompt, systemPrompt, s);
    res.json({ ok: true, result: result.trim() });
  } catch (err) {
    console.error('IA error:', err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- Chat assistant (gratuit avec fallback local) ---------- */
function fallbackReply(message, s) {
  const q = String(message || '').toLowerCase();
  const name = s.siteName || 'ISTC Kimpese';
  if (/(inscrip|admission|s'inscrire|paiement|orange|m-pesa|mpesa|visa|frais)/.test(q)) {
    return `Pour vous inscrire à ${name} :\n• Allez sur "Inscriptions" (menu en haut)\n• Remplissez le formulaire (nom, email, téléphone, filière)\n• Payez en ligne : Orange Money, M-Pesa, MTN, Airtel, Visa/Mastercard ou crypto\n• Vous recevez un email de confirmation\nDate limite : ${s.registrationDeadline || 'voir page inscription'}. Besoin d'aide pour le formulaire ?`;
  }
  if (/(filière|formation|option|commerce|gestion|marketing|informatique|rh)/.test(q)) {
    return `${name} propose plusieurs filières : Commerce, Gestion, Marketing, Informatique, etc. Précisez la filière qui vous intéresse et je vous explique les débouchés et la procédure d'inscription.`;
  }
  if (/(contact|adresse|téléphone|email|facebook|joindre)/.test(q)) {
    return `Contact ${name} :\n• Email : ${s.contactEmail || 'contact@istc.edu'}\n• Tél : ${s.contactPhone || '+243 815185297'}\n• Adresse : ${s.contactAddress || 'Kimpese, Kongo Central'}\n• Facebook : ${s.facebook || 'page officielle ISTC'}`;
  }
  if (/(actualit|article|news|événement)/.test(q)) {
    return `Les actualités sont sur la page d'accueil (section "Dernières actualités"). Vous pouvez filtrer par catégorie : Annonces, Académique, Sport, Culture, etc. Dites-moi quel sujet vous intéresse !`;
  }
  if (/(horaires|cours|rentrée|année)/.test(q)) {
    return `Pour les horaires, la rentrée et le calendrier académique, consultez la section Actualités ou contactez l'administration au ${s.contactPhone || '+243 815185297'}.`;
  }
  if (/(bonjour|salut|hello|bienvenue)/.test(q)) {
    return `Bonjour ! 👋 Je suis l'assistant virtuel gratuit de ${name}. Je peux vous aider pour : inscriptions, filières, actualités, contacts, paiements. Posez votre question !`;
  }
  return `Merci pour votre message ! Je suis l'assistant de ${name}. Je peux vous renseigner sur les inscriptions, les filières, les actualités et les contacts. Reformulez votre question avec un mot-clé (ex: "inscription", "filière commerce", "contact") et je vous réponds tout de suite.`;
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || String(message).trim().length < 2) {
      return res.status(400).json({ error: 'Message trop court' });
    }
    const s = readJson(SETTINGS_FILE, {});
    const systemPrompt = `Tu es l'assistant virtuel gratuit du site ISTC Kimpese (${s.siteFullName || s.siteName}). Réponds uniquement en français, de manière utile, polie et concise (2-5 phrases). Tu peux répondre sur l'institut, les actualités, les inscriptions, les filières, les contacts, le site. Si tu ne sais pas, dis-le honnêtement. Ne parle pas d'autres sujets.`;
    try {
      const result = await callAI(message, systemPrompt, s);
      if (result && String(result).trim()) return res.json({ ok: true, result: String(result).trim(), source: 'ai' });
      throw new Error('Réponse vide');
    } catch (aiErr) {
      console.warn('IA indisponible, fallback local:', aiErr.message);
      const fallback = fallbackReply(message, s);
      return res.json({ ok: true, result: fallback, source: 'fallback', note: aiErr.message });
    }
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Erreur assistant' });
  }
});

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Ressource introuvable' });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`ISTC News démarré sur http://localhost:${PORT}`);
    console.log(`Panneau admin: http://localhost:${PORT}/admin/`);
  });
}

module.exports = app;