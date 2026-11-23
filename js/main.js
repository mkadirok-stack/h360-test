// Footer yılı
document.getElementById('year').textContent = new Date().getFullYear();

// Mobil menü
const btn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
btn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => {
  if (e.target.tagName === 'A') {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', false);
  }
});

// Teklif formu
// FORM_ENDPOINT: Formspree'de oluşturacağınız adres (ör. https://formspree.io/f/xxxxxxx).
// Boş bırakılırsa yedek olarak e-posta uygulaması açılır.
const FORM_ENDPOINT = 'https://formspree.io/f/xljbnygz';
const MAIL_TO = 'info@hammadde360.com';
const form = document.getElementById('quote-form');
const note = document.getElementById('form-note');
const submitBtn = form.querySelector('button[type="submit"]');

function say(msg, cls) { note.textContent = msg; note.className = 'form-note ' + (cls || ''); }

form.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(form);
  const d = Object.fromEntries(fd);
  if (d._gotcha) return; // bot
  if (!d.ad || !d.tel || !d.email || !d.urun) return say('Lütfen ad, telefon, e-posta ve ürün alanlarını doldurun.', 'err');
  if (!form.kvkk.checked) return say('Devam etmek için onay kutusunu işaretleyin.', 'err');

  if (!FORM_ENDPOINT) {
    const body = ['Ad Soyad: ' + d.ad, 'Firma: ' + (d.firma || '-'), 'Telefon: ' + d.tel, 'E-posta: ' + d.email,
      'Ürün: ' + d.urun, 'Miktar (ton): ' + (d.miktar || '-'), '', d.mesaj || ''].join('\n');
    window.location.href = 'mailto:' + MAIL_TO + '?subject=' + encodeURIComponent('Teklif Talebi - ' + d.urun) + '&body=' + encodeURIComponent(body);
    return say('E-posta uygulamanız açılıyor. Gönder\'e basarak talebi tamamlayın.');
  }

  submitBtn.disabled = true; say('Gönderiliyor...');
  try {
    fd.delete('kvkk');
    fd.append('_subject', 'Yeni Teklif Talebi - ' + d.urun);
    const r = await fetch(FORM_ENDPOINT, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(r.status);
    form.reset();
    say('Talebiniz alındı. En kısa sürede size dönüş yapacağız. Teşekkürler!', 'ok');
  } catch (err) {
    say('Gönderilemedi. Lütfen tekrar deneyin veya bizi arayın.', 'err');
  } finally { submitBtn.disabled = false; }
});

// Sektörden son haberler (herkese açık)
(async () => {
  const cfg = window.H360, box = document.getElementById('home-news'), sec = document.getElementById('haberler');
  if (!cfg || !box || !sec) return;
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  try {
    const r = await fetch(cfg.SUPABASE_URL + '/rest/v1/news?select=*&order=created_at.desc&limit=3', { headers: { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + cfg.SUPABASE_KEY } });
    const data = r.ok ? await r.json() : [];
    if (!data.length) return;
    const k = (window.t || (x => x))('Kaynak:');
    box.innerHTML = data.map(n => '<article class="card newsitem">' + (n.category ? '<span class="badge">' + esc(n.category) + '</span> ' : '') + (n.lang && n.lang !== 'tr' ? '<span class="badge">' + esc(n.lang.toUpperCase()) + '</span>' : '') +
      '<h3>' + esc(n.title) + '</h3><p>' + esc(n.summary) + '</p><p class="meta">' + k + ' <a href="' + esc(n.source_url) + '" target="_blank" rel="nofollow noopener">' + esc(n.source_name) + '</a>' + (n.source_title ? '<br><i>“' + esc(n.source_title) + '”</i>' : '') + '</p></article>').join('');
    sec.hidden = false;
  } catch (e) {}
})();

