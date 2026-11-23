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
    const links = [['index.html', 'Ana Sayfa'], ['ilanlar.html', 'İlanlar'], ['haberler.html', 'Haberler']];
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
        ' · ' + tt('Fiyatlar USD cinsindendir ve KDV hariçtir (KDV oranı ilana göre ayrıca eklenir). Faturalandırma TCMB döviz satış kuru esas alınarak yapılır.') + ' <b>' + tt('Nakit ödemelerde %{n} iskonto.', { n: cfg.CASH_DISCOUNT_PCT }) + '</b></div>' : '') +
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

  // require: null (herkes) | 'login' | ['seller','admin'] gibi rol listesi
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
    }
    return p;
  }

  window.H = { sb, cfg, esc, money, tl, waLink, dateTR, getProfile, init, fx: null };
})();
