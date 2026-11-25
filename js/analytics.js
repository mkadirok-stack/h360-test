// Çerezsiz sayfa sayacı: çerez, localStorage, IP veya kimlik kullanmaz; yalnızca gün bazlı toplam sayar.
// Gönderilen: sayfa adı (sorgu yok), yönlendiren alan adı, dil, cihaz sınıfı, üye mi. Bkz. supabase/analitik.sql
(function () {
  try {
    const cfg = window.H360;
    if (!cfg || navigator.doNotTrack === '1' || navigator.webdriver) return;
    const h = location.hostname;
    if (h === 'localhost' || h === '127.0.0.1') return;
    if (/bot|crawl|spider|headless|preview/i.test(navigator.userAgent)) return;
    if (/admin\.html$/.test(location.pathname)) return;
    let path = location.pathname.split('/').pop() || 'index.html';
    let ref = '';
    try { const r = new URL(document.referrer); if (r.hostname !== h) ref = r.hostname.replace(/^www\./, ''); } catch (e) {}
    const lang = (document.documentElement.lang || 'tr').slice(0, 2);
    const device = window.matchMedia && matchMedia('(max-width:820px)').matches ? 'mobile' : 'desktop';
    // Üye mi? Oturum bilgisi Supabase'in kendi anahtarından (zaten giriş için gerekli) okunur; değer gönderilmez, yalnızca var/yok.
    let member = false;
    try { member = Object.keys(localStorage).some(k => /^sb-.*-auth-token$/.test(k)); } catch (e) {}
    fetch(cfg.SUPABASE_URL + '/rest/v1/rpc/track_view', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: cfg.SUPABASE_KEY },
      body: JSON.stringify({ p_path: path, p_ref: ref, p_lang: lang, p_device: device, p_member: member })
    }).catch(() => {});
  } catch (e) {}
})();
