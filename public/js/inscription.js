(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let settings = {};
  let selectedPayment = '';
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

    document.title = s.siteName + ' — Inscription';
    $('#brandName').textContent = s.siteName;
    $('#brandFullName').textContent = s.siteFullName;
    $('#footerBrand').textContent = s.siteName;
    $('#footerTagline').textContent = s.tagline;
    $('#regTitle').textContent = s.registrationTitle || 'Inscriptions à distance';
    $('#regText').textContent = s.registrationText || '';
    $('#copyright').textContent = `© ${new Date().getFullYear()} ${s.siteName}. Tous droits réservés.`;

    if (s.registrationDeadline) {
      $('#deadlineBox').textContent = '📅 Date limite : ' + formatDate(s.registrationDeadline);
    } else {
      $('#deadlineBox').style.display = 'none';
    }

    const regAmount = s.registrationAmount || '';
    if (regAmount) {
      $('#r-amount').value = regAmount;
      $('#r-amount').readOnly = true;
      $('#r-amount').style.opacity = '0.6';
      $('#amountField') && (document.getElementById('amountField').style.display = 'none');
    } else {
      $('#r-amount').readOnly = false;
      $('#r-amount').style.opacity = '1';
      $('#amountField') && (document.getElementById('amountField').style.display = '');
    }

    renderLogo(s);

    const stored = localStorage.getItem('istc_theme');
    currentTheme = stored || s.defaultTheme || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    applyThemeColors();
    updateThemeIcon();
    if (!s.enableDarkMode) $('#themeToggle').classList.add('hidden');

    if (!s.registrationOpen) {
      $('#regFormWrap').innerHTML =
        '<div class="reg-success show"><div class="success-icon">⏸</div><h2>Inscriptions suspendues</h2>' +
        '<p>Les inscriptions à distance sont momentanément fermées. Contactez l\'administration de l\'ISTC.</p></div>';
      return;
    }

    renderPaymentOptions();
    renderInfoBadges();
    renderSocial(s);
  }

  function formatDate(d) {
    try {
      return new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      return d;
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

  /* ---------- Paiements (façon WeUnlocks) ---------- */
  const PAYMENT_METHODS = [
    { key: 'orangeEnabled', name: 'Orange Money', icon: '/images/payments/orange-money.svg', type: 'mobile' },
    { key: 'mpesaEnabled', name: 'M-Pesa', icon: '/images/payments/mpesa.svg', type: 'mobile' },
    { key: 'mtnEnabled', name: 'MTN MoMo', icon: '/images/payments/mtn-momo.svg', type: 'mobile' },
    { key: 'airtelEnabled', name: 'Airtel Money', icon: '/images/payments/airtel-money.svg', type: 'mobile' },
    { key: 'cryptoEnabled', name: 'USDT', icon: '/images/payments/usdt.svg', type: 'crypto' },
    { key: 'cryptoEnabled', name: 'USDC', icon: '/images/payments/usdc.svg', type: 'crypto' },
    { key: 'visaEnabled', name: 'Visa', icon: '/images/payments/visa.svg', type: 'card' },
    { key: 'mastercardEnabled', name: 'Mastercard', icon: '/images/payments/mastercard.svg', type: 'card' }
  ];

  const OPERATOR_LABELS = {
    'Orange Money': { num: 'orangeNumber', holder: 'orangeHolder' },
    'M-Pesa': { num: 'mpesaNumber', holder: 'mpesaHolder' },
    'MTN MoMo': { num: 'mtnNumber', holder: 'mtnHolder' },
    'Airtel Money': { num: 'airtelNumber', holder: 'airtelHolder' }
  };

  function methodType(name) {
    const m = PAYMENT_METHODS.find((x) => x.name === name);
    return m ? m.type : '';
  }

  function renderPaymentOptions() {
    const el = $('#paymentOptions');
    el.innerHTML = '';
    for (const m of PAYMENT_METHODS) {
      if (!settings[m.key]) continue;
      if (m.type === 'crypto' && m.name === 'USDC' && !settings.usdcAddress) continue;
      if (m.type === 'crypto' && m.name === 'USDT' && !settings.usdtAddress) continue;
      const label = document.createElement('label');
      label.className = 'payment-option';
      label.innerHTML = `
        <input type="radio" name="payment" value="${m.name}">
        <span class="option-card">
          <img class="pay-logo" src="${m.icon}" alt="${m.name}">${m.name}
        </span>`;
      label.querySelector('input').addEventListener('change', () => onPaymentChange(m.name));
      el.appendChild(label);
    }
  }

  function onPaymentChange(method) {
    selectedPayment = method;
    $('#regError').classList.add('hidden');
    const mobile = methodType(method) === 'mobile';
    const crypto = methodType(method) === 'crypto';
    $('#mobilePayField').classList.toggle('hidden', !mobile);
    $('#cardFields').classList.toggle('hidden', methodType(method) !== 'card');
    $('#cryptoFields').classList.toggle('hidden', !crypto);
    const info = $('#receptionInfo');
    if (mobile) {
      const labels = OPERATOR_LABELS[method];
      $('#mobilePayLabel').textContent = 'Votre numéro ' + method;
      $('#r-paymentNumber').placeholder = settings[labels.num] || '+243 ...';
      const number = settings[labels.num];
      const holder = settings[labels.holder];
      if (number || holder) {
        info.innerHTML = '💸 Le montant sera transféré sur le compte <strong>' + escapeHtml(holder || 'officiel de l\'institut') + '</strong>' + (number ? ' — <strong>' + escapeHtml(number) + '</strong>' : '') + '.';
        info.classList.remove('hidden');
      } else {
        info.classList.add('hidden');
      }
    } else {
      info.classList.add('hidden');
    }
    if (crypto) {
      const addr = method === 'USDT' ? settings.usdtAddress : settings.usdcAddress;
      const network = settings.cryptoNetwork || 'réseau compatible';
      $('#cryptoBox').innerHTML =
        '<div class="crypto-row"><span>Monnaie</span><b>' + method + '</b></div>' +
        '<div class="crypto-row"><span>Réseau</span><b>' + escapeHtml(network) + '</b></div>' +
        '<div class="crypto-row"><span>Adresse de réception</span><code class="crypto-address" id="cryptoAddr">' + escapeHtml(addr) + '</code></div>' +
        '<button type="button" class="btn btn-sm" id="copyAddrBtn">📋 Copier l\'adresse</button>';
      $('#copyAddrBtn').addEventListener('click', () => {
        navigator.clipboard.writeText(addr).then(() => {
          const b = $('#copyAddrBtn');
          b.textContent = '✓ Adresse copiée';
          setTimeout(() => { b.textContent = '📋 Copier l\'adresse'; }, 2000);
        });
      });
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderInfoBadges() {
    const el = $('#infoPaymentBadges');
    el.innerHTML = '';
    for (const m of PAYMENT_METHODS) {
      if (!settings[m.key]) continue;
      if (m.type === 'crypto' && m.name === 'USDC' && !settings.usdcAddress) continue;
      if (m.type === 'crypto' && m.name === 'USDT' && !settings.usdtAddress) continue;
      const badge = document.createElement('span');
      badge.className = 'payment-badge';
      badge.innerHTML = `<img class="pay-logo" src="${m.icon}" alt="${m.name}">${m.name}`;
      el.appendChild(badge);
    }
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

  /* ---------- Validation carte ---------- */
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

  function validCardInput() {
    const num = $('#r-cardNumber').value.replace(/\s/g, '');
    const exp = $('#r-cardExp').value.trim();
    const cvc = $('#r-cardCvc').value.trim();
    if (!/^\d{13,19}$/.test(num) || !luhn(num)) return 'Le numéro de carte est invalide.';
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

  /* ---------- Demande de paiement (validation sur le téléphone du candidat) ---------- */
  let payRequestReg = null;

  function openPaymentPrompt(reg) {
    payRequestReg = reg;
    const labels = OPERATOR_LABELS[reg.paymentMethod];
    const number = labels ? settings[labels.num] : '';
    const holder = labels ? settings[labels.holder] : '';
    const codeMap = {
      'Orange Money': settings.ussdOrangeCode || '*150#',
      'M-Pesa': settings.ussdMpesaCode || '*150*00#',
      'MTN MoMo': settings.ussdMtnCode || '*126#',
      'Airtel Money': settings.ussdAirtelCode || '*185#'
    };
    $('#ussdOperator').textContent = reg.paymentMethod;
    $('#ussdCode').textContent = codeMap[reg.paymentMethod] || '';
    $('#ussdBody').innerHTML =
      '<div class="ussd-text">' +
      '&#128241; Une demande de paiement a &#233;t&#233; envoy&#233;e sur votre num&#233;ro <b>' + escapeHtml(reg.paymentNumber) + '</b>.<br><br>' +
      'Un menu <b>' + escapeHtml(reg.paymentMethod) + '</b> va s&#39;afficher sur votre t&#233;l&#233;phone :' +
      '<div class="ussd-steps">' +
      '<div>1 · D&#233;bit de <b>' + escapeHtml(reg.amount || 'le montant convenu') + '</b></div>' +
      (number ? '<div>2 · Vers <b>' + escapeHtml(holder ? holder + ' · ' + number : number) + '</b></div>' : '') +
      '<div>' + (number ? '3' : '2') + ' · Saisissez votre code secret <b>sur votre t&#233;l&#233;phone</b> pour valider</div>' +
      '</div>' +
      '<small class="ussd-warn">&#128274; Pour votre s&#233;curit&#233;, ne communiquez jamais votre code secret sur un site web.</small>' +
      '</div>' +
      '<div class="ussd-btns">' +
      '<button class="ussd-btn primary" id="payValidatedBtn">&#10003; J&#39;ai valid&#233; sur mon t&#233;l&#233;phone</button>' +
      '<button class="ussd-btn" id="payLaterBtn">Payer plus tard</button>' +
      '</div>';
    $('#payValidatedBtn').addEventListener('click', () => finishPaymentFlow(true));
    $('#payLaterBtn').addEventListener('click', () => finishPaymentFlow(false));
    $('#ussdModal').classList.remove('hidden');
  }

  function finishPaymentFlow(validated) {
    $('#ussdModal').classList.add('hidden');
    if (validated) {
      $('#successTitle').textContent = 'Paiement en cours de vérification';
      $('#successMsg').innerHTML = 'Merci ! Dès réception effective des fonds sur le compte de l\'institut, votre inscription sera <strong>confirmée</strong> et un reçu vous sera envoyé par email.';
    } else {
      const codeMap = {
        'Orange Money': settings.ussdOrangeCode || '*150#',
        'M-Pesa': settings.ussdMpesaCode || '*150*00#',
        'MTN MoMo': settings.ussdMtnCode || '*126#',
        'Airtel Money': settings.ussdAirtelCode || '*185#'
      };
      $('#successTitle').textContent = 'Inscription enregistrée !';
      $('#successMsg').innerHTML = 'Votre inscription est enregistrée mais le paiement est en attente.<br>Vous pouvez composer <strong>' + codeMap[payRequestReg.paymentMethod] + '</strong> sur votre téléphone pour retrouver la demande de paiement. Contactez l\'administration en cas de difficulté.';
    }
    $('#regFormWrap').classList.add('hidden');
    $('#regSuccess').classList.add('show');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('#ussdBackdrop').addEventListener('click', () => {
    if (payRequestReg) finishPaymentFlow(false);
  });

  /* ---------- Formulaire ---------- */
  $('#regForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = $('#r-fullName').value.trim();
    const email = $('#r-email').value.trim();
    const phone = $('#r-phone').value.trim();
    const filiere = $('#r-filiere').value;
    if (!fullName || !phone || !filiere) {
      $('#regError').textContent = 'Veuillez remplir tous les champs obligatoires (*).';
      $('#regError').classList.remove('hidden');
      return;
    }
    if (!email) {
      $('#regError').textContent = 'L\'adresse email est obligatoire pour recevoir votre confirmation.';
      $('#regError').classList.remove('hidden');
      return;
    }
    if (!selectedPayment) {
      $('#regError').textContent = 'Veuillez choisir un mode de paiement.';
      $('#regError').classList.remove('hidden');
      return;
    }

    const isMobile = methodType(selectedPayment) === 'mobile';
    const isCrypto = methodType(selectedPayment) === 'crypto';
    if (isMobile && !$('#r-paymentNumber').value.trim()) {
      $('#regError').textContent = 'Veuillez indiquer votre numéro de paiement.';
      $('#regError').classList.remove('hidden');
      return;
    }
    if (isCrypto) {
      const tx = $('#r-txId').value.trim();
      if (!tx || tx.length < 10) {
        $('#regError').textContent = 'Veuillez coller l\'identifiant (hash) de votre transaction crypto, 10 caractères minimum.';
        $('#regError').classList.remove('hidden');
        return;
      }
    }
    if (!isMobile && !isCrypto) {
      const cardError = validCardInput();
      if (cardError) {
        $('#regError').textContent = cardError;
        $('#regError').classList.remove('hidden');
        return;
      }
    }

    const payload = {
      fullName,
      email,
      phone,
      birthDate: $('#r-birthDate').value,
      filiere,
      amount: $('#r-amount').value.trim(),
      paymentMethod: selectedPayment,
      paymentNumber: isMobile ? $('#r-paymentNumber').value.trim() : '',
      txId: isCrypto ? $('#r-txId').value.trim() : '',
      cardInfo: (isMobile || isCrypto) ? null : {
        name: $('#r-cardName').value.trim(),
        number: $('#r-cardNumber').value.trim(),
        exp: $('#r-cardExp').value.trim(),
        cvc: $('#r-cardCvc').value.trim()
      }
    };

    try {
      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'envoi');

      if (isMobile) {
        openPaymentPrompt(data.registration);
        return;
      }

      const paid = data.registration && data.registration.status === 'paid';
      $('#successTitle').textContent = paid ? 'Paiement confirmé !' : (isCrypto ? 'Inscription enregistrée — paiement en vérification' : 'Inscription enregistrée !');
      $('#successMsg').innerHTML = paid
        ? 'Votre paiement par carte a été <strong>accepté</strong> et votre inscription est validée.<br>Un reçu vient de vous être envoyé par email.'
        : 'Votre transaction <strong>' + escapeHtml(selectedPayment) + '</strong> a été enregistrée.<br>L\'administration va vérifier la transaction sur la blockchain et confirmera votre paiement par email.';
      $('#regFormWrap').classList.add('hidden');
      $('#regSuccess').classList.add('show');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      $('#regError').textContent = err.message;
      $('#regError').classList.remove('hidden');
    }
  });

  $('#r-cardNumber').addEventListener('input', (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
  });
  $('#r-cardExp').addEventListener('input', (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
    e.target.value = v.length > 2 ? v.slice(0, 2) + '/' + v.slice(2) : v;
  });

  async function init() {
    try {
      const res = await fetch('/api/settings');
      applySettings(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  init();
})();