// Ürün grupları: yayındaki ilanlardan canlı kartlar (herkese açık; fiyat, stok miktarı ve satıcı bilgisi YOK)
(async () => {
  const cfg = window.H360, grid = document.querySelector('#urunler .products');
  if (!cfg || !grid) return;
  const T = window.t || (x => x);
  const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const INFO = {
    PP: ['Poliolefin', 'Polipropilen (PP)', 'Ambalaj, otomotiv, tekstil ve tıbbi uygulamalar için geniş PP yelpazesi.'],
    HDPE: ['Poliolefin', 'Yüksek Yoğunluklu Polietilen (HDPE)', 'Boru, şişe, film ve enjeksiyon uygulamaları için.'],
    LDPE: ['Poliolefin', 'Düşük Yoğunluklu Polietilen (LDPE)', 'Film, kaplama ve esnek ambalaj uygulamaları için.'],
    LLDPE: ['Poliolefin', 'Lineer Düşük Yoğunluklu Polietilen (LLDPE)', 'Streç, ambalaj filmi ve esnek uygulamalar için.'],
    PVC: ['Vinil', 'Polivinil Klorür (PVC)', 'Profil, boru, kablo ve zemin uygulamaları için.'],
    PET: ['Polyester', 'Polietilen Tereftalat (PET)', 'Şişe, ambalaj ve elyaf uygulamaları için.'],
    PS: ['Stirenik', 'Polistiren (PS)', 'Tek kullanımlık ürün, beyaz eşya ve ambalaj için.'],
    ABS: ['Stirenik', 'Akrilonitril Bütadien Stiren (ABS)', 'Elektronik, otomotiv ve oyuncak uygulamaları için.'],
    PA: ['Mühendislik Plastikleri', 'Poliamid (PA)', 'Dayanım ve ısıl direnç gerektiren teknik parçalar için.'],
    PC: ['Mühendislik Plastikleri', 'Polikarbonat (PC)', 'Şeffaf ve darbe dayanımı yüksek uygulamalar için.']
  };
  try {
    const h = { apikey: cfg.SUPABASE_KEY, Authorization: 'Bearer ' + cfg.SUPABASE_KEY, 'Content-Type': 'application/json' };
    const r = await fetch(cfg.SUPABASE_URL + '/rest/v1/rpc/public_catalog_cards', { method: 'POST', headers: h, body: '{}' });
    const rows = r.ok ? await r.json() : [];
    if (!rows.length) return; // veri yoksa mevcut statik kartlar kalır
    grid.innerHTML = rows.map(c => {
      const info = INFO[String(c.material).toUpperCase()] || [c.sector || '', c.material, ''];
      const tags = (c.usages || []).slice(0, 5).map(u => '<span class="ptag">' + esc(T(u)) + '</span>').join('');
      const grades = (c.grades || []).slice(0, 4).map(g => '<span class="ptag pgrade">' + esc(g.brand + ' ' + g.code) + (g.n > 1 ? ' · ' + T('{n} ilan', { n: g.n }) : '') + '</span>').join('') +
        ((c.grades || []).length > 4 ? '<span class="ptag pgrade">+' + ((c.grades || []).length - 4) + '</span>' : '');
      return '<article class="card pcard">' +
        (info[0] ? '<small class="pfam">' + esc(T(info[0])) + '</small>' : '') +
        '<h3>' + esc(T(info[1])) + '</h3>' +
        (info[2] ? '<p>' + esc(T(info[2])) + '</p>' : '') +
        (tags ? '<p class="ptags">' + tags + '</p>' : '') +
        '<p class="ptags">' + grades + '</p>' +
        '<div class="pfoot"><a href="ilanlar.html">' + esc(T('İlanları gör →')) + '</a><span class="pcount">' + c.grade_count + ' ' + esc(T('Grade')) + '</span></div>' +
        '</article>';
    }).join('');
    const sub = document.querySelector('#urunler .sub');
    if (sub) sub.textContent = T('Şu an ilanı bulunan ürün grupları ve gradeler. Fiyat ve stok miktarı üyelerimize özeldir.');
  } catch (e) {}
})();
