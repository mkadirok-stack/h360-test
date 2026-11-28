// H360 Ekip > Agent Office: CEO sohbeti, günlük rapor ve her ajanın kendi ofisi.
// Veriye yalnızca güvenli veritabanı fonksiyonlarıyla (office_*) erişir. Okuma: personel+yönetici; soru/görev: yalnızca yönetici.
(function () {
  const S = window.STAFF;
  const { sb, app, esc } = S;
  const AJANLAR = {
    ceo_ajani: ['CEO', 'Ofisin başı: sorularınızı yanıtlar, görev dağıtır'],
    raporcu_ajani: ['Raporcu', 'Günlük rapor hazırlar, ajanları izler'],
    kur_ajani: ['Kur Ajanı', 'TCMB döviz kurunu takip eder'],
    katalog_ajani: ['Katalog Ajanı', 'Ürün katalog taleplerini işler'],
    pazarlama_seller: ['Satıcı Pazarlama', 'Aday satıcı firmalara davet gönderir'],
    pazarlama_buyer: ['Alıcı Pazarlama', 'Aday alıcı firmalara davet gönderir'],
    satis_ajani: ['Satış Ajanı', 'Üyelere ürün haberlerini iletir'],
    kesif_ajani: ['Keşif Ajanı', 'Yeni aday firma bulur'],
    haber_ajani: ['Haber Ajanı', 'Sektör haberlerini toplar'],
    tds_ajani: ['TDS Ajanı', 'Teknik veri sayfalarını bulur'],
    pencere_bekcisi: ['Pencere Bekçisi', 'İlan iptal/revize saatlerini ve fiyat gizlemeyi doğrular'],
    ilan_takipcisi: ['İlan Takipçisi', 'Satıcıların ilan kaldırma ve fiyat revizelerini izler'],
    siparis_takipcisi: ['Sipariş Takipçisi', 'Proforma üretir, imzalı belge ve ödemeyi takip eder']
  };
  const ISCILER = Object.keys(AJANLAR).filter(k => k !== 'ceo_ajani' && k !== 'raporcu_ajani');
  const GOREV_AD = { kontrol: 'Şimdi bir tur çalış', rapor: 'Raporu hazırla', kesif_ara: 'Firma ara' };
  const DURUM_AD = { queued: 'Sırada', running: 'Çalışıyor', done: 'Tamamlandı', failed: 'Başarısız', cancelled: 'İptal' };
  let timer = null, unsub = null, ov = null, gorunum = 'sahne';
  const isAdmin = () => S.role === 'admin';
  const stop = () => { if (timer) { clearInterval(timer); timer = null; } if (unsub) { unsub(); unsub = null; } };
  // Canlı güncelleme: office_pulse tablosundaki "bir şey değişti" işaretini Realtime ile dinler; veriyi yine office_* fonksiyonlarıyla çeker.
  // Bağlantı kopsa da ekran 30-60 sn'de bir kendini yeniler (yedek).
  function canli(konular, cb, yedekSn) {
    let t = null, ch = null;
    const tetik = () => { clearTimeout(t); t = setTimeout(cb, 500); };
    try {
      ch = sb.channel('ofis-' + Math.random().toString(36).slice(2))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'office_pulse' }, p => { const k = p.new && p.new.topic; if (!k || konular.includes(k)) tetik(); })
        .subscribe();
    } catch (e) { /* Realtime yoksa yedek yenileme çalışır */ }
    const yd = setInterval(cb, (yedekSn || 45) * 1000);
    return () => { clearTimeout(t); clearInterval(yd); if (ch) { try { sb.removeChannel(ch); } catch (e) {} } };
  }
  const yaziyor = () => { const a = document.activeElement; return !!(a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };
  S.onLeaveOffice = stop;
  S.ajanVeri = async k => { const r = await rpc('office_agent', { p_agent: k }); return r.error ? null : r.data; };
  S.ajanAc = k => { if (k === 'ceo_ajani') chat(); else if (k === 'raporcu_ajani') report(); else agent(k); };

  const ago = d => {
    if (!d) return 'hiç';
    const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
    if (s < 90) return 'şimdi';
    if (s < 5400) return Math.round(s / 60) + ' dk önce';
    if (s < 129600) return Math.round(s / 3600) + ' sa önce';
    return Math.round(s / 86400) + ' gün önce';
  };
  const hhmm = d => new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const rpc = async (n, a) => { const r = await sb.rpc(n, a || {}); return r; };

  // Ajan durumu: heartbeat'e ve beklenen aralığa göre
  function durum(h) {
    if (!h) return ['Henüz çalışmadı', 'off'];
    const bekle = Math.max(h.interval_sn || 600, 60) * 3 + 120;
    if ((Date.now() - new Date(h.last_run).getTime()) / 1000 > bekle) return ['Sessiz', 'warn'];
    if (h.status === 'error') return ['Hata', 'bad'];
    if (h.status === 'warn') return ['Uyarı', 'warn'];
    return ['Çalışıyor', 'ok'];
  }
  const dot = c => '<span class="dot ' + c + '"></span>';
  const head = (title, sub, back) => '<div class="top">' + (back ? '<button class="ibtn" id="bk" aria-label="Geri">←</button>' : '<span style="width:6px"></span>') +
    '<h1>' + esc(title) + '<small>' + esc(sub || '') + '</small></h1></div>';
  const KISA = { kur_ajani: 'KR', katalog_ajani: 'KT', pazarlama_seller: 'SP', pazarlama_buyer: 'AP', satis_ajani: 'SA', kesif_ajani: 'KŞ', haber_ajani: 'HB', tds_ajani: 'TD', raporcu_ajani: 'RP', pencere_bekcisi: 'PB', ilan_takipcisi: 'İT', siparis_takipcisi: 'ST' };
  const initials = k => esc(KISA[k] || AJANLAR[k][0].slice(0, 2).toUpperCase());

  // ---------------- Ofis ana sayfa
  async function home(sessiz) {
    sessiz = sessiz === true;
    if (!sessiz) { stop(); S.tabs(true, 'ofis'); }
    const solKonum = sessiz ? (document.getElementById('scene') || {}).scrollLeft : null;
    if (!sessiz) app.innerHTML = head('Agent Office', 'Ajan ofisi') + '<main><p class="empty">Yükleniyor...</p></main>';
    const [o, r, xr] = await Promise.all([rpc('office_overview'), rpc('office_reports', { p_days: 1 }), rpc('office_xp')]);
    if (o.error) { if (!sessiz) app.innerHTML = head('Agent Office', '') + '<main><p class="empty">Ofis verisi alınamadı: ' + esc(o.error.message) + '</p></main>'; return; }
    ov = o.data;
    const hb = {}; (ov.heartbeats || []).forEach(h => { hb[h.agent] = h; });
    const acik = ov.open_tasks || {};
    const hic = !(ov.heartbeats || []).length;
    const rap = (r.data || [])[0];
    const card = k => { const [d, c] = durum(hb[k]); return '<button class="acard" data-a="' + k + '"><span class="av">' + initials(k) + '</span><span class="at"><b>' + esc(AJANLAR[k][0]) + '</b><small>' + esc(AJANLAR[k][1]) + '</small>' +
      '<small class="st">' + dot(c) + d + (hb[k] ? ' · ' + ago(hb[k].last_run) : '') + (acik[k] ? ' · ' + acik[k] + ' görev' : '') + '</small></span></button>'; };
    const listeHtml = '<p class="sec">Yönetim</p>' +
      '<button class="ceo" data-a="ceo_ajani"><span class="av big">CEO</span><span class="at"><b>CEO</b><small>Soru sorun, görev verin</small><small class="st">' + dot(durum(hb.ceo_ajani)[1]) + durum(hb.ceo_ajani)[0] + (hb.ceo_ajani ? ' · ' + ago(hb.ceo_ajani.last_run) : '') + '</small></span><span class="go2">Sohbet →</span></button>' +
      '<button class="acard" id="rp"><span class="av">RP</span><span class="at"><b>Günlük rapor</b><small>' + (rap ? 'Son rapor: ' + new Date(rap.day + 'T00:00:00').toLocaleDateString('tr-TR') : 'Henüz rapor yok') + '</small>' +
      '<small class="st">' + dot(durum(hb.raporcu_ajani)[1]) + 'Raporcu: ' + durum(hb.raporcu_ajani)[0] + '</small></span></button>' +
      '<button class="acard" id="bd"><span class="av">İŞ</span><span class="at"><b>İş panosu ve hafıza</b><small>CEO\'nun takip ettiği işler, kararlar</small></span></button>' +
      '<p class="sec">Ajan ofisleri</p><div class="agrid">' + ISCILER.map(card).join('') + '</div>';
    const dm = {}, adlar = {}; Object.keys(AJANLAR).forEach(k => { dm[k] = durum(hb[k])[1]; adlar[k] = AJANLAR[k][0]; });
    const calisan = Object.keys(AJANLAR).filter(k => dm[k] === 'ok').length;
    const ozet = {}; Object.keys(AJANLAR).forEach(k => { ozet[k] = AJANLAR[k][1]; });
    const sahne = S.sahne ? S.sahne(dm, adlar, acik, esc, { hb: hb, ozet: ozet, xp: S.xpHesap && !xr.error ? S.xpHesap(xr.data) : null }) : '';
    const goster = (gorunum === 'sahne' && sahne);
    app.innerHTML = head('Agent Office', calisan + ' / ' + Object.keys(AJANLAR).length + ' ajan çalışıyor') + '<main class="om">' +
      (hic ? '<div class="note">Ajanlar henüz çalışmıyor (sunucu ve şirket kuruluşu bekleniyor). Çalışmaya başlayınca burada canlı görünür.</div>' : '') +
      (sahne ? '<div class="seg"><button data-g="sahne" class="' + (goster ? 'on' : '') + '">Ofis</button><button data-g="liste" class="' + (goster ? '' : 'on') + '">Liste</button>' +
        '<button id="bd2" class="rpb">İş panosu</button><button id="rp2" class="rpb2">Rapor</button></div>' : '') +
      (goster ? sahne + '<p class="hint" style="padding:6px 2px">Bir ajana dokunarak ofisine girin. CEO\'ya dokunursanız sohbet açılır. Sürükleyerek kaydırın, ⟲ ⟳ ile döndürün, + − ile yakınlaştırın.</p>' : listeHtml) + '</main>';
    if (goster && S.sahneBagla) S.sahneBagla();
    app.querySelectorAll('[data-a]').forEach(b => b.onclick = () => b.dataset.a === 'ceo_ajani' ? chat() : b.dataset.a === 'raporcu_ajani' ? report() : agent(b.dataset.a));
    app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { gorunum = b.dataset.g; home(); });
    const sc = document.getElementById('scene'); if (sc) sc.scrollLeft = solKonum != null ? solKonum : Math.max(0, (sc.scrollWidth - sc.clientWidth) / 2);
    if (!sessiz && !unsub) unsub = canli(['heartbeat', 'tasks'], () => home(true), 45);
    const r2 = document.getElementById('rp2'); if (r2) r2.onclick = () => report();
    const b2 = document.getElementById('bd2'); if (b2) b2.onclick = () => board();
    const b1 = document.getElementById('bd'); if (b1) b1.onclick = () => board();
    const r1 = document.getElementById('rp'); if (r1) r1.onclick = () => report();
  }

  // ---------------- Tek ajanın ofisi
  async function agent(k, sessiz) {
    sessiz = sessiz === true;
    if (!sessiz) { stop(); S.tabs(false); app.innerHTML = head(AJANLAR[k][0], AJANLAR[k][1], true) + '<main><p class="empty">Yükleniyor...</p></main>'; document.getElementById('bk').onclick = home; }
    const r = await rpc('office_agent', { p_agent: k });
    if (sessiz && yaziyor()) return;
    if (r.error) { if (!sessiz) app.querySelector('main').innerHTML = '<p class="empty">' + esc(r.error.message) + '</p>'; return; }
    const { heartbeat: h, events, tasks } = r.data; const [d, c] = durum(h);
    const lvl = { ok: 'ok', warn: 'warn', error: 'bad', info: 'off' };
    const aksiyon = !isAdmin() ? '<p class="hint">Görev vermek için yönetici hesabı gerekir.</p>' :
      '<div class="acts"><button class="go2b" data-t="kontrol">Şimdi bir tur çalıştır</button>' +
      (k === 'raporcu_ajani' ? '<button class="go2b" data-t="rapor">Raporu şimdi hazırla</button>' : '') + '</div>' +
      (k === 'kesif_ajani' ? '<form id="kf" class="frm sf"><div class="two"><label>Tür<select name="kind"><option value="buyer">Alıcı firmalar</option><option value="seller">Satıcı firmalar</option></select></label><label>Adet<input name="adet" type="number" min="1" max="10" value="5"></label></div>' +
        '<label>Odak (isteğe bağlı)<input name="odak" maxlength="120" placeholder="Örn. ambalaj üreticileri, Bursa"></label><button class="go" type="submit">Firma ara görevi ver</button></form>' : '') + '<p class="err" id="er"></p>';
    app.querySelector('main').innerHTML =
      '<div class="sbox"><div class="row"><b>' + dot(c) + d + '</b><span class="meta">' + (h ? 'son çalışma: ' + ago(h.last_run) : 'hiç çalışmadı') + '</span></div>' +
      (h ? '<p class="meta">' + esc(h.summary || '') + ' · bugün ' + (h.runs_today || 0) + ' tur</p>' : '<p class="meta">Bu ajanın henüz kaydı yok. Sunucu çalışınca burada görünür.</p>') + '</div>' +
      '<p class="sec">Görev ver</p>' + aksiyon +
      '<p class="sec">Görevler</p>' + (tasks.length ? tasks.map(t => '<div class="ev"><span class="meta">#' + t.id + ' · ' + hhmm(t.created_at) + ' · ' + (t.created_by === 'ceo_ajani' ? 'CEO' : 'Siz') + '</span><b>' + esc(GOREV_AD[t.kind] || t.kind) + '</b> <span class="tag ' + (t.status === 'done' ? 'ok' : t.status === 'failed' ? 'rj' : 'pe') + '">' + esc(DURUM_AD[t.status] || t.status) + '</span>' +
        (t.params && t.params.odak ? '<p class="meta">Odak: ' + esc(t.params.odak) + '</p>' : '') + (t.result ? '<p class="meta">' + esc(t.result) + '</p>' : '') +
        (t.status === 'queued' && isAdmin() ? '<button class="lnk" data-c="' + t.id + '">İptal et</button>' : '') + '</div>').join('') : '<p class="meta">Henüz görev yok.</p>') +
      '<p class="sec">Yaptığı işler</p>' + (events.length ? events.map(e => '<div class="ev"><span class="meta">' + hhmm(e.created_at) + '</span> ' + dot(lvl[e.level] || 'off') + esc(e.message) + '</div>').join('') : '<p class="meta">Kayıtlı iş yok.</p>');
    const ver = async (t, p, note) => {
      const er = document.getElementById('er'); er.textContent = '';
      const x = await rpc('office_task_create', { p_assignee: k, p_kind: t, p_params: p || {}, p_note: note || null });
      if (x.error) { er.textContent = x.error.message; return; }
      agent(k);
    };
    if (!sessiz && !unsub) unsub = canli(['heartbeat', 'tasks'], () => agent(k, true), 45);
    app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => ver(b.dataset.t));
    app.querySelectorAll('[data-c]').forEach(b => b.onclick = async () => { await rpc('office_task_cancel', { p_id: Number(b.dataset.c) }); agent(k); });
    const kf = document.getElementById('kf');
    if (kf) kf.onsubmit = e => { e.preventDefault(); ver('kesif_ara', { kind: kf.kind.value, adet: Number(kf.adet.value), odak: kf.odak.value.trim() }); };
  }

  // ---------------- Günlük rapor
  async function report() {
    stop(); S.tabs(false);
    app.innerHTML = head('Günlük rapor', 'Raporcu ajanı', true) + '<main><p class="empty">Yükleniyor...</p></main>';
    document.getElementById('bk').onclick = home;
    const r = await rpc('office_reports', { p_days: 14 });
    const main = app.querySelector('main');
    if (r.error) { main.innerHTML = '<p class="empty">' + esc(r.error.message) + '</p>'; return; }
    const list = r.data || [];
    const ask = isAdmin() ? '<button class="go2b" id="ask">Raporu şimdi iste</button><p class="err" id="er"></p>' : '';
    if (!list.length) { main.innerHTML = '<p class="empty">Henüz rapor yok. Raporcu çalışmaya başlayınca her gün 18:00\'de rapor hazırlar.</p>' + ask; bind(); return; }
    const n = v => Number(v || 0).toLocaleString('tr-TR');
    main.innerHTML = ask + list.map((x, i) => {
      const m = x.metrics || {}, z = m.ziyaret || {}, f = m.firma || {}, ml = m.mail || {};
      const li = (a, fn) => (a && a.length) ? '<ul class="rl">' + a.map(fn).join('') + '</ul>' : '<p class="meta">Yok</p>';
      return '<section class="rep' + (i ? '' : ' open') + '"><button class="rh" data-r="' + i + '"><b>' + new Date(x.day + 'T00:00:00').toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</b><span class="meta">' + n(z.toplam) + ' ziyaret · ' + (f.bugun_iletisim || []).length + ' firma</span></button><div class="rb">' +
        '<div class="sum"><div><b>' + n(z.toplam) + '</b><span>Site ziyareti</span></div><div><b>' + n((m.uye || {}).yeni) + '</b><span>Yeni üye</span></div><div><b>' + n((m.ilan || {}).yeni) + '</b><span>Yeni ilan</span></div><div><b>' + n(ml.giden) + '</b><span>Giden mail</span></div></div>' +
        '<p class="meta">Mobil ' + n(z.mobil) + ' · üye ziyareti ' + n(z.uye) + ' · katalog talebi ' + n(m.katalog_talebi) + ' · hatalı mail ' + n(ml.hatali) + '</p>' +
        '<h4>En çok bakılan sayfalar</h4>' + li(z.sayfalar, p => '<li>' + esc(p[0]) + ' <b>' + n(p[1]) + '</b></li>') +
        '<h4>Nereden geldiler</h4>' + li(z.kaynaklar, p => '<li>' + esc(p[0]) + ' <b>' + n(p[1]) + '</b></li>') +
        '<h4>İletişim kurulan firmalar</h4>' + li(f.bugun_iletisim, p => '<li>' + esc(p.firma) + ' <span class="meta">' + (p.tur === 'seller' ? 'satıcı' : 'alıcı') + '</span></li>') +
        '<p class="meta">Yeni aday: ' + n(f.yeni_aday) + ' · üye olan aday: ' + n(f.uye_olan) + ' · toplam aday: ' + n(f.aday_toplam) + '</p>' +
        '<h4>Ulaşılamayan firmalar</h4>' + li(f.ulasilamayan, p => '<li>' + esc(p) + '</li>') +
        '<h4>Satış</h4><p class="meta">Satış kaydı tutan sistem henüz yok.</p>' +
        (((m.ajanlar || {}).sessiz || []).length ? '<p class="meta">Sessiz ajanlar: ' + esc(m.ajanlar.sessiz.join(', ')) + '</p>' : '') + '</div></section>';
    }).join('');
    bind();
    function bind() {
      app.querySelectorAll('.rh').forEach(b => b.onclick = () => b.parentElement.classList.toggle('open'));
      const a = document.getElementById('ask');
      if (a) a.onclick = async () => {
        const x = await rpc('office_task_create', { p_assignee: 'raporcu_ajani', p_kind: 'rapor', p_params: {}, p_note: 'Uygulamadan istendi' });
        document.getElementById('er').textContent = x.error ? x.error.message : 'Rapor görevi verildi. Raporcu çalışırken birkaç dakika içinde burada görünür.';
      };
    }
  }

  // ---------------- CEO sohbeti
  async function chat() {
    stop(); S.tabs(false);
    app.innerHTML = head('CEO', 'Soru sorun, görev verin', true) +
      '<main class="chatm"><div id="msgs" class="msgs"></div></main>' +
      (isAdmin() ? '<form id="cf" class="cbar"><textarea id="ci" rows="1" maxlength="2000" placeholder="CEO\'ya yazın..." required></textarea><button class="send" type="submit" aria-label="Gönder">➤</button></form>' : '<p class="hint" style="padding:12px">Sohbet yalnızca yönetici hesabı içindir.</p>');
    document.getElementById('bk').onclick = () => { stop(); home(); };
    const box = document.getElementById('msgs');
    let son = '';
    async function yenile(zorla) {
      if (!isAdmin()) { box.innerHTML = '<p class="empty">Yalnızca yönetici CEO ile yazışabilir.</p>'; return; }
      const [r, o] = await Promise.all([rpc('office_chat_list'), rpc('office_overview')]);
      if (r.error) { box.innerHTML = '<p class="empty">' + esc(r.error.message) + '</p>'; return; }
      const hb = ((o.data || {}).heartbeats || []).find(h => h.agent === 'ceo_ajani');
      const cevrimdisi = durum(hb)[1] !== 'ok';
      const imza = JSON.stringify(r.data.map(m => [m.id, m.status])) + cevrimdisi;
      if (!zorla && imza === son) return; son = imza;
      const bekliyor = r.data.some(m => m.role === 'user' && m.status === 'pending');
      box.innerHTML = (r.data.length ? '' : '<div class="note">Merhaba! Ofisin durumunu, ziyaretleri, iletişim kurulan firmaları sorabilir veya "keşif ajanı ambalaj firmaları bulsun" gibi görev verebilirsiniz.</div>') +
        r.data.map(m => '<div class="bub ' + (m.role === 'user' ? 'me' : 'ai') + '">' + esc(m.body).replace(/\n/g, '<br>') + '<small>' + hhmm(m.created_at) + (m.status === 'failed' ? ' · yanıtlanamadı' : '') + '</small></div>').join('') +
        (bekliyor ? '<div class="bub ai typing">' + (cevrimdisi ? 'CEO çevrimdışı. Mesajınız sırada, çalışmaya başlayınca yanıtlanacak.' : 'CEO yazıyor...') + '</div>' : '');
      window.scrollTo(0, document.body.scrollHeight);
    }
    await yenile(true);
    unsub = canli(['chat', 'heartbeat'], () => yenile(false), 20);
    const f = document.getElementById('cf');
    if (f) f.onsubmit = async e => {
      e.preventDefault(); const t = document.getElementById('ci'); const v = t.value.trim(); if (!v) return;
      const b = f.querySelector('button'); b.disabled = true;
      const x = await rpc('office_chat_send', { p_body: v });
      b.disabled = false;
      if (x.error) { box.insertAdjacentHTML('beforeend', '<div class="bub ai typing">' + esc(x.error.message) + '</div>'); return; }
      t.value = ''; yenile(true);
    };
  }

  // ---------------- İş panosu + hafıza (CEO takip eder)
  const IS_DURUM = { open: 'Açık', doing: 'Devam ediyor', blocked: 'Engelli', done: 'Bitti', dropped: 'Bırakıldı' };
  const ONC = { high: 'Yüksek', normal: 'Normal', low: 'Düşük' };
  const sahip = o => o === 'yonetici' ? 'Yönetici' : o === 'ceo_ajani' ? 'CEO' : (AJANLAR[o] ? AJANLAR[o][0] : o);
  async function board(sessiz) {
    sessiz = sessiz === true;
    if (!sessiz) { stop(); S.tabs(false); app.innerHTML = head('İş panosu', 'İşler ve hafıza', true) + '<main><p class="empty">Yükleniyor...</p></main>'; document.getElementById('bk').onclick = home; }
    const [j, m] = await Promise.all([rpc('office_jobs_list', { p_all: false }), rpc('office_memory_list')]);
    if (sessiz && yaziyor()) return;
    const main = app.querySelector('main');
    if (j.error) { main.innerHTML = '<p class="empty">' + esc(j.error.message) + '</p>'; return; }
    const isler = j.data || [], notlar = m.data || [], bugun = new Date().toISOString().slice(0, 10);
    const kart = i => {
      const gec = i.due && i.due < bugun;
      return '<div class="job' + (gec ? ' late' : '') + '"><div class="row"><b>' + esc(i.title) + '</b><span class="tag ' + (i.status === 'doing' ? 'in' : i.status === 'blocked' ? 'rj' : 'pe') + '">' + esc(IS_DURUM[i.status]) + '</span></div>' +
        '<p class="meta">' + esc(sahip(i.owner)) + (i.due ? ' · vade ' + new Date(i.due + 'T00:00:00').toLocaleDateString('tr-TR') + (gec ? ' (GEÇTİ)' : '') : '') + (i.priority === 'high' ? ' · ÖNCELİKLİ' : '') + (i.source === 'ceo_ajani' ? ' · CEO ekledi' : '') + '</p>' +
        (i.detail ? '<p class="meta">' + esc(i.detail) + '</p>' : '') + (i.last_note ? '<p class="meta">Not: ' + esc(i.last_note) + '</p>' : '') +
        (isAdmin() ? '<div class="acts">' + (i.status !== 'doing' ? '<button class="go2b" data-j="' + i.id + '" data-s="doing">Başla</button>' : '') + '<button class="go2b" data-j="' + i.id + '" data-s="done">Bitti</button>' +
          (i.status !== 'blocked' ? '<button class="go2b" data-j="' + i.id + '" data-s="blocked">Engelli</button>' : '') + '<button class="lnk" data-j="' + i.id + '" data-s="dropped">Bırak</button></div>' : '') + '</div>';
    };
    const form = !isAdmin() ? '' : '<form id="jf" class="frm sf"><label>Yeni iş<input name="t" maxlength="200" placeholder="Örn. Ambalaj sektörüne açıl" required></label>' +
      '<div class="two"><label>Sorumlu<select name="o"><option value="yonetici">Yönetici</option><option value="ceo_ajani">CEO</option>' + Object.keys(AJANLAR).filter(k => k !== 'ceo_ajani').map(k => '<option value="' + k + '">' + esc(AJANLAR[k][0]) + '</option>').join('') + '</select></label>' +
      '<label>Vade<input name="d" type="date"></label></div><label>Öncelik<select name="p"><option value="normal">Normal</option><option value="high">Yüksek</option><option value="low">Düşük</option></select></label>' +
      '<p class="err" id="er"></p><button class="go" type="submit">İşi ekle</button></form>';
    main.innerHTML = form + '<p class="sec">Açık işler (' + isler.length + ')</p>' + (isler.length ? isler.map(kart).join('') : '<p class="meta">Panoda açık iş yok. CEO\'ya "şunu takip et" diyerek de iş ekleyebilirsiniz.</p>') +
      '<p class="sec">CEO hafızası (' + notlar.length + ')</p><p class="hint">CEO bu notlara uyar. Karar ve tercihlerinizi buraya yazabilir ya da sohbette söyleyebilirsiniz.</p>' +
      (notlar.length ? notlar.map(n => '<div class="ev"><span class="meta">' + esc(n.kind) + ' · ' + hhmm(n.created_at) + (n.source === 'ceo_ajani' ? ' · CEO yazdı' : '') + '</span>' + esc(n.body) + (isAdmin() ? ' <button class="lnk" data-n="' + n.id + '">Sil</button>' : '') + '</div>').join('') : '<p class="meta">Henüz not yok.</p>') +
      (isAdmin() ? '<form id="nf" class="frm sf"><div class="two"><label>Tür<select name="k"><option value="karar">Karar</option><option value="not">Not</option><option value="hatirlatma">Hatırlatma</option></select></label></div><label>Not<input name="b" maxlength="600" required></label><button class="go" type="submit">Hafızaya yaz</button></form>' : '');
    if (!sessiz && !unsub) unsub = canli(['jobs'], () => board(true), 60);
    app.querySelectorAll('[data-j]').forEach(b => b.onclick = async () => { await rpc('office_job_update', { p_id: Number(b.dataset.j), p_status: b.dataset.s }); board(); });
    app.querySelectorAll('[data-n]').forEach(b => b.onclick = async () => { await rpc('office_memory_delete', { p_id: Number(b.dataset.n) }); board(); });
    const jf = document.getElementById('jf');
    if (jf) jf.onsubmit = async e => { e.preventDefault(); const x = await rpc('office_job_add', { p_title: jf.t.value, p_owner: jf.o.value, p_due: jf.d.value || null, p_priority: jf.p.value }); if (x.error) { document.getElementById('er').textContent = x.error.message; return; } board(); };
    const nf = document.getElementById('nf');
    if (nf) nf.onsubmit = async e => { e.preventDefault(); const x = await rpc('office_memory_add', { p_kind: nf.k.value, p_body: nf.b.value }); if (x.error) { alert(x.error.message); return; } board(); };
  }

  S.office = home;
})();
