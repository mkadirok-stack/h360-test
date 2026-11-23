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
