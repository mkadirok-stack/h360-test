// Sabit WhatsApp canlı destek düğmesi. Mesai (Türkiye saati): Pazartesi-Cuma 10:00 - 16:00
(function () {
  const _t = window.t || (s => s);
  const START = 10, END = 16;
  const num = (window.H360 && window.H360.WA_NUMBER) || '900000000000';
  let wa = document.getElementById('wa-float');
  if (!wa) {
    wa = document.createElement('a');
    wa.id = 'wa-float';
    wa.className = 'wa-float';
    wa.target = '_blank';
    wa.rel = 'noopener';
    wa.setAttribute('aria-label', _t('WhatsApp canlı destek'));
    wa.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(_t('Merhaba, bilgi almak istiyorum.'));
    wa.innerHTML = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="#fff" d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.3.6 4.4 1.7 6.3L3 29l7.4-2c1.8 1 3.8 1.5 5.6 1.5 7 0 12.6-5.600 12.600-12.500S23 3 16 3zm0 22.800c-1.800 0-3.500-.5-5-1.400l-.4-.2-4.400 1.200 1.200-4.300-.3-.4a10 10 0 0 1-1.500-5.300C5.600 9.900 10.300 5.400 16 5.400s10.400 4.500 10.400 10.100S21.700 25.800 16 25.800zm5.700-7.500c-.3-.2-1.800-.9-2.100-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.200-.2.200-.3.200-.6.100-.3-.2-1.300-.5-2.500-1.500-.9-.8-1.500-1.800-1.700-2.100-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-1-2.300c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.100 1.100-1.100 2.600s1.100 3 1.300 3.200c.2.200 2.200 3.400 5.400 4.700 3.200 1.300 3.200.9 3.800.8.600-.1 1.800-.7 2.100-1.500.3-.7.3-1.300.2-1.500-.1-.1-.3-.2-.6-.4z"/></svg><span id="wa-label">Canlı Destek</span>';
    document.body.appendChild(wa);
  }
  const label = document.getElementById('wa-label');
  const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', hour: 'numeric', hourCycle: 'h23', timeZone: 'Europe/Istanbul' }).formatToParts(new Date());
  const hour = Number(parts.find(p => p.type === 'hour').value);
  const day = parts.find(p => p.type === 'weekday').value;
  const open = day !== 'Sat' && day !== 'Sun' && hour >= START && hour < END;
  wa.classList.toggle('off', !open);
  if (label) label.textContent = open ? 'Canlı Destek' : 'Şu an kapalıyız · Mesaj bırakın';
})();

// Sabit TCMB kur tablosu (USD / EUR, alış - satış). Veri: Supabase fx_rates tablosu (TCMB günlük kurları).
(function () {
  const cfg = window.H360;
  if (!cfg) return;
  const _t = window.t || ((s, v) => v ? s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)) : s);
  const LOC = (window.I18N && window.I18N.locale) || 'tr-TR';
  const fmt = n => (n === null || n === undefined) ? '—' :
    new Intl.NumberFormat(LOC, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(n);
  const dt = d => new Date(d + 'T00:00:00').toLocaleDateString(LOC);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const box = document.createElement('aside');
  box.className = 'fxbox';
  box.setAttribute('aria-label', _t('TCMB döviz kurları'));
  document.body.appendChild(box);

  let collapsed = window.innerWidth < 700;
  try { const s = localStorage.getItem('fxCollapsed'); if (s !== null) collapsed = s === '1'; } catch (e) {}
  let rows = null;

  function table(r, title) {
    return '<div class="fx-title">' + title + '</div>' +
      '<table><thead><tr><th>Döviz</th><th>Alış</th><th>Satış</th></tr></thead><tbody>' +
      '<tr><td>USD</td><td>' + fmt(r.usd_buy) + '</td><td>' + fmt(r.usd_sell) + '</td></tr>' +
      '<tr><td>EUR</td><td>' + fmt(r.eur_buy) + '</td><td>' + fmt(r.eur_sell) + '</td></tr></tbody></table>';
  }

  function render() {
    const head = '<button type="button" class="fx-head" aria-expanded="' + !collapsed + '"><span>TCMB Kurları</span><span class="fx-arrow">' + (collapsed ? '▲' : '▼') + '</span></button>';
    if (collapsed || !rows) { box.innerHTML = head; box.classList.toggle('open', !collapsed); bind(); return; }
    box.classList.add('open');
    let body = table(rows.cur, _t('Bugün geçerli · {d} ilanı', { d: dt(rows.cur.rate_date) }));
    if (rows.next) body += table(rows.next, _t('Sonraki iş günü · {d} ilanı', { d: dt(rows.next.rate_date) }));
    box.innerHTML = head + '<div class="fx-body">' + body + '<div class="fx-note">Kaynak: T.C. Merkez Bankası (döviz alış/satış). Fiyatlar + KDV. Faturalandırmada döviz satış kuru esas alınır.</div></div>';
    bind();
  }
  function bind() {
    const b = box.querySelector('.fx-head');
    if (b) b.addEventListener('click', () => {
      collapsed = !collapsed;
      try { localStorage.setItem('fxCollapsed', collapsed ? '1' : '0'); } catch (e) {}
      render();
    });
  }

  render();
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());
  fetch(cfg.SUPABASE_URL + '/rest/v1/fx_rates?select=*&order=rate_date.desc&limit=4', {
    headers: { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + cfg.SUPABASE_KEY }
  }).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(data => {
    if (!data || !data.length) return;
    const cur = data.find(r => r.rate_date < today) || data[data.length - 1];
    const next = data.filter(r => r.rate_date >= today).pop() || null;
    rows = { cur, next };
    render();
  }).catch(() => { box.style.display = 'none'; });
})();
