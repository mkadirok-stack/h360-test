// H360 Ekip: çalışanlar için maliyet / fiyat / stok takibi (yalnızca okuma).
// Veri güvenliği veritabanında: listings tablosunu yalnızca yönetici rolü okuyabilir (RLS).
(function () {
  const cfg = window.H360;
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
  const app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const usd = n => (n == null || n === '' || isNaN(n)) ? '-' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n);
  const num = n => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
  const dt = d => d ? new Date(d).toLocaleDateString('tr-TR') : '-';
  const LOGO = '../img/logo.svg';

  let rows = [], fx = null, st = { q: '', status: 'published', avail: '', sort: 'new' };

  // Ofis modülü (office.js) ile paylaşılan küçük arayüz + alt sekme çubuğu (Stok / Ofis)
  const STAFF = window.STAFF = { sb, app, esc, role: null, onLeaveOffice: null, office: null, render: () => render(), tabs };
  function tabs(show, active) {
    let n = document.getElementById('tabs');
    if (!show) { if (n) n.remove(); return; }
    if (!n) { n = document.createElement('nav'); n.id = 'tabs'; n.className = 'tabs'; document.body.appendChild(n); }
    const t = (k, ad, ik) => '<button data-k="' + k + '" class="' + (active === k ? 'on' : '') + '"><span aria-hidden="true">' + ik + '</span>' + ad + '</button>';
    n.innerHTML = t('stok', 'Stok', '▤') + t('ofis', 'Ofis', '☰');
    n.querySelector('[data-k=stok]').onclick = () => { if (STAFF.onLeaveOffice) STAFF.onLeaveOffice(); render(); };
    n.querySelector('[data-k=ofis]').onclick = () => STAFF.office && STAFF.office();
  }

  function loginView(msg) {
    tabs(false);
    app.innerHTML = '<div class="login"><img src="' + LOGO + '" alt=""><h2>H360 Ekip</h2><p>Çalışan girişi: maliyet, fiyat ve stok takibi</p>' +
      '<form id="lf"><label>E-posta<input id="em" type="email" autocomplete="username" required></label>' +
      '<label>Şifre<input id="pw" type="password" autocomplete="current-password" required></label>' +
      '<button class="go" type="submit">Giriş yap</button><p class="err" id="er">' + esc(msg || '') + '</p></form></div>';
    document.getElementById('lf').addEventListener('submit', async e => {
      e.preventDefault();
      const b = e.target.querySelector('button'), er = document.getElementById('er'); b.disabled = true; er.textContent = '';
      const { error } = await sb.auth.signInWithPassword({ email: document.getElementById('em').value.trim(), password: document.getElementById('pw').value });
      if (error) { er.textContent = 'E-posta veya şifre hatalı.'; b.disabled = false; return; }
      start();
    });
  }

  function mfaView(factorId) {
    tabs(false);
    app.innerHTML = '<div class="login"><img src="' + LOGO + '" alt=""><h2>Doğrulama kodu</h2><p>Doğrulama uygulamanızdaki 6 haneli kodu girin.</p>' +
      '<form id="mf"><label>6 haneli kod<input id="cd" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" required></label>' +
      '<button class="go" type="submit">Doğrula</button><p class="err" id="er"></p></form></div>';
    document.getElementById('mf').addEventListener('submit', async e => {
      e.preventDefault();
      const er = document.getElementById('er'); er.textContent = '';
      const ch = await sb.auth.mfa.challenge({ factorId });
      const vr = ch.error ? ch : await sb.auth.mfa.verify({ factorId, challengeId: ch.data.id, code: document.getElementById('cd').value.trim() });
      if (vr.error) { er.textContent = 'Kod geçersiz veya süresi dolmuş.'; return; }
      start();
    });
  }

  // Telefon bildirimi (Firebase). Eklenti yoksa (tarayıcı ya da bildirimsiz sürüm) sessizce atlanır.
  let pushToken = null, pushHazir = false;
  async function pushKur() {
    try {
      const PN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;
      if (!PN) return;
      let izin = await PN.checkPermissions();
      if (izin.receive === 'prompt' || izin.receive === 'prompt-with-rationale') izin = await PN.requestPermissions();
      if (izin.receive !== 'granted') return;
      if (!pushHazir) {
        pushHazir = true;
        // Uygulama açıkken sistem bildirim göstermez; üstte kısa bir banner çıkarırız.
        PN.addListener('pushNotificationReceived', n => {
          const el = document.createElement('div'); el.className = 'pushbn';
          el.innerHTML = '<b>' + esc(n.title || 'H360 Ekip') + '</b><span>' + esc(n.body || '') + '</span>';
          el.onclick = () => el.remove(); document.body.appendChild(el);
          setTimeout(() => { try { el.remove(); } catch (e) {} }, 8000);
        });
        PN.addListener('registration', async t => { pushToken = t.value; await sb.rpc('push_register', { p_token: t.value, p_platform: 'android' }); });
      }
      await PN.register();
    } catch (e) { /* bildirim olmasa da uygulama çalışır */ }
  }

  async function start() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return loginView();
    const { data: p } = await sb.from('profiles').select('role,full_name').eq('id', session.user.id).single();
    if (!p || (p.role !== 'admin' && p.role !== 'staff')) { await sb.auth.signOut(); return loginView('Bu uygulama yalnızca yetkili çalışanlar içindir.'); }
    STAFF.role = p.role;
    const { data: lvl } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (lvl && lvl.nextLevel === 'aal2' && lvl.currentLevel !== 'aal2') {
      const { data: fl } = await sb.auth.mfa.listFactors();
      const f = ((fl && fl.totp) || []).find(x => x.status === 'verified');
      if (f) return mfaView(f.id);
    }
    pushKur();
    await load();
  }

  async function load() {
    app.innerHTML = '<main><p class="empty">Yükleniyor...</p></main>';
    const [l, f] = await Promise.all([
      sb.rpc('staff_overview'),
      sb.from('fx_rates').select('*').order('rate_date', { ascending: false }).limit(1)
    ]);
    if (l.error) { app.innerHTML = '<main><p class="empty">Veri alınamadı: ' + esc(l.error.message) + '</p><button class="go" id="rt">Tekrar dene</button></main>'; document.getElementById('rt').onclick = load; return; }
    rows = l.data || []; fx = (f.data && f.data[0]) || null;
    render();
  }

  // ---- Ürün ekle (siteye anında yansır) ----
  let catalog = null;
  async function addView() {
    if (!catalog) { const c = await sb.rpc('staff_catalog'); catalog = c.error ? [] : (c.data || []); }
    const label = p => [p.material, p.brand, p.code].filter(Boolean).join(' · ');
    tabs(false);
    app.innerHTML = '<div class="top"><button class="ibtn" id="bk" aria-label="Geri">←</button><h1>Ürün ekle<small>Kaydedince sitede yayınlanır</small></h1></div><main><form id="af" class="frm">' +
      '<label>Ürün ara<input id="ps" type="search" placeholder="Malzeme, marka veya kod yazın" autocomplete="off"></label>' +
      '<label>Ürün<select id="pid" size="5" required></select></label>' +
      '<div class="two"><label>Miktar<input id="qt" type="number" inputmode="decimal" step="any" min="0" required></label><label>Birim<select id="un"><option>ton</option><option>kg</option></select></label></div>' +
      '<label><span id="spl">Maliyet fiyatı (USD / ton, KDV hariç)</span><input id="sp" type="number" inputmode="decimal" step="any" min="0" required></label><p class="hint" id="sph">Fiyat seçtiğiniz birim içindir. Örn. 1.300 USD/ton = 1,30 USD/kg.</p>' +
      '<label>Depo şehri<input id="ct" placeholder="Örn. İstanbul"></label>' +
      '<div class="two"><label>Stok durumu<select id="av"><option value="ready">Hazır stok</option><option value="incoming">Bağlantılı</option></select></label><label id="dw" hidden>Stoğa giriş tarihi<input id="ex" type="date"></label></div>' +
      '<p class="err" id="er"></p><button class="go" type="submit">Kaydet ve yayınla</button><p class="foot">Satış fiyatı varsayılan %6 marjla hesaplanır. Marj ve kampanya, web sitesindeki Yönetim panelinden değiştirilir.</p></form></main>';
    const sel = document.getElementById('pid'), ps = document.getElementById('ps');
    const fill = () => { const t = ps.value.trim().toLocaleLowerCase('tr'); sel.innerHTML = catalog.filter(p => !t || label(p).toLocaleLowerCase('tr').includes(t)).slice(0, 200).map(p => '<option value="' + p.id + '">' + esc(label(p)) + '</option>').join(''); if (sel.options.length) sel.selectedIndex = 0; };
    fill(); ps.oninput = fill;
    const av = document.getElementById('av'); av.onchange = () => { document.getElementById('dw').hidden = av.value !== 'incoming'; };
    const un = document.getElementById('un');
    un.onchange = () => { document.getElementById('spl').textContent = 'Maliyet fiyatı (USD / ' + un.value + ', KDV hariç)'; };
    document.getElementById('bk').onclick = render;
    document.getElementById('af').addEventListener('submit', async e => {
      e.preventDefault(); const er = document.getElementById('er'), b = e.target.querySelector('button.go'); er.textContent = '';
      if (!sel.value) { er.textContent = 'Listeden bir ürün seçin.'; return; }
      const spv = Number(document.getElementById('sp').value), unv = un.value;
      if (unv === 'ton' && spv < 100 && !confirm('Maliyet ton başına ' + spv + ' USD girildi. Bu çok düşük görünüyor. Fiyatı kg başına mı yazdınız? (1,30 USD/kg = 1.300 USD/ton)\n\nYine de bu fiyatla kaydedilsin mi?')) return;
      if (unv === 'kg' && spv > 20 && !confirm('Maliyet kg başına ' + spv + ' USD girildi. Bu çok yüksek görünüyor. Fiyatı ton başına mı yazdınız?\n\nYine de bu fiyatla kaydedilsin mi?')) return;
      b.disabled = true; b.textContent = 'Kaydediliyor...';
      const { error } = await sb.rpc('staff_add_listing', {
        p_product_id: Number(sel.value), p_quantity: Number(document.getElementById('qt').value), p_unit: document.getElementById('un').value,
        p_city: document.getElementById('ct').value, p_seller_price: Number(document.getElementById('sp').value),
        p_availability: av.value, p_expected_date: av.value === 'incoming' ? (document.getElementById('ex').value || null) : null
      });
      if (error) { er.textContent = error.message; b.disabled = false; b.textContent = 'Kaydet ve yayınla'; return; }
      st.status = 'published'; await load();
    });
  }

  // ---- Stok / maliyet güncelle ----
  async function saveStock(id, form) {
    const er = form.querySelector('.err'); er.textContent = '';
    const av = form.querySelector('[name=av]').value, sp = form.querySelector('[name=sp]').value;
    const { error } = await sb.rpc('staff_update_stock', {
      p_id: id, p_quantity: Number(form.querySelector('[name=qt]').value), p_availability: av,
      p_expected_date: av === 'incoming' ? (form.querySelector('[name=ex]').value || null) : null, p_seller_price: sp === '' ? null : Number(sp)
    });
    if (error) { er.textContent = error.message; return; }
    await load();
  }

  const price = l => Number(l.campaign_price != null ? l.campaign_price : l.list_price);
  const cost = l => Number(l.seller_price);
  const profit = l => price(l) - cost(l);
  const marginOnCost = l => cost(l) ? profit(l) / cost(l) * 100 : 0;
  const isIn = l => l.availability === 'incoming';

  function filtered() {
    const t = st.q.trim().toLocaleLowerCase('tr');
    let r = rows.filter(l => (!st.status || l.status === st.status) &&
      (!st.avail || (isIn(l) ? 'incoming' : 'ready') === st.avail) &&
      (!t || [l.title, l.material, l.brand, l.product_code, l.city].join(' ').toLocaleLowerCase('tr').includes(t)));
    const s = {
      new: (a, b) => 0, stock: (a, b) => Number(b.quantity || 0) - Number(a.quantity || 0),
      margin: (a, b) => marginOnCost(b) - marginOnCost(a), name: (a, b) => String(a.title).localeCompare(String(b.title), 'tr'),
      costhi: (a, b) => cost(b) - cost(a)
    }[st.sort];
    return r.slice().sort(s);
  }

  function render() {
    const pub = rows.filter(l => l.status === 'published');
    const stockVal = pub.reduce((a, l) => a + Number(l.quantity || 0) * cost(l), 0);
    const avgM = pub.length ? pub.reduce((a, l) => a + marginOnCost(l), 0) / pub.length : 0;
    const r = filtered();
    tabs(true, 'stok');
    const stTag = l => l.status === 'pending' ? '<span class="tag pe">Onay bekliyor</span>' : l.status === 'rejected' ? '<span class="tag rj">Reddedildi</span>' :
      isIn(l) ? '<span class="tag in">Bağlantılı · ' + dt(l.expected_date) + '</span>' : '<span class="tag ok">Hazır stok</span>';
    app.innerHTML =
      '<div class="top"><img src="' + LOGO + '" alt=""><h1>H360 Ekip<small>' + (fx ? '1 USD = ' + num(fx.usd_sell) + ' ₺ (' + dt(fx.rate_date) + ')' : 'Maliyet · Fiyat · Stok') + '</small></h1>' +
      '<button class="ibtn" id="rf" aria-label="Yenile">⟳</button><button class="ibtn" id="lo" aria-label="Çıkış">⎋</button></div>' +
      '<main><div class="sum"><div><b>' + pub.length + '</b><span>Yayındaki ilan</span></div><div><b>' + pub.filter(isIn).length + ' / ' + pub.filter(l => !isIn(l)).length + '</b><span>Bağlantılı / Hazır</span></div>' +
      '<div><b>' + usd(stockVal) + '</b><span>Stok değeri (maliyet)</span></div><div><b>%' + num(avgM) + '</b><span>Ort. kâr (maliyet üzerinden)</span></div></div>' +
      '<div class="bar"><input id="q" type="search" placeholder="Ara: ürün, marka, kod, şehir" value="' + esc(st.q) + '">' +
      '<select id="so" aria-label="Sırala"><option value="new">Yeni</option><option value="stock">Stok çok</option><option value="margin">Kâr yüksek</option><option value="costhi">Maliyet yüksek</option><option value="name">Ad</option></select></div>' +
      '<div class="chips">' + [['published', 'Yayında'], ['pending', 'Bekleyen'], ['', 'Tümü']].map(x => '<button class="chip' + (st.status === x[0] ? ' on' : '') + '" data-s="' + x[0] + '">' + x[1] + '</button>').join('') +
      [['', 'Tüm stok'], ['ready', 'Hazır'], ['incoming', 'Bağlantılı']].map(x => '<button class="chip' + (st.avail === x[0] ? ' on' : '') + '" data-a="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>' +
      '<div id="lst">' + (r.length ? r.map(l => {
        const m = marginOnCost(l);
        return '<article class="item" data-id="' + l.id + '"><div class="row"><div><h3>' + esc(l.title) + '</h3><p class="meta">' + esc([l.material, l.brand, l.product_code].filter(Boolean).join(' · ') || (l.category && l.category.name) || '') + (l.city ? ' · ' + esc(l.city) : '') + '</p></div>' + stTag(l) + '</div>' +
          '<div class="stock">' + num(Number(l.quantity || 0)) + ' <small>' + esc(l.unit || '') + '</small></div>' +
          '<div class="nums"><div>Maliyet<b>' + usd(cost(l)) + '</b></div><div class="p">Satış<b>' + usd(price(l)) + '</b></div><div class="g">Kâr<b>' + usd(profit(l)) + ' · %' + num(m) + '</b></div></div>' +
          '<div class="det"><p><b>Liste fiyatı:</b> ' + usd(l.list_price) + (l.campaign_price != null ? ' · <b>Kampanya:</b> ' + usd(l.campaign_price) : '') + ' · Marj ayarı: %' + num(Number(l.margin_pct)) + '</p>' +
          (fx ? '<p><b>TL karşılığı (satış):</b> ' + new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(price(l) * fx.usd_sell) + ' / ' + esc(l.unit || '') + '</p>' : '') +
          '<p><b>Palet:</b> ' + esc(l.pallet_qty || '-') + ' ' + esc(l.unit || '') + '</p>' +
          ((l.price_tiers || []).length ? '<p><b>Kademeler (maliyet):</b> ' + l.price_tiers.map(t => t.min_pallets + '+ palet: ' + usd(t.price)).join(' · ') + '</p>' : '') +
          '<p><b>Stok güncelleme:</b> ' + dt(l.stock_updated_at) + ' · <b>Eklenme:</b> ' + dt(l.created_at) + '</p>' +
          '<form class="frm sf" data-id="' + l.id + '"><div class="two"><label>Miktar (' + esc(l.unit || '') + ')<input name="qt" type="number" inputmode="decimal" step="any" min="0" value="' + esc(l.quantity) + '" required></label>' +
          '<label>Maliyet (USD / ' + esc(l.unit || '') + ')<input name="sp" type="number" inputmode="decimal" step="any" min="0" value="' + esc(l.seller_price) + '"></label></div>' +
          '<div class="two"><label>Stok durumu<select name="av"><option value="ready"' + (isIn(l) ? '' : ' selected') + '>Hazır stok</option><option value="incoming"' + (isIn(l) ? ' selected' : '') + '>Bağlantılı</option></select></label>' +
          '<label>Giriş tarihi<input name="ex" type="date" value="' + esc(l.expected_date || '') + '"></label></div>' +
          '<p class="err"></p><button class="go" type="submit">Güncelle</button></form></div></article>';
      }).join('') : '<p class="empty">Gösterilecek kayıt yok.</p>') + '</div><p class="foot">Ürün ekleme ve stok güncelleme sitede anında görünür. Marj ve kampanya web sitesindeki Yönetim panelinden değiştirilir.</p></main>';
    document.getElementById('so').value = st.sort;
    document.getElementById('rf').onclick = load;
    document.getElementById('lo').onclick = async () => { if (pushToken) { try { await sb.rpc('push_unregister', { p_token: pushToken }); } catch (e) {} } await sb.auth.signOut(); STAFF.role = null; loginView(); };
    document.getElementById('so').onchange = e => { st.sort = e.target.value; render(); };
    const q = document.getElementById('q');
    q.oninput = () => { st.q = q.value; const pos = q.selectionStart; render(); const n = document.getElementById('q'); n.focus(); n.setSelectionRange(pos, pos); };
    app.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { st.status = b.dataset.s; render(); });
    app.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { st.avail = b.dataset.a; render(); });
    document.getElementById('lst').onclick = e => { if (e.target.closest('.det')) return; const it = e.target.closest('.item'); if (it) it.classList.toggle('open'); };
    document.getElementById('lst').addEventListener('submit', e => { e.preventDefault(); const f = e.target.closest('.sf'); if (f) saveStock(Number(f.dataset.id), f); });
    const fab = document.createElement('button'); fab.className = 'fab'; fab.setAttribute('aria-label', 'Ürün ekle'); fab.textContent = '+'; fab.onclick = addView; app.appendChild(fab);
  }

  start();
})();
