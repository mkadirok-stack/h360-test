// Agent Office sahnesi: izometrik (oyun görünümlü) ofis. Her ajan masasında oturan bir karakter; üstünde durum balonu.
// Salt çizim: veri office.js'ten gelir (durum: ok | warn | bad | off). Karaktere/balona dokunma office.js'te bağlanır (data-a).
(function () {
  const TW = 34, TH = 17, Z = 34, OX = 400, OY = 130, GX = 11, GY = 14;
  const W = 800, H = 540;
  const P = (x, y, z) => [OX + (x - y) * TW, OY + (x + y) * TH - (z || 0) * Z];
  const pt = a => a.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const poly = (a, f) => '<polygon points="' + pt(a) + '" fill="' + f + '"/>';
  function sh(hex, f) {   // rengi koyulaştır/açıklaştır
    const n = parseInt(hex.slice(1), 16), c = k => Math.max(0, Math.min(255, Math.round(((n >> k) & 255) * f)));
    return '#' + [16, 8, 0].map(k => c(k).toString(16).padStart(2, '0')).join('');
  }
  const col = (base, top) => [sh(base, top || 1.12), sh(base, 0.9), sh(base, 0.72)];   // [üst, sol, sağ]
  function box(x, y, z, w, d, h, c) {
    const t = [P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)];
    const l = [P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)];
    const r = [P(x + w, y + d, z + h), P(x + w, y, z + h), P(x + w, y, z), P(x + w, y + d, z)];
    return poly(l, c[1]) + poly(r, c[2]) + poly(t, c[0]);
  }
  const EKRAN = { ok: '#6ee7a0', warn: '#fbbf24', bad: '#f87171', off: '#3a3950' };
  const DURUM = { ok: 'ÇALIŞIYOR', warn: 'UYARI', bad: 'HATA', off: 'UYUYOR' };
  const GOVDE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#0ea5e9'];
  const SAC = ['#2b1b10', '#5a3318', '#c9a227', '#161616', '#7a3b1d', '#3b2a4a', '#8a8a8a', '#2b1b10', '#5a3318', '#161616'];
  const TEN = ['#e8b48a', '#c98f63', '#f1c9a0', '#8d5a3b', '#e8b48a', '#f1c9a0', '#c98f63', '#e8b48a', '#8d5a3b', '#f1c9a0'];
  // masa konumu [x, y, genişlik]
  const YER = {
    ceo_ajani: [4.3, 1.3, 2.6], raporcu_ajani: [0.9, 4.1, 2],
    kur_ajani: [4.6, 4.1, 2], katalog_ajani: [8.2, 4.1, 2],
    pazarlama_seller: [0.9, 6.9, 2], pazarlama_buyer: [4.6, 6.9, 2], satis_ajani: [8.2, 6.9, 2],
    kesif_ajani: [0.9, 9.5, 2], haber_ajani: [4.6, 9.5, 2], tds_ajani: [8.2, 9.5, 2],
    pencere_bekcisi: [0.9, 12.1, 2], ilan_takipcisi: [4.6, 12.1, 2]
  };
  const SIRA = Object.keys(YER);

  function zemin() {
    let s = '';
    const ARKA = '#2a2140', ARKA2 = '#352a52';
    // duvarlar
    s += poly([P(0, 0, 0), P(GX, 0, 0), P(GX, 0, 3.3), P(0, 0, 3.3)], ARKA) + poly([P(0, 0, 0), P(0, GY, 0), P(0, GY, 3.3), P(0, 0, 3.3)], ARKA2);
    // pencereler (parlak)
    [[1.2, 3.4], [6.4, 8.8]].forEach(w => { s += poly([P(w[0], 0, 1.5), P(w[1], 0, 1.5), P(w[1], 0, 2.8), P(w[0], 0, 2.8)], '#f6c76b') + poly([P(w[0] + .12, 0, 1.62), P(w[1] - .12, 0, 1.62), P(w[1] - .12, 0, 2.68), P(w[0] + .12, 0, 2.68)], '#ffe2a0'); });
    [[2, 4.2], [6.5, 8.7]].forEach(w => { s += poly([P(0, w[0], 1.5), P(0, w[1], 1.5), P(0, w[1], 2.8), P(0, w[0], 2.8)], '#e7b25a') + poly([P(0, w[0] + .12, 1.62), P(0, w[1] - .12, 1.62), P(0, w[1] - .12, 2.68), P(0, w[0] + .12, 2.68)], '#fbd68a'); });
    // zemin karoları
    for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) s += poly([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], (i + j) % 2 ? '#dcb88c' : '#e6c9a0');
    // halı (CEO altı)
    s += poly([P(3.7, 0.4), P(7.3, 0.4), P(7.3, 3.2), P(3.7, 3.2)], '#8b2f3c') + poly([P(3.95, 0.65), P(7.05, 0.65), P(7.05, 2.95), P(3.95, 2.95)], '#a63f4d');
    return s;
  }
  function bitki(x, y) { return box(x, y, 0, 0.5, 0.5, 0.35, col('#8a4b2a')) + box(x + 0.05, y + 0.05, 0.35, 0.4, 0.4, 0.5, col('#2e8b57')) + box(x + 0.12, y + 0.12, 0.85, 0.26, 0.26, 0.3, col('#3fa66a')); }

  function masa(k, i, d) {
    const [x, y, w] = YER[k], cx = x + w / 2;
    const g = GOVDE[i % GOVDE.length], hair = SAC[i % SAC.length], skin = TEN[i % TEN.length];
    const off = d === 'off';
    let s = '';
    // sandalye
    s += box(cx - 0.3, y - 0.78, 0, 0.6, 0.5, 0.5, col('#2f2f3a')) + box(cx - 0.3, y - 0.98, 0.5, 0.6, 0.14, 0.62, col('#2f2f3a'));
    // karakter (çalışırken hafif zıplar)
    let ch = box(cx - 0.22, y - 0.7, 0.5, 0.44, 0.36, 0.55, col(off ? '#7a7a88' : g)) +
      box(cx - 0.2, y - 0.69, 1.05, 0.4, 0.38, 0.38, col(skin)) +
      box(cx - 0.22, y - 0.71, 1.38, 0.44, 0.42, 0.14, col(hair)) + box(cx - 0.22, y - 0.74, 1.05, 0.44, 0.1, 0.4, col(hair));
    s += '<g class="' + (d === 'ok' ? 'bob' : '') + '"' + (off ? ' opacity=".6"' : '') + '>' + ch + '</g>';
    // masa
    s += box(x + 0.05, y + 0.05, 0, 0.12, 0.9, 0.62, col('#7d4a26')) + box(x + w - 0.17, y + 0.05, 0, 0.12, 0.9, 0.62, col('#7d4a26'));
    s += box(x, y, 0.62, w, 1.0, 0.14, col('#b0703f'));
    // monitör + klavye
    s += box(cx - 0.13, y + 0.32, 0.76, 0.26, 0.1, 0.08, ['#555', '#444', '#333']);
    s += box(cx - 0.4, y + 0.22, 0.84, 0.8, 0.07, 0.5, ['#26262e', EKRAN[d], '#1a1a20']);
    s += box(cx - 0.35, y + 0.62, 0.76, 0.7, 0.22, 0.04, ['#e8e8ee', '#c9c9d2', '#a9a9b4']);
    if (k === 'ceo_ajani') s += box(cx + 0.55, y + 0.3, 0.76, 0.5, 0.3, 0.06, col('#d4a017'));   // isimlik
    return s;
  }
  function balon(k, d, ad, acik) {
    const [x, y, w] = YER[k], [px, py] = P(x + w / 2, y - 0.62, 2.0);
    return '<button class="bb ' + d + '" data-a="' + k + '" style="left:' + px.toFixed(0) + 'px;top:' + py.toFixed(0) + 'px"><i>' + (d === 'off' ? 'zZ ' : '') + DURUM[d] + (acik ? ' · ' + acik + ' görev' : '') + '</i><b>' + ad + '</b></button>';
  }

  // d: {ajan: 'ok'|'warn'|'bad'|'off'}, adlar: {ajan: ad}, acik: {ajan: sayı}
  window.STAFF = window.STAFF || {};
  window.STAFF.sahne = function (d, adlar, acik, esc) {
    let svg = zemin() + bitki(10.2, 2.2) + bitki(0.3, 10.3) + bitki(10.2, 10.3);
    const sirali = SIRA.map((k, i) => ({ k, i })).sort((a, b) => (YER[a.k][0] + YER[a.k][1]) - (YER[b.k][0] + YER[b.k][1]));
    sirali.forEach(o => { svg += '<g class="mz" data-a="' + o.k + '">' + masa(o.k, o.i, d[o.k] || 'off') + '</g>'; });
    const bal = SIRA.map(k => balon(k, d[k] || 'off', esc(adlar[k]), acik[k])).join('');
    return '<div class="scene" id="scene"><div class="sc" style="width:' + W + 'px;height:' + H + 'px"><svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Ajan ofisi">' + svg + '</svg>' + bal + '</div></div>';
  };
})();
