// Agent Office sahnesi v2: canlı, izometrik (voxel görünümlü) ofis. <canvas> ile çizilir; karakterler yürür, masasında çalışır, boştayken dinlenme
// alanına gider, kapıdan girer. Konuşma balonları (durum + görev), üstte seviye/XP çubuğu, döndür / yakınlaştır / sürükle.
// Salt görsel: veri dışarıdan gelir. API:  STAFF.sahne(d, adlar, acik, esc, ek) -> HTML metni (sonra) STAFF.sahneBagla() ile canlandırılır.
//   d: {ajan: 'ok'|'warn'|'bad'|'off'}   adlar: {ajan: ad}   acik: {ajan: açık görev sayısı}
//   ek: {hb: {ajan: heartbeat satırı}, ozet: {ajan: kısa açıklama}, xp: {xp, seviye, baslik, alt, ust}}
// Karakter konumları sayfa yenilense de (yeni <canvas>) korunur: dünya durumu modül içinde yaşar.
(function () {
  'use strict';
  const S = (window.STAFF = window.STAFF || {});
  const GX = 13, GY = 14, TW = 26, TH = 13, ZH = 26;
  const GOVDE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b', '#0ea5e9', '#84cc16', '#e11d48', '#06b6d4'];
  const SAC = ['#2b1b10', '#5a3318', '#c9a227', '#161616', '#7a3b1d', '#3b2a4a', '#8a8a8a', '#2b1b10', '#5a3318', '#161616', '#c9a227', '#7a3b1d', '#161616'];
  const TEN = ['#e8b48a', '#c98f63', '#f1c9a0', '#8d5a3b', '#e8b48a', '#f1c9a0', '#c98f63', '#e8b48a', '#8d5a3b', '#f1c9a0', '#e8b48a', '#c98f63', '#f1c9a0'];
  const EKRAN = { ok: '#6ee7a0', warn: '#fbbf24', bad: '#f87171', off: '#2e2c3a' };
  // Masa konumu [x, y, genişlik]; ajan sırası renk/görünüm için sabit
  const YER = {
    ceo_ajani: [4.3, 1.3, 2.6], raporcu_ajani: [0.9, 4.1, 2],
    kur_ajani: [4.6, 4.1, 2], katalog_ajani: [8.2, 4.1, 2],
    pazarlama_seller: [0.9, 6.9, 2], pazarlama_buyer: [4.6, 6.9, 2], satis_ajani: [8.2, 6.9, 2],
    kesif_ajani: [0.9, 9.5, 2], haber_ajani: [4.6, 9.5, 2], tds_ajani: [8.2, 9.5, 2],
    pencere_bekcisi: [0.9, 12.1, 2], ilan_takipcisi: [4.6, 12.1, 2], siparis_takipcisi: [8.2, 12.1, 2]
  };
  const SIRA = Object.keys(YER);
  const KAPI = { x: 0.45, y: 6.1 };                                  // batı duvarındaki kapı (içeri giriş noktası)
  const DINLEN = [{ x: 10.8, y: 5.0 }, { x: 11.7, y: 6.2 }, { x: 11.5, y: 8.0 }, { x: 10.8, y: 9.2 }];   // boşta gezinti noktaları (dinlenme alanı)
  const DURUM_AD = { work: 'ÇALIŞIYOR', idle: 'BEKLİYOR', arrive: 'GELİYOR', ship: 'TAMAMLADI', warn: 'SESSİZ', bad: 'HATA', off: 'UYUYOR' };

  // ---------------- stil (sahne HTML'inin kendi stili; iki sitede de aynı)
  if (!document.getElementById('sahne-css')) {
    const st = document.createElement('style'); st.id = 'sahne-css';
    st.textContent = '.scene2{position:relative;background:#1b1530;border-radius:14px;border:2px solid #0f0a1c;overflow:hidden;touch-action:none;user-select:none}' +
      '.scene2 canvas{display:block;width:100%;cursor:grab}.scene2 canvas:active{cursor:grabbing}' +
      '.s2hud{position:absolute;left:0;right:0;top:0;display:flex;gap:8px;align-items:center;padding:8px;pointer-events:none;flex-wrap:wrap}' +
      '.s2t{background:#fff8ea;border:2px solid #6b4b2a;border-radius:8px;padding:3px 9px;font:800 13px system-ui,sans-serif;color:#2a1c10;box-shadow:0 2px 0 rgba(0,0,0,.3)}' +
      '.s2xp{background:#fff8ea;border:2px solid #6b4b2a;border-radius:8px;padding:3px 9px;font:700 11px system-ui,sans-serif;color:#2a1c10;display:flex;align-items:center;gap:7px;box-shadow:0 2px 0 rgba(0,0,0,.3)}' +
      '.s2xp .bar{width:92px;height:9px;background:#e6d6bd;border:1px solid #6b4b2a;border-radius:6px;overflow:hidden}.s2xp .bar i{display:block;height:100%;background:#f59e0b}' +
      '.s2ctl{position:absolute;right:8px;bottom:8px;display:flex;gap:6px}' +
      '.s2ctl button{min-width:36px;min-height:36px;border-radius:9px;border:2px solid #6b4b2a;background:#fff8ea;color:#2a1c10;font:800 16px system-ui,sans-serif;box-shadow:0 2px 0 rgba(0,0,0,.3);padding:0 8px}' +
      '.s2b{position:absolute;transform:translate(-50%,-100%);background:#fff8ea;border:2px solid #6b4b2a;border-radius:8px;padding:3px 8px 4px;text-align:left;font-family:system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 0 rgba(0,0,0,.3);cursor:pointer;pointer-events:auto;max-width:190px;min-height:0;min-width:0}' +
      '.s2b::after{content:"";position:absolute;left:50%;bottom:-8px;margin-left:-5px;border:5px solid transparent;border-top-color:#6b4b2a;border-bottom:0}' +
      '.s2b .c{display:inline-block;font:800 8.5px system-ui,sans-serif;letter-spacing:.06em;padding:1px 5px;border-radius:4px;color:#fff;background:#64748b}' +
      '.s2b .m{display:block;font:700 11px system-ui,sans-serif;color:#2a1c10;overflow:hidden;text-overflow:ellipsis;max-width:176px;margin-top:2px}' +
      '.s2b .a{display:block;font:600 9.5px system-ui,sans-serif;color:#7a6650}' +
      '.s2b.work .c{background:#3b6fd8}.s2b.idle .c{background:#8a8a99}.s2b.arrive .c{background:#1a9a52}.s2b.ship .c{background:#16a34a}.s2b.warn .c{background:#d98a00}.s2b.bad .c{background:#d63b2b}.s2b.off .c{background:#5a5170}' +
      '.s2p{position:absolute;top:0;right:0;bottom:0;width:min(330px,90%);background:#fff8ea;border-left:3px solid #6b4b2a;box-shadow:-4px 0 14px rgba(0,0,0,.4);display:flex;flex-direction:column;z-index:6;font-family:system-ui,sans-serif;color:#2a1c10}' +
      '.s2ph{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;padding:10px 10px 6px;border-bottom:2px solid #e2d3b8}.s2pn{display:block;font-size:15px}.s2ps{display:inline-block;margin-top:3px;font:800 9px system-ui,sans-serif;letter-spacing:.06em;padding:2px 7px;border-radius:5px;color:#fff;background:#64748b}' +
      '.s2px{min-width:32px;min-height:32px;border:2px solid #6b4b2a;background:#fff;border-radius:8px;font:800 18px system-ui,sans-serif;line-height:1;padding:0}.s2pm{padding:6px 10px;font-size:12px;color:#5a4630;border-bottom:1px solid #eadfca}' +
      '.s2pl{flex:1;overflow:auto;padding:4px 8px;-webkit-overflow-scrolling:touch}.s2pe{display:flex;gap:7px;padding:5px 2px;border-bottom:1px dashed #e2d3b8;font-size:12px;line-height:1.35}.s2pe i{flex:0 0 8px;height:8px;border-radius:50%;margin-top:5px}.s2pe time{flex:0 0 auto;color:#8a7458;font-size:10.5px;min-width:46px;margin-top:1px}.s2pe span{flex:1;word-break:break-word}' +
      '@keyframes s2yeni{0%{background:#fde68a}100%{background:transparent}}.s2pe.yeni{animation:s2yeni 3.5s ease-out}.s2pb{padding:18px 6px;text-align:center;font-size:12px;color:#8a7458}' +
      '.s2pf{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-top:2px solid #e2d3b8}.s2pd{border:2px solid #6b4b2a;background:#f59e0b;color:#2a1c10;font:800 12px system-ui,sans-serif;border-radius:8px;padding:6px 12px;min-height:0}.s2pc{font-size:10.5px;color:#8a7458}' +
      '.s2b.mini{padding:1px 6px 2px;border-width:1.5px;border-radius:6px;opacity:.9}.s2b.mini .m,.s2b.mini .c{display:none}.s2b.mini .a{font:700 10px system-ui,sans-serif;color:#2a1c10}.s2b.mini::after{bottom:-6px;border-width:4px;margin-left:-4px}.s2b.mini.off{background:#ddd5ea;border-color:#5a5170}.s2b.mini.off .a{color:#5a5170}.s2b.mini.off .a::before{content:"zZ ";font-weight:800}';
    document.head.appendChild(st);
  }

  // ---------------- dünya durumu (sayfa yenilense de yaşar)
  const D = { ch: {}, onceki: {}, sonRun: {}, ship: {}, R: 0, kul: 1, panX: 0, panY: 0, ek: {}, d: {}, adlar: {}, acik: {}, t0: performance.now(), raf: 0, cv: null };

  const sh = (hex, f) => { const n = parseInt(hex.slice(1), 16), c = k => Math.max(0, Math.min(255, Math.round(((n >> k) & 255) * f))); return '#' + [16, 8, 0].map(k => c(k).toString(16).padStart(2, '0')).join(''); };
  const col = (b, top) => [sh(b, top || 1.14), sh(b, 0.92), sh(b, 0.74)];   // [üst, sol, sağ]
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------------- sabit sahne (dünya koordinatları)
  const OBST = [];            // yürünemez dikdörtgenler [x, y, w, d]
  const MOB = [];             // sabit mobilyalar: {x,y,z,w,d,h,c}
  const DEKOR = [];           // duvara yapışık parçalar: {duvar,p0,p1,z0,z1,c}
  const HALI = [];            // zemine yassı: {x,y,w,d,c}
  function mobilya(x, y, z, w, d, h, c, engel) { MOB.push({ x, y, z, w, d, h, c: col(c) }); if (engel !== false) OBST.push([x, y, w, d]); }
  SIRA.forEach(k => { const [x, y, w] = YER[k]; OBST.push([x - 0.05, y - 0.05, w + 0.1, 1.1]); });
  // dinlenme alanı (doğu): halı, kanepe, sehpa, su sebili, toplantı masası, sunucu dolabı
  HALI.push({ x: 10.9, y: 3.4, w: 2.0, d: 3.4, c: '#8b2f3c' }, { x: 11.1, y: 3.6, w: 1.6, d: 3.0, c: '#a63f4d' }, { x: 10.9, y: 9.6, w: 2.1, d: 2.8, c: '#2f5d62' });
  mobilya(12.2, 3.4, 0, 0.8, 2.6, 0.45, '#3f6f8f'); mobilya(12.7, 3.4, 0.45, 0.3, 2.6, 0.55, '#3f6f8f');   // kanepe + sırt
  mobilya(11.3, 4.4, 0, 0.7, 0.9, 0.3, '#7d4a26');                                                       // sehpa
  mobilya(12.1, 8.4, 0, 0.5, 0.5, 1.1, '#9fb7c9');                                                       // su sebili
  mobilya(11.0, 10.2, 0, 1.9, 1.1, 0.62, '#a8622f');                                                     // toplantı masası
  [[11.1, 9.75], [11.8, 9.75], [12.5, 9.75], [11.1, 11.35], [11.8, 11.35], [12.5, 11.35]].forEach(p => mobilya(p[0], p[1], 0, 0.4, 0.4, 0.5, '#2f2f3a', false));
  mobilya(12.2, 6.9, 0, 0.8, 0.9, 1.7, '#2a2a34');                                                       // sunucu dolabı
  [[10.3, 0.3], [0.15, 13.2], [12.3, 13.0], [0.2, 0.25]].forEach(p => { mobilya(p[0], p[1], 0, 0.5, 0.5, 0.35, '#8a4b2a'); MOB.push({ x: p[0] + 0.05, y: p[1] + 0.05, z: 0.35, w: 0.4, d: 0.4, h: 0.5, c: col('#2e8b57') }, { x: p[0] + 0.12, y: p[1] + 0.12, z: 0.85, w: 0.26, d: 0.26, h: 0.35, c: col('#3fa66a') }); });
  // duvar parçaları: N (y=0), W (x=0), E (x=GX), S (y=GY)
  const PENC = ['#f6c76b', '#ffd98a', '#e7b25a'];
  DEKOR.push({ duvar: 'N', p0: 0.8, p1: 2.8, z0: 1.3, z1: 2.8, c: PENC }, { duvar: 'N', p0: 8.0, p1: 10.0, z0: 1.3, z1: 2.8, c: PENC },
    { duvar: 'N', p0: 4.1, p1: 6.8, z0: 1.2, z1: 2.9, c: ['#e9e2d0', '#d8cfb8', '#bfb59a'] },
    { duvar: 'W', p0: 2.0, p1: 4.0, z0: 1.3, z1: 2.8, c: PENC }, { duvar: 'W', p0: 8.3, p1: 10.3, z0: 1.3, z1: 2.8, c: PENC },
    { duvar: 'W', p0: 5.4, p1: 6.8, z0: 0, z1: 2.4, c: ['#8a5a30', '#7a4c27', '#5c391b'] },
    { duvar: 'E', p0: 4.1, p1: 6.1, z0: 1.3, z1: 2.8, c: PENC }, { duvar: 'E', p0: 9.0, p1: 11.0, z0: 1.3, z1: 2.8, c: PENC },
    { duvar: 'S', p0: 2.0, p1: 4.0, z0: 1.3, z1: 2.8, c: PENC }, { duvar: 'S', p0: 8.0, p1: 10.0, z0: 1.3, z1: 2.8, c: PENC });
  // kitaplıklar (duvara dayalı, yürünmez)
  mobilya(10.7, 0.12, 0, 1.8, 0.5, 2.0, '#7d4a26'); mobilya(12.5, 1.0, 0, 0.5, 1.9, 2.0, '#7d4a26');
  const NOTLAR = ['#fde047', '#fb923c', '#a3e635', '#38bdf8', '#f472b6', '#fde047'];

  // ---------------- yürüme (A*, 0.5'lik ızgara)
  const CS = 0.5, NX = GX * 2, NY = GY * 2;
  const blok = new Uint8Array(NX * NY);
  OBST.forEach(([x, y, w, d]) => { for (let i = Math.floor(x / CS); i < Math.ceil((x + w) / CS); i++) for (let j = Math.floor(y / CS); j < Math.ceil((y + d) / CS); j++) if (i >= 0 && j >= 0 && i < NX && j < NY) blok[j * NX + i] = 1; });
  const hucre = p => [Math.max(0, Math.min(NX - 1, Math.floor(p.x / CS))), Math.max(0, Math.min(NY - 1, Math.floor(p.y / CS)))];
  function yol(bas, hedef) {
    const [sx, sy] = hucre(bas), [gx, gy] = hucre(hedef);
    const al = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const g = new Float32Array(NX * NY).fill(1e9), from = new Int32Array(NX * NY).fill(-1), kapali = new Uint8Array(NX * NY);
    const acik = [[sy * NX + sx, 0]]; g[sy * NX + sx] = 0;
    while (acik.length) {
      let bi = 0; for (let i = 1; i < acik.length; i++) if (acik[i][1] < acik[bi][1]) bi = i;
      const [cur] = acik.splice(bi, 1)[0]; if (kapali[cur]) continue; kapali[cur] = 1;
      const cx = cur % NX, cy = (cur / NX) | 0;
      if (cx === gx && cy === gy) break;
      for (const [dx, dy] of al) {
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) continue;
        const ni = ny * NX + nx; if (blok[ni] && !(nx === gx && ny === gy) && !(nx === sx && ny === sy)) continue;
        const ng = g[cur] + 1 + (blok[ni] ? 6 : 0); if (ng < g[ni]) { g[ni] = ng; from[ni] = cur; acik.push([ni, ng + Math.abs(nx - gx) + Math.abs(ny - gy)]); }
      }
    }
    const gi = gy * NX + gx; if (from[gi] < 0 && gi !== sy * NX + sx) return [hedef];
    const p = []; for (let c = gi; c >= 0 && c !== sy * NX + sx; c = from[c]) p.push({ x: (c % NX) * CS + CS / 2, y: ((c / NX) | 0) * CS + CS / 2 });
    p.reverse(); p.push({ x: hedef.x, y: hedef.y });
    // doğrusal noktaları ele
    return p.filter((q, i) => { if (i === 0 || i === p.length - 1) return true; const a = p[i - 1], b = p[i + 1]; return !((a.x === q.x && q.x === b.x) || (a.y === q.y && q.y === b.y)); });
  }

  // ---------------- karakterler
  const koltuk = k => { const [x, y, w] = YER[k]; return { x: x + w / 2, y: y - 0.52 }; };
  function karakter(k) {
    if (!D.ch[k]) { const s = koltuk(k); D.ch[k] = { x: s.x, y: s.y, fx: 0, fy: 1, mod: 'oturuyor', yol: [], sonra: null, bekle: 0, siradaki: performance.now() + rnd(15000, 50000), zipla: 0, gorunur: true }; }
    return D.ch[k];
  }
  function git(k, hedef, sonra) { const c = karakter(k); c.yol = yol({ x: c.x, y: c.y }, hedef); c.sonra = sonra; c.mod = 'yuruyor'; }
  function durumKur(k, yeni, hbk) {
    const c = karakter(k), onc = D.onceki[k];
    const ilk = onc === undefined;
    if (yeni === 'off') { c.gorunur = false; c.yol = []; c.mod = 'yok'; }
    else if (!c.gorunur || c.mod === 'yok') {
      c.gorunur = true;
      if (ilk) { const s = koltuk(k); c.x = s.x; c.y = s.y; c.fx = 0; c.fy = 1; c.mod = 'oturuyor'; }
      else { c.x = KAPI.x; c.y = KAPI.y; c.arrive = performance.now() + 14000; git(k, koltuk(k), 'otur'); }   // kapıdan girer
    }
    D.onceki[k] = yeni;
    if (hbk && hbk.last_run) {
      const lr = hbk.last_run; if (D.sonRun[k] && D.sonRun[k] !== lr && yeni === 'ok') { D.ship[k] = performance.now() + 6500; c.zipla = performance.now() + 1500; }
      D.sonRun[k] = lr;
    }
  }
  function adimla(k, dt, simdi) {
    const c = karakter(k);
    if (c.mod === 'yuruyor') {
      const h = c.yol[0];
      if (!h) { c.mod = c.sonra === 'otur' || c.sonra === 'koltuk' ? 'oturuyor' : 'duruyor'; if (c.mod === 'oturuyor') { c.fx = 0; c.fy = 1; } else c.bekle = simdi + rnd(6000, 12000); return; }
      const dx = h.x - c.x, dy = h.y - c.y, d = Math.hypot(dx, dy), v = 2.1 * dt;
      if (d <= v) { c.x = h.x; c.y = h.y; c.yol.shift(); }
      else { c.x += dx / d * v; c.y += dy / d * v; if (Math.abs(dx) > Math.abs(dy)) { c.fx = Math.sign(dx); c.fy = 0; } else { c.fx = 0; c.fy = Math.sign(dy); } }
    } else if (c.mod === 'duruyor' && simdi > c.bekle) { git(k, koltuk(k), 'otur'); }
    else if (c.mod === 'oturuyor' && c.gorunur && D.d[k] === 'ok' && simdi > c.siradaki && !(D.ship[k] > simdi) && k !== 'ceo_ajani') {
      c.siradaki = simdi + rnd(30000, 70000);
      const idle = !(D.ek.hb && D.ek.hb[k] && (Date.now() - new Date(D.ek.hb[k].last_run).getTime()) < 100000);
      if (idle) git(k, DINLEN[(Math.random() * DINLEN.length) | 0], 'dinlen');
    }
  }

  // ---------------- izdüşüm (döndürmeli)
  function proj(ctx, W, H) {
    const R = D.R, dx = R % 2 === 0 ? GX : GY, dy = R % 2 === 0 ? GY : GX;
    const fit = Math.min(W / ((GX + GY) * TW * 1.12), H / ((GX + GY) * TH + 4.6 * ZH)), sc = fit * D.kul;
    const rot = (x, y) => R === 0 ? [x, y] : R === 1 ? [y, GX - x] : R === 2 ? [GX - x, GY - y] : [GY - y, x];
    const cx = W / 2 - ((dx - dy) / 2) * TW * sc + D.panX, cy = H / 2 - ((dx + dy) / 2) * TH * sc + 1.2 * ZH * sc + D.panY;
    const P2 = (a, b, z) => [cx + (a - b) * TW * sc, cy + (a + b) * TH * sc - (z || 0) * ZH * sc];
    const rect = (x, y, w, d) => { const p = rot(x, y), q = rot(x + w, y + d); const a = Math.min(p[0], q[0]), b = Math.min(p[1], q[1]); return { a, b, aw: Math.abs(q[0] - p[0]), bd: Math.abs(q[1] - p[1]) }; };
    const P = (x, y, z) => { const r = rot(x, y); return P2(r[0], r[1], z); };
    return { P, P2, rect, rot, sc, dx, dy };
  }
  function poly(ctx, pts, f, line) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); if (line) { ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.stroke(); } }
  function kutu(ctx, J, x, y, z, w, d, h, c, onYuz) {   // onYuz: görünen yüz renkleri sırası [üst, sol, sağ] kullanılır
    const r = J.rect(x, y, w, d), P = J.P2, a = r.a, b = r.b, aw = r.aw, bd = r.bd, L = 'rgba(0,0,0,.16)';
    poly(ctx, [P(a, b + bd, z + h), P(a + aw, b + bd, z + h), P(a + aw, b + bd, z), P(a, b + bd, z)], c[1], L);
    poly(ctx, [P(a + aw, b + bd, z + h), P(a + aw, b, z + h), P(a + aw, b, z), P(a + aw, b + bd, z)], c[2], L);
    poly(ctx, [P(a, b, z + h), P(a + aw, b, z + h), P(a + aw, b + bd, z + h), P(a, b + bd, z + h)], c[0], L);
    return r;
  }

  // ---------------- çizim parçaları
  function karakterCiz(ctx, J, k, i, simdi, t) {
    const c = karakter(k); if (!c.gorunur) return;
    const g = GOVDE[i % GOVDE.length], sac = SAC[i % SAC.length], ten = TEN[i % TEN.length], d = D.d[k] || 'off';
    const oturuyor = c.mod === 'oturuyor', yuruyor = c.mod === 'yuruyor';
    const fx = c.fx, fy = c.fy, yatay = fx !== 0;
    const zip = c.zipla > simdi ? Math.abs(Math.sin((c.zipla - simdi) / 1500 * Math.PI * 3)) * 0.35 : 0;
    // yerel kutu: (yanal, ileri) ofsetli; boyutlar (genişlik, derinlik)
    const kx = (lat, ile, z, gen, der, h, renk) => {
      const px = c.x + (yatay ? ile * fx : lat) , py = c.y + (yatay ? lat : ile * fy);
      const bw = yatay ? der : gen, bd = yatay ? gen : der;
      kutu(ctx, J, px - bw / 2, py - bd / 2, z + zip, bw, bd, h, renk);
    };
    const bas = sh(ten, 1), kolRenk = col(g), bacak = col('#3a3f5a'), cilt = col(ten), saç = col(sac);
    const salin = yuruyor ? Math.sin(t * 9 + i) * 0.14 : 0;
    if (oturuyor) {
      const bob = d === 'ok' ? Math.sin(t * 6 + i) * 0.025 : 0;
      kx(-0.09, 0.12, 0.5, 0.14, 0.4, 0.14, bacak); kx(0.09, 0.12, 0.5, 0.14, 0.4, 0.14, bacak);        // uyluk
      kx(-0.09, 0.3, 0, 0.14, 0.14, 0.5, bacak); kx(0.09, 0.3, 0, 0.14, 0.14, 0.5, bacak);              // baldır
      kx(0, -0.02, 0.62, 0.42, 0.24, 0.5, kolRenk);                                                       // gövde
      kx(-0.26, 0.2, 0.86 + bob, 0.1, 0.4, 0.1, kolRenk); kx(0.26, 0.2, 0.86 - bob, 0.1, 0.4, 0.1, kolRenk);   // kollar (klavyeye)
      kx(0, -0.02, 1.14, 0.3, 0.28, 0.3, cilt); kx(0, -0.1, 1.14, 0.32, 0.12, 0.3, saç); kx(0, -0.02, 1.44, 0.32, 0.3, 0.1, saç);
    } else {
      const sw = salin;
      kx(-0.09, sw, 0, 0.14, 0.14, 0.44, bacak); kx(0.09, -sw, 0, 0.14, 0.14, 0.44, bacak);
      kx(0, 0, 0.44, 0.42, 0.24, 0.56, kolRenk);
      kx(-0.26, -sw * 0.9, 0.46, 0.1, 0.12, 0.5, kolRenk); kx(0.26, sw * 0.9, 0.46, 0.1, 0.12, 0.5, kolRenk);
      kx(0, 0, 1.0, 0.3, 0.28, 0.3, cilt); kx(0, -0.1, 1.0, 0.32, 0.12, 0.3, saç); kx(0, 0, 1.3, 0.32, 0.3, 0.1, saç);
    }
  }
  function masaCiz(ctx, J, k, d, simdi, t) {
    const [x, y, w] = YER[k], cx = x + w / 2;
    kutu(ctx, J, x + 0.05, y + 0.05, 0, 0.12, 0.9, 0.62, col('#7d4a26')); kutu(ctx, J, x + w - 0.17, y + 0.05, 0, 0.12, 0.9, 0.62, col('#7d4a26'));
    kutu(ctx, J, x, y, 0.62, w, 1.0, 0.14, col('#b0703f'));
    const ekran = d === 'ok' && Math.sin(t * 3 + x) > 0.92 ? '#b6f5d0' : EKRAN[d];
    kutu(ctx, J, cx - 0.13, y + 0.32, 0.76, 0.26, 0.1, 0.08, ['#555', '#444', '#333']);
    kutu(ctx, J, cx - 0.4, y + 0.22, 0.84, 0.8, 0.07, 0.5, ['#26262e', ekran, '#1a1a20']);
    kutu(ctx, J, cx - 0.35, y + 0.62, 0.76, 0.7, 0.22, 0.04, ['#e8e8ee', '#c9c9d2', '#a9a9b4']);
    if (k === 'ceo_ajani') kutu(ctx, J, cx + 0.55, y + 0.3, 0.76, 0.5, 0.3, 0.06, col('#d4a017'));
  }
  function sandalyeCiz(ctx, J, k) {
    const [x, y, w] = YER[k], cx = x + w / 2;
    kutu(ctx, J, cx - 0.3, y - 0.98, 0.5, 0.6, 0.14, 0.62, col('#2f2f3a')); kutu(ctx, J, cx - 0.3, y - 0.78, 0, 0.6, 0.5, 0.5, col('#2f2f3a'));
  }
  function ciz(cv, simdi) {
    const dpr = Math.min(2, window.devicePixelRatio || 1), cw = cv.clientWidth || 360, ch = cv.clientHeight || 300;
    if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)) { cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, cw, ch);
    const t = (simdi - D.t0) / 1000, J = proj(ctx, cw, ch), P = J.P;
    // zemin
    for (let i = 0; i < GX; i++) for (let j = 0; j < GY; j++) { const q = [P(i, j, 0), P(i + 1, j, 0), P(i + 1, j + 1, 0), P(i, j + 1, 0)]; poly(ctx, q, (i + j) % 2 ? '#dcb88c' : '#e8cba0'); }
    HALI.forEach(h => poly(ctx, [P(h.x, h.y, 0.01), P(h.x + h.w, h.y, 0.01), P(h.x + h.w, h.y + h.d, 0.01), P(h.x, h.y + h.d, 0.01)], h.c));
    poly(ctx, [P(3.7, 0.4, 0.01), P(7.3, 0.4, 0.01), P(7.3, 3.2, 0.01), P(3.7, 3.2, 0.01)], '#8b2f3c'); poly(ctx, [P(3.95, 0.65, 0.01), P(7.05, 0.65, 0.01), P(7.05, 2.95, 0.01), P(3.95, 2.95, 0.01)], '#a63f4d');
    // arka duvarlar (dönüşe göre iki uzak kenar)
    const WC = ['#4a3d6e', '#352b52', '#2a2140'], dx = J.dx, dy = J.dy;
    const duvarKutu = (a, b, aw, bd) => { const Pp = J.P2, L = 'rgba(0,0,0,.18)'; poly(ctx, [Pp(a, b + bd, 3.4), Pp(a + aw, b + bd, 3.4), Pp(a + aw, b + bd, 0), Pp(a, b + bd, 0)], WC[1], L); poly(ctx, [Pp(a + aw, b + bd, 3.4), Pp(a + aw, b, 3.4), Pp(a + aw, b, 0), Pp(a + aw, b + bd, 0)], WC[2], L); poly(ctx, [Pp(a, b, 3.4), Pp(a + aw, b, 3.4), Pp(a + aw, b + bd, 3.4), Pp(a, b + bd, 3.4)], WC[0], L); };
    duvarKutu(-0.3, -0.3, dx + 0.3, 0.3); duvarKutu(-0.3, 0, 0.3, dy);
    // duvar parçaları (yalnızca uzak duvarlardakiler)
    DEKOR.forEach(e => {
      let x, y, w, d; const T = 0.07;
      if (e.duvar === 'N') { x = e.p0; y = 0; w = e.p1 - e.p0; d = T; } else if (e.duvar === 'S') { x = e.p0; y = GY - T; w = e.p1 - e.p0; d = T; }
      else if (e.duvar === 'W') { x = 0; y = e.p0; w = T; d = e.p1 - e.p0; } else { x = GX - T; y = e.p0; w = T; d = e.p1 - e.p0; }
      const r = J.rect(x, y, w, d); if (!(r.a < 0.5 || r.b < 0.5)) return;
      kutu(ctx, J, x, y, e.z0, w, d, e.z1 - e.z0, col(e.c[1]));
      // ticket board notları (N duvarı, 4.1-6.8)
      if (e.duvar === 'N' && e.p0 === 4.1) NOTLAR.forEach((nc, n) => kutu(ctx, J, 4.35 + (n % 3) * 0.8, 0.07, 1.5 + Math.floor(n / 3) * 0.6, 0.5, 0.03, 0.4, col(nc)));
    });
    // sıralı nesneler: mobilya, masa, karakter
    const items = [];
    MOB.forEach(m => { const r = J.rect(m.x, m.y, m.w, m.d); items.push({ k: r.a + r.aw + r.b + r.bd + m.z * 0.01, f: () => kutu(ctx, J, m.x, m.y, m.z, m.w, m.d, m.h, m.c) }); });
    SIRA.forEach((k, i) => {
      const [x, y, w] = YER[k], r = J.rect(x, y, w, 1.0), d = D.d[k] || 'off';
      items.push({ k: r.a + r.aw + r.b + r.bd, f: () => masaCiz(ctx, J, k, d, simdi, t) });
      const qs = J.rot(x + w / 2, y - 0.5); items.push({ k: qs[0] + qs[1] - 0.45, f: () => sandalyeCiz(ctx, J, k) });
      const c = karakter(k); if (c.gorunur) { const q = J.rot(c.x, c.y); items.push({ k: q[0] + q[1] + 0.5, f: () => karakterCiz(ctx, J, k, i, simdi, t) }); }
    });
    items.sort((a, b) => a.k - b.k).forEach(o => o.f());
    return J;
  }

  // ---------------- balonlar + çerçeve döngüsü
  function balonlariKonumla(J) {
    const lay = D.cv && D.cv.parentNode && D.cv.parentNode.querySelector('.s2lay'); if (!lay) return;
    lay.querySelectorAll('.s2b').forEach(b => {
      const k = b.dataset.a, c = karakter(k), seat = koltuk(k);
      const gx = c.gorunur ? c.x : seat.x, gy = c.gorunur ? c.y : seat.y, p = J.P(gx, gy, c.mod === 'oturuyor' || !c.gorunur ? 1.75 : 1.9);
      b.style.left = p[0].toFixed(0) + 'px'; b.style.top = p[1].toFixed(0) + 'px';
    });
  }
  function durumMetni(k, simdi) {   // [anahtar, ana metin, alt metin]
    const d = D.d[k] || 'off', hb = (D.ek.hb || {})[k], ozet = (D.ek.ozet || {})[k] || '', ad = D.adlar[k] || k, ac = D.acik[k];
    const alt = ad + (ac ? ' · ' + ac + ' görev' : '');
    const c = karakter(k);
    if (d === 'off') return ['off', 'Henüz gelmedi', ad];
    if (c.mod === 'yuruyor' && c.arrive && c.arrive > simdi) return ['arrive', 'Masasına yürüyor', alt];
    if (d === 'bad') return ['bad', (hb && hb.summary) || 'Hata verdi', alt];
    if (d === 'warn') return ['warn', hb ? 'Uzun süredir sessiz' : 'Uyarı', alt];
    if (D.ship[k] > simdi) return ['ship', (hb && hb.summary) || 'Turu bitirdi', alt];
    const yeni = hb && (Date.now() - new Date(hb.last_run).getTime()) < 100000;
    if (yeni) return ['work', (hb && hb.summary) || ozet, alt];
    return ['idle', 'Sıradaki turu bekliyor', alt];
  }
  function balonGuncelle(simdi) {
    const lay = D.cv && D.cv.parentNode && D.cv.parentNode.querySelector('.s2lay'); if (!lay) return;
    lay.querySelectorAll('.s2b').forEach(b => {
      const k = b.dataset.a, [s, m, a] = durumMetni(k, simdi), eski = b.dataset.s + '|' + b.dataset.m;
      if (eski === s + '|' + m) return;
      b.dataset.s = s; b.dataset.m = m; b.className = 's2b ' + s + (s === 'idle' || s === 'off' ? ' mini' : '');
      b.innerHTML = '<span class="c">' + DURUM_AD[s] + '</span><span class="m"></span><span class="a"></span>';
      b.querySelector('.m').textContent = m; b.querySelector('.a').textContent = a;
    });
  }
  let sonKare = 0;
  function dongu(now) {
    D.raf = 0;
    const cv = D.cv; if (!cv || !cv.isConnected) return;
    if (document.hidden) { D.raf = requestAnimationFrame(dongu); return; }
    if (now - sonKare >= 33) {
      const dt = Math.min(0.1, (now - sonKare) / 1000); sonKare = now;
      SIRA.forEach(k => adimla(k, dt, now));
      const J = ciz(cv, now); balonGuncelle(now); balonlariKonumla(J);
    }
    D.raf = requestAnimationFrame(dongu);
  }

  // ---------------- genel API
  S.sahne = function (d, adlar, acik, esc, ek) {
    D.d = d || {}; D.adlar = adlar || {}; D.acik = acik || {}; D.ek = ek || {};
    SIRA.forEach(k => durumKur(k, D.d[k] || 'off', (D.ek.hb || {})[k]));
    const xp = D.ek.xp;
    const hud = '<div class="s2hud"><span class="s2t">Hammadde360 Ofisi</span>' +
      (xp ? '<span class="s2xp"><b>Lv ' + xp.seviye + '</b> ' + esc(xp.baslik) + '<span class="bar"><i style="width:' + Math.max(2, Math.min(100, Math.round(xp.oran * 100))) + '%"></i></span>' + xp.xp + ' / ' + xp.ust + ' xp</span>' : '') + '</div>';
    const ctl = '<div class="s2ctl"><button type="button" data-s2="sol" aria-label="Sola döndür">⟲</button><button type="button" data-s2="sag" aria-label="Sağa döndür">⟳</button><button type="button" data-s2="ar" aria-label="Yakınlaştır">+</button><button type="button" data-s2="az" aria-label="Uzaklaştır">−</button></div>';
    const bal = SIRA.map(k => '<button class="s2b off mini" data-a="' + k + '" data-s="" data-m=""></button>').join('');
    return '<div class="scene2" id="scene"><canvas id="s2cv" height="420" aria-label="Ajan ofisi"></canvas>' + hud + '<div class="s2lay">' + bal + '</div>' + ctl + '</div>';
  };
  // ---------------- yan panel: seçilen ajanın yaptığı işlemler (canlı akar)
  const SEV = { ok: '#16a34a', warn: '#d98a00', error: '#d63b2b', info: '#8a8a99' };
  const CHIP = { work: '#3b6fd8', idle: '#8a8a99', arrive: '#1a9a52', ship: '#16a34a', warn: '#d98a00', bad: '#d63b2b', off: '#5a5170' };
  function zamanYaz(d) { const x = new Date(d), bugun = new Date(); return x.toDateString() === bugun.toDateString() ? x.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : x.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  function panelCiz(wrap) {
    let p = wrap.querySelector('.s2p');
    if (!D.pk) { if (p) p.remove(); return; }
    if (!p) {
      p = document.createElement('div'); p.className = 's2p';
      p.innerHTML = '<div class="s2ph"><div><b class="s2pn"></b><span class="s2ps"></span></div><button type="button" class="s2px" aria-label="Kapat">×</button></div><div class="s2pm"></div><div class="s2pl"></div><div class="s2pf"><button type="button" class="s2pd">Ayrıntı →</button><span class="s2pc"></span></div>';
      wrap.appendChild(p);
      p.querySelector('.s2px').onclick = () => { D.pk = null; clearInterval(D.pTimer); D.pTimer = 0; p.remove(); };
      p.querySelector('.s2pd').onclick = () => { if (S.ajanAc) S.ajanAc(D.pk); };
    }
    const [s, m] = durumMetni(D.pk, performance.now());
    p.querySelector('.s2pn').textContent = D.adlar[D.pk] || D.pk;
    const st = p.querySelector('.s2ps'); st.textContent = DURUM_AD[s]; st.style.background = CHIP[s] || '#64748b';
    p.querySelector('.s2pm').textContent = m;
    const l = p.querySelector('.s2pl'), liste = D.pEv || [];
    const yeniAnahtar = new Set();
    l.textContent = '';
    if (!liste.length) { const b = document.createElement('div'); b.className = 's2pb'; b.textContent = D.pYuklendi ? 'Henüz kayıtlı işlem yok.' : 'Yükleniyor...'; l.appendChild(b); }
    liste.forEach(e => {
      const key = e.created_at + '|' + e.message, el = document.createElement('div');
      el.className = 's2pe' + (D.pYuklendi && !D.pGor.has(key) ? ' yeni' : '');
      const dot = document.createElement('i'); dot.style.background = SEV[e.level] || SEV.info;
      const tm = document.createElement('time'); tm.textContent = zamanYaz(e.created_at);
      const sp = document.createElement('span'); sp.textContent = e.message;
      el.appendChild(dot); el.appendChild(tm); el.appendChild(sp); l.appendChild(el); yeniAnahtar.add(key);
    });
    yeniAnahtar.forEach(k => D.pGor.add(k));
    p.querySelector('.s2pc').textContent = 'canlı · 7 saniyede bir yenilenir';
  }
  async function panelYukle() {
    if (!D.cv || !D.cv.isConnected || !D.pk || !S.ajanVeri) { clearInterval(D.pTimer); D.pTimer = 0; return; }
    try {
      const v = await S.ajanVeri(D.pk);
      if (v) {
        D.pEv = (v.events || []).slice(0, 40);
        if (!D.pYuklendi) D.pEv.forEach(e => D.pGor.add(e.created_at + '|' + e.message));   // ilk listede vurgulama yok; sonradan gelenler yanar
        D.pYuklendi = true;
      }
    } catch (e) { /* ağ hatasında eski liste kalır */ }
    if (D.cv && D.cv.isConnected) panelCiz(D.cv.parentNode);
  }
  function panelAc(k) {
    if (D.pk !== k) { D.pk = k; D.pEv = []; D.pGor = new Set(); D.pYuklendi = false; }
    panelCiz(D.cv.parentNode); panelYukle();
    clearInterval(D.pTimer); D.pTimer = setInterval(panelYukle, 7000);
  }

  // XP -> seviye (iş büyüdükçe artar: görev, sipariş, ilan, üye). veri: {xp:sayı}
  const BASLIK = ['Çırak', 'Tezgâhtar', 'Tüccar', 'Broker', 'Baş Broker', 'Ticaret Ustası', 'Hammadde Baronu'];
  S.xpHesap = function (v) {
    if (!v || typeof v.xp !== 'number') return null;
    const xp = Math.max(0, Math.round(v.xp)), seviye = Math.floor(Math.sqrt(xp / 50)) + 1, alt = 50 * (seviye - 1) * (seviye - 1), ust = 50 * seviye * seviye;
    return { xp: xp, seviye: seviye, baslik: BASLIK[Math.min(seviye - 1, BASLIK.length - 1)], oran: (xp - alt) / (ust - alt), ust: ust };
  };
  S.sahneBagla = function () {
    const cv = document.getElementById('s2cv'); if (!cv) return;
    D.cv = cv;
    cv.style.height = Math.round(Math.max(330, Math.min(560, (cv.parentNode.clientWidth || 360) * 0.78))) + 'px';
    const wrap = cv.parentNode;
    wrap.querySelectorAll('[data-s2]').forEach(b => b.onclick = () => {
      const a = b.dataset.s2;
      if (a === 'sol') D.R = (D.R + 3) % 4; else if (a === 'sag') D.R = (D.R + 1) % 4; else if (a === 'ar') D.kul = Math.min(2.4, D.kul * 1.25); else D.kul = Math.max(0.55, D.kul / 1.25);
    });
    // sürükle: kaydır; kısa dokunuş: en yakın ajanı aç
    let bas = null;
    cv.onpointerdown = e => { bas = { x: e.clientX, y: e.clientY, px: D.panX, py: D.panY, hareket: false }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} };
    cv.onpointermove = e => { if (!bas) return; const dx = e.clientX - bas.x, dy = e.clientY - bas.y; if (Math.abs(dx) + Math.abs(dy) > 6) bas.hareket = true; if (bas.hareket) { D.panX = bas.px + dx; D.panY = bas.py + dy; } };
    cv.onpointerup = e => {
      const b = bas; bas = null; if (!b || b.hareket) return;
      const r = cv.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, J = proj(null, cv.clientWidth, cv.clientHeight);
      let en = null, ed = 46;
      SIRA.forEach(k => { const c = karakter(k), s = c.gorunur ? c : koltuk(k), p = J.P(s.x, s.y, 0.9), d = Math.hypot(p[0] - mx, p[1] - my); if (d < ed) { ed = d; en = k; } });
      if (en) { const bt = wrap.querySelector('.s2b[data-a="' + en + '"]'); if (bt) bt.click(); }
    };
    cv.onwheel = e => { e.preventDefault(); D.kul = Math.max(0.55, Math.min(2.4, D.kul * (e.deltaY < 0 ? 1.1 : 0.9))); };
    // balona/karaktere tıklayınca ajanın sayfasına gitmek yerine yan panel açılır (Ayrıntı düğmesi sayfaya götürür)
    wrap.addEventListener('click', e => { const b = e.target.closest('.s2b'); if (!b || !S.ajanVeri) return; e.stopPropagation(); e.preventDefault(); panelAc(b.dataset.a); }, true);
    if (D.pk) { panelCiz(wrap); if (!D.pTimer) D.pTimer = setInterval(panelYukle, 7000); }   // sayfa yenilense de panel açık kalır
    if (!D.raf) D.raf = requestAnimationFrame(dongu);
  };
})();
