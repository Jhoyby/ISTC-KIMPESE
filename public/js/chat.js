(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let open = false;
  let messages = [];
  let loading = false;

  function ensureWidget() {
    if (document.getElementById('chatWidget')) return;
    const widget = document.createElement('div');
    widget.id = 'chatWidget';
    widget.innerHTML = `
      <button id="chatToggle" aria-label="Ouvrir l'assistant" title="Assistant ISTC">
        <span id="chatBubbleIcon">💬</span>
        <span id="chatBadge" class="hidden">1</span>
      </button>
      <div id="chatPanel" class="hidden">
        <div id="chatHeader">
          <strong>🤖 Assistant ISTC</strong>
          <button id="chatClose" aria-label="Fermer">✕</button>
        </div>
        <div id="chatMessages"></div>
        <div id="chatInputArea">
          <input id="chatInput" type="text" placeholder="Posez votre question…" maxlength="500" autocomplete="off">
          <button id="chatSend" aria-label="Envoyer">➤</button>
        </div>
      </div>`;
    document.body.appendChild(widget);

    $('#chatToggle').addEventListener('click', toggle);
    $('#chatClose').addEventListener('click', toggle);
    $('#chatSend').addEventListener('click', send);
    $('#chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    });
  }

  function toggle() {
    open = !open;
    const panel = $('#chatPanel');
    const toggle = $('#chatToggle');
    if (open) {
      panel.classList.remove('hidden');
      toggle.setAttribute('aria-label', 'Fermer l\'assistant');
      const input = $('#chatInput');
      if (input) setTimeout(() => input.focus(), 100);
    } else {
      panel.classList.add('hidden');
      toggle.setAttribute('aria-label', 'Ouvrir l\'assistant');
      const badge = $('#chatBadge');
      if (badge) badge.classList.add('hidden');
    }
  }

  function addMessage(text, sender) {
    const container = $('#chatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-msg chat-' + sender;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function setTyping(typing) {
    const container = $('#chatMessages');
    if (!container) return;
    let indicator = container.querySelector('.chat-typing');
    if (typing) {
      if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'chat-msg chat-typing';
        indicator.textContent = '⏳ L\'assistant tape…';
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
      }
    } else if (indicator) {
      indicator.remove();
    }
  }

  function localFallback(q) {
    const s = q.toLowerCase();
    if (/(inscrip|admission|s'inscrire|paiement|orange|m-pesa|mpesa|visa|frais)/.test(s)) return "Pour vous inscrire : menu Inscriptions → formulaire (nom, email, téléphone, filière) → paiement Orange Money / M-Pesa / MTN / Airtel / Visa / crypto. Vous recevez un email de confirmation. Date limite : 2026-10-15.";
    if (/(filière|formation|option|commerce|gestion|marketing|informatique|rh)/.test(s)) return "Filières ISTC : Commerce, Gestion, Marketing, Informatique, etc. Dites-moi la filière qui vous intéresse !";
    if (/(contact|adresse|téléphone|email|facebook|joindre)/.test(s)) return "Contact ISTC : contact@istc.edu | +243 815185297 | Kimpese, Kongo Central | Facebook: Jhoyby Nzau";
    if (/(actualit|article|news|événement)/.test(s)) return "Actualités sur la page d'accueil → filtrez par Annonces, Académique, Sport, Culture... Quel sujet vous intéresse ?";
    if (/(bonjour|salut|hello)/.test(s)) return "Bonjour ! 👋 Je suis l'assistant ISTC (mode hors-ligne gratuit). Posez votre question : inscription, filière, contact...";
    return "Merci ! Je suis l'assistant gratuit ISTC (hors-ligne). Essayez : 'inscription', 'filière commerce', 'contact'.";
  }

  async function send() {
    const input = $('#chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text || loading) return;
    input.value = '';
    addMessage(text, 'user');
    loading = true;
    setTyping(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      setTyping(false);
      if (data.ok && data.result) { addMessage(data.result.trim(), 'assistant'); }
      else if (data.result) { addMessage(data.result.trim(), 'assistant'); }
      else { addMessage(localFallback(text), 'assistant'); }
    } catch (e) {
      setTyping(false);
      addMessage(localFallback(text) + " (réponse locale — serveur IA indisponible sur GitHub Pages)", 'assistant');
    }
    loading = false;
  }

  function init() {
    ensureWidget();
    addMessage('Bonjour ! 👋 Je suis l\'assistant de l\'ISTC Kimpese. Posez-moi vos questions (actualités, inscriptions, filières, contact…)', 'assistant');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();