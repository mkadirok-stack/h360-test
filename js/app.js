// Ortak yardımcılar: Supabase istemcisi, üst menü, oturum kontrolü
(function () {
  const cfg = window.H360;
  const L = (window.I18N && window.I18N.locale) || 'tr-TR';
  const tt = window.t || ((s, v) => v ? s.replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m)) : s);
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Fiyatlar USD. TL karşılığı TCMB döviz satış kuruyla hesaplanır.
  const money = n => (n === null || n === undefined || n === '') ? '' :
    new Intl.NumberFormat(L, { style: 'currency', currency: 'USD' }).format(n);
  const tl = (n, rate) => (n === null || n === undefined || n === '' || !rate) ? '' :
    '≈ ' + new Intl.NumberFormat(L, { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n * rate);
  const rateFmt = n => new Intl.NumberFormat(L, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(n);

  async function loadFx() {
    // TCMB her iş günü 15:30'da kuru ilan eder; kur ertesi iş günü geçerlidir.
    // Bugün geçerli kur: tarihi bugünden ÖNCE olan en yeni kayıt (dünkü ilan).
    // Tarihi bugün olan kayıt (15:30'dan sonra gelir) "sonraki iş günü kuru" olarak ayrıca gösterilir.
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Istanbul' }).format(new Date());
    const { data } = await sb.from('fx_rates').select('*').order('rate_date', { ascending: false }).limit(4);
    if (!data || !data.length) return null;
    const cur = data.find(r => r.rate_date < today) || data[data.length - 1];
    const next = data.filter(r => r.rate_date >= today).pop() || null;
    return Object.assign({}, cur, { next });
  }
  const waLink = text => 'https://wa.me/' + cfg.WA_NUMBER + '?text=' + encodeURIComponent(text);
  const dateTR = d => d ? new Date(d).toLocaleDateString(L) : '';

  async function getProfile() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    return data;
  }

  function renderHeader(p, fx) {
    const links = [['index.html', 'Ana Sayfa'], ['ilanlar.html', 'İlanlar'], ['haberler.html', 'Haberler'], ['nasil-calisir.html', 'Nasıl Çalışır']];
    if (p) links.push(['favorilerim.html', 'Favorilerim']);
    if (p && (p.role === 'seller' || p.role === 'admin')) links.push(['ilan-ver.html', 'İlan Ver']);
    if (p && p.role === 'admin') links.push(['admin.html', 'Yönetim']);
    const auth = p
      ? '<span class="who">' + esc(p.full_name || p.email) + '</span><button class="btn btn-sm" id="logout" type="button">Çıkış</button>'
      : '<a href="giris.html" class="btn btn-sm">Giriş / Üye Ol</a>';
    const host = document.getElementById('site-top');
    if (!host) return;
    host.innerHTML =
      '<div class="test-banner" role="note">⚠ Test yayınıdır. Site yapım aşamasındadır, bilgiler kesinleşmemiştir.</div>' +
      (fx ? '<div class="fxbar">' + tt('TCMB döviz satış kuru:') + ' <b>1 USD = ' + rateFmt(fx.usd_sell) + ' ₺</b> (' + tt('{d} tarihli TCMB ilanı', { d: dateTR(fx.rate_date) }) + ')' +
        (fx.next ? ' · ' + tt('Sonraki iş günü ({d} ilanı):', { d: dateTR(fx.next.rate_date) }) + ' <b>' + rateFmt(fx.next.usd_sell) + ' ₺</b>' : '') +
        '<span class="fxnote"> · ' + tt('Fiyatlar USD cinsindendir ve KDV hariçtir (KDV oranı ilana göre ayrıca eklenir). Faturalandırma TCMB döviz satış kuru esas alınarak yapılır.') + ' <b>' + tt('Nakit ödemelerde %{n} iskonto.', { n: cfg.CASH_DISCOUNT_PCT }) + '</b></span></div>' : '') +
      '<header class="header"><div class="container nav">' +
      '<a href="index.html" class="logo" aria-label="Hammadde360 ana sayfa"><img src="img/logo.svg" alt="" width="52" height="52"><span class="logo-text">hammadde<span>360</span></span></a>' +
      '<button class="menu-btn" aria-label="Menüyü aç" aria-expanded="false">☰</button>' +
      '<nav class="menu" id="menu">' + links.map(l => '<a href="' + l[0] + '">' + l[1] + '</a>').join('') + auth + '</nav>' +
      '</div></header>';
    if (!document.querySelector('footer.footer')) {
      const f = document.createElement('footer'); f.className = 'footer';
      f.innerHTML = '<div class="container"><span>© ' + new Date().getFullYear() + ' ' + tt('Hammadde360. Tüm hakları saklıdır.') + '</span><div class="flinks"><a href="kosullar.html">' + tt('Koşullar ve Sözleşmeler') + '</a></div></div>';
      document.body.appendChild(f);
    }
    const btn = host.querySelector('.menu-btn'), menu = host.querySelector('#menu');
    btn.addEventListener('click', () => { const o = menu.classList.toggle('open'); btn.setAttribute('aria-expanded', o); });
    const lo = document.getElementById('logout');
    if (lo) lo.addEventListener('click', async () => { await sb.auth.signOut(); location.href = 'index.html'; });
  }

  function gate(msg, linkHref, linkText) {
    const main = document.querySelector('main .container') || document.body;
    main.innerHTML = '<div class="gate"><p>' + esc(msg) + '</p>' +
      (linkHref ? '<a class="btn" href="' + linkHref + '">' + esc(linkText) + '</a>' : '') + '</div>';
  }

  // İki aşamalı doğrulama (TOTP): yönetici sayfası için. aal2 değilse kod ister; hiç faktör yoksa kurulum gösterir.
  async function mfaStep() {
    const A = sb.auth.mfa;
    const { data: lvl } = await A.getAuthenticatorAssuranceLevel();
    if (lvl && lvl.currentLevel === 'aal2') return true;
    const main = document.querySelector('main .container') || document.body;
    const { data: fl } = await A.listFactors();
    const all = (fl && fl.all) || [];
    let factor = ((fl && fl.totp) || []).find(f => f.status === 'verified');
    let setup = '';
    if (!factor) {
      for (const f of all) if (f.factor_type === 'totp' && f.status !== 'verified') await A.unenroll({ factorId: f.id });
      const en = await A.enroll({ factorType: 'totp', friendlyName: 'Yonetici ' + Date.now() });
      if (en.error) { gate('İki aşamalı doğrulama başlatılamadı: ' + en.error.message); return false; }
      factor = en.data;
      setup = '<ol class="mfa-steps"><li>Telefonunuzda bir doğrulama uygulaması açın (Google Authenticator, Microsoft Authenticator, Authy vb.).</li>' +
        '<li>Aşağıdaki QR kodu okutun. Okutamazsanız bu anahtarı elle girin: <code>' + esc(en.data.totp.secret) + '</code></li>' +
        '<li>Uygulamada görünen 6 haneli kodu aşağıya yazın.</li></ol>' +
        '<p class="mfa-qr"><img src="' + esc(en.data.totp.qr_code) + '" alt="QR kod" width="180" height="180"></p>';
    }
    main.innerHTML = '<div class="gate mfa"><h2>İki aşamalı doğrulama</h2>' +
      (setup || '<p>Yönetim paneli için doğrulama uygulamanızdaki 6 haneli kodu girin.</p>') +
      '<form id="mfa-form" class="form" style="max-width:320px;margin:0 auto"><label>6 haneli kod<input id="mfa-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label>' +
      '<button class="btn" type="submit">Doğrula</button><p class="form-note" id="mfa-note" role="status"></p></form></div>';
    return new Promise(resolve => {
      const f = document.getElementById('mfa-form'), note = document.getElementById('mfa-note');
      f.addEventListener('submit', async e => {
        e.preventDefault();
        note.className = 'form-note'; note.textContent = 'Kontrol ediliyor...';
        const code = document.getElementById('mfa-code').value.trim();
        const ch = await A.challenge({ factorId: factor.id });
        const vr = ch.error ? ch : await A.verify({ factorId: factor.id, challengeId: ch.data.id, code });
        if (vr.error) { note.className = 'form-note err'; note.textContent = 'Kod geçersiz veya süresi dolmuş. Tekrar deneyin.'; return; }
        resolve(true);
      });
    });
  }

  // require: null (herkes) | 'login' | ['seller','admin'] gibi rol listesi; mfa:true -> yönetici için iki aşamalı doğrulama
  async function init(opts) {
    opts = opts || {};
    const [p, fx] = await Promise.all([getProfile(), loadFx()]);
    H.fx = fx;
    renderHeader(p, fx);
    if (opts.require) {
      if (!p) { gate('Bu sayfayı görmek için giriş yapmanız gerekiyor.', 'giris.html', 'Giriş / Üye Ol'); return null; }
      if (Array.isArray(opts.require) && !opts.require.includes(p.role)) {
        gate('Bu sayfaya erişim yetkiniz yok.', 'index.html', 'Ana Sayfa'); return null;
      }
      if (opts.mfa && p.role === 'admin' && !(await mfaStep())) return null;
    }
    return p;
  }

  // Stok durumu: ready = hazır stok, incoming = bağlantılı (beklenen tarihte stoğa girer)
  const stock = l => (l && l.availability === 'incoming' && l.expected_date)
    ? { incoming: true, cls: 'chip-warn', label: tt('Bağlantılı: {d} tarihinde stoğa girer', { d: new Date(l.expected_date + 'T00:00:00').toLocaleDateString(L) }) }
    : { incoming: false, cls: 'chip-ok', label: tt('Hazır stok') };
  // Favoriler (yalnızca giriş yapmış üyeler; RLS ile herkes kendi satırlarını görür)
  const effPrice = l => Number(l.campaign_price != null ? l.campaign_price : l.list_price);
  let favSet = null;
  async function loadFavs() {
    if (favSet) return favSet;
    const { data } = await sb.from('favorites').select('listing_id');
    favSet = new Set((data || []).map(r => r.listing_id));
    return favSet;
  }
  // Açık/kapalı yapar; yeni durumu (true = favoride) döndürür, hata olursa null
  async function toggleFav(l) {
    const favs = await loadFavs();
    if (favs.has(l.id)) {
      const { error } = await sb.from('favorites').delete().eq('listing_id', l.id);
      if (error) return null; favs.delete(l.id); return false;
    }
    const { error } = await sb.from('favorites').insert({ listing_id: l.id, seen_price: effPrice(l), seen_availability: l.availability || 'ready', seen_quantity: l.quantity });
    if (error) return null; favs.add(l.id); return true;
  }
  const favBtn = (l, on) => '<button type="button" class="fav-btn' + (on ? ' on' : '') + '" data-fav="' + l.id + '" aria-pressed="' + !!on + '" title="' + tt(on ? 'Favorilerden çıkar' : 'Favorilere ekle') + '">' + (on ? '★' : '☆') + '</button>';
  window.H = { sb, cfg, esc, money, tl, waLink, dateTR, getProfile, init, stock, loadFavs, toggleFav, favBtn, effPrice, fx: null };
})();
