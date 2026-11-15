/* TESR Academy — invitation letter (หนังสือเชิญ) PDF generator.
   Draws the letter straight onto one canvas per page with the browser's own text engine (correct Thai shaping),
   then puts each page into a PDF with jsPDF. No html2canvas / DOM cloning, so it is fast and works on iPhone.
   Course data comes from window.TESR_COURSE (set in index.html); the schedule is read from the page's .schedule-day tables.
   Signature / company seal: transparent PNGs at assets/signature.png and assets/seal.png (used automatically if present). */
(function () {
  'use strict';
  var C = window.TESR_COURSE;
  if (!C) return;

  var CO = {
    th: 'บริษัท ทีอีเอสอาร์ จำกัด',
    en: 'TESR Co., Ltd. (Thai Embedded System and Robotics)',
    addr: '112/296 หมู่บ้านเพอร์เฟค มาสเตอร์พีซ หมู่ที่ 2 ตำบลไทรม้า อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
    tax: '0105560083185',
    venueName: 'TESR Playground (ด้านหลังร้าน 7-Eleven)',
    venueAddr: '838 ถนนรัตนาธิเบศร์ ตำบลบางกระสอ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
    tel1: '082-983-7768', tel2: '090-465-6519',
    line: 'www.tesrshop.com/line',
    map: 'www.tesrshop.com/map_playground',
    web: 'www.tesracademy.com',
    signer: 'นายอานนท์ หม้อสุวรรณ',
    signerTitle: 'ผู้จัดการ บริษัท ทีอีเอสอาร์ จำกัด'
  };
  var TH_M = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var baht = function (n) { return Number(n).toLocaleString('en-US'); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  function parseD(v) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ''); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; }
  function toInput(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function yr(y, era) { return era === 'BE' ? (y + 543) : y; }
  function fmt(p, era) { return p.d + ' ' + TH_M[p.m] + ' ' + yr(p.y, era); }
  function fmtRange(a, b, era) {
    if (!b || (a.y === b.y && a.m === b.m && a.d === b.d)) return fmt(a, era);
    if (a.y === b.y && a.m === b.m) return a.d + '–' + b.d + ' ' + TH_M[a.m] + ' ' + yr(a.y, era);
    if (a.y === b.y) return a.d + ' ' + TH_M[a.m] + ' – ' + b.d + ' ' + TH_M[b.m] + ' ' + yr(a.y, era);
    return fmt(a, era) + ' – ' + fmt(b, era);
  }
  function joinTh(list) {
    if (list.length <= 1) return list.join('');
    return list.slice(0, -1).join(', ') + ' และ' + list[list.length - 1];
  }

  /* ---------------- UI ---------------- */
  var host = $('#invite');
  if (!host) return;
  host.innerHTML =
    '<h2>หนังสือเชิญเข้าร่วมอบรม (PDF)</h2>' +
    '<p class="inv-lead">ต้องเสนอหัวหน้าหรือฝ่ายจัดซื้อก่อนลงทะเบียน? สร้างหนังสือเชิญจาก TESR พร้อมรายละเอียดหลักสูตรและกำหนดการได้เองทันที</p>' +
    '<label class="inv-check"><input type="checkbox" id="invWant"> ต้องการหนังสือเชิญ</label>' +
    '<div class="inv-fields" id="invFields" hidden>' +
      '<label for="invTo">เรียน (ตำแหน่งผู้รับหนังสือ) <span class="req">*</span></label>' +
      '<input type="text" id="invTo" placeholder="เช่น ผู้อำนวยการ, คณบดี, ผู้จัดการฝ่ายบุคคล" autocomplete="organization-title">' +
      '<label for="invOrg">หน่วยงาน / องค์กร <span class="req">*</span></label>' +
      '<input type="text" id="invOrg" placeholder="เช่น วิทยาลัยเทคนิคนนทบุรี, บริษัท ตัวอย่าง จำกัด" autocomplete="organization">' +
      '<label for="invNames">ชื่อผู้เข้าอบรม (ไม่บังคับ, บรรทัดละ 1 ท่าน)</label>' +
      '<textarea id="invNames" rows="3" placeholder="เช่น นายสมชาย ใจดี"></textarea>' +
      '<p class="inv-hint">ถ้าเว้นว่าง หนังสือจะเชิญ "บุคลากรในหน่วยงานของท่าน"</p>' +
      '<div class="inv-row">' +
        '<div><label for="invStart">วันที่เริ่มอบรม <span class="req">*</span></label><input type="date" id="invStart"></div>' +
        '<div><label for="invEnd">วันที่สิ้นสุดการอบรม</label><input type="date" id="invEnd"></div>' +
      '</div>' +
      '<p class="inv-hint">หลักสูตรนี้อบรม ' + C.days + ' วัน ระบบใส่วันสิ้นสุดให้อัตโนมัติ แก้ไขได้ ยังไม่ทราบรอบอบรม สอบถามได้ทาง LINE <a href="https://www.tesrshop.com/line" target="_blank" rel="noopener">tesrshop.com/line</a></p>' +
      '<div class="inv-row">' +
        '<div><label for="invIssue">วันที่ออกหนังสือ</label><input type="date" id="invIssue"></div>' +
        '<div><label>รูปแบบปีในเอกสาร</label><div class="inv-era">' +
          '<label><input type="radio" name="invEra" value="CE" checked> ค.ศ.</label>' +
          '<label><input type="radio" name="invEra" value="BE"> พ.ศ.</label></div></div>' +
      '</div>' +
      '<div class="inv-actions"><button type="button" class="tsx-btn solid" id="invGo">สร้างหนังสือเชิญ PDF</button>' +
      '<div id="invStatus" role="status" aria-live="polite"></div>' +
      '<p class="inv-hint">ได้ไฟล์ PDF: หนังสือเชิญ 1 หน้า พร้อมเอกสารแนบรายละเอียดหลักสูตรและกำหนดการ</p></div>' +
    '</div>';

  var want = $('#invWant'), fields = $('#invFields'), st = $('#invStart'), en = $('#invEnd'), iss = $('#invIssue'), go = $('#invGo'), status = $('#invStatus');
  iss.value = toInput(new Date());
  function prefillNames() { var ta = $('#invNames'); if (!ta.value.trim() && window.TESR_ATTENDEES) { var ns = window.TESR_ATTENDEES(); if (ns.length) ta.value = ns.join('\n'); } }
  want.addEventListener('change', function () { fields.hidden = !want.checked; if (want.checked) { prefillNames(); warmUp(); $('#invTo').focus(); } });
  st.addEventListener('change', function () {
    var p = parseD(st.value); if (!p) return;
    var d = new Date(p.y, p.m, p.d + (C.days - 1)); en.value = toInput(d);
  });
  document.querySelectorAll('a[href="#invite"]').forEach(function (a) {
    a.addEventListener('click', function () { want.checked = true; fields.hidden = false; prefillNames(); warmUp(); setTimeout(function () { $('#invTo').focus({ preventScroll: true }); }, 400); });
  });

  /* ---------------- data ---------------- */
  function readSchedule() {
    return Array.prototype.map.call(document.querySelectorAll('.schedule-day'), function (day) {
      var h = day.querySelector('h3');
      return {
        title: h ? h.textContent.trim() : '',
        rows: Array.prototype.map.call(day.querySelectorAll('tr'), function (tr) {
          var td = tr.querySelectorAll('td');
          return [td[0] ? td[0].textContent.trim() : '', td[1] ? td[1].textContent.trim() : ''];
        })
      };
    });
  }

  /* ---------------- assets ---------------- */
  function withTimeout(p, ms, msg) {
    return new Promise(function (ok, no) { var t = setTimeout(function () { no(new Error(msg || 'หมดเวลา')); }, ms); Promise.resolve(p).then(function (v) { clearTimeout(t); ok(v); }, function (e) { clearTimeout(t); no(e); }); });
  }
  var imgCache = {};
  function loadImg(src) {
    if (!imgCache[src]) imgCache[src] = new Promise(function (ok) {
      var im = new Image(); im.onload = function () { ok(im.naturalWidth ? im : null); }; im.onerror = function () { ok(null); }; im.src = src;
    });
    return imgCache[src];
  }
  var libs;
  function ensureLibs() {
    if (!libs) libs = (window.jspdf && window.jspdf.jsPDF) ? Promise.resolve() : new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = 'assets/vendor/jspdf.umd.min.js'; s.onload = res;
      s.onerror = function () { libs = null; rej(new Error('โหลดไฟล์ไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ต')); }; document.head.appendChild(s);
    });
    return libs;
  }
  var fontsP;
  function loadFonts() {
    if (!fontsP) fontsP = document.fonts ? Promise.all(['400', '600', '700'].map(function (w) { return document.fonts.load(w + ' 16px "Sarabun"', 'ภาษาไทย ABC'); })).catch(function () {}) : Promise.resolve();
    return fontsP;
  }
  function warmUp() { ensureLibs().catch(function () {}); loadFonts(); ['assets/tesr-logo-letter.png', 'assets/signature.png', 'assets/seal.png'].forEach(loadImg); }

  /* ---------------- tiny layout engine (CSS px on an A4 page of 794 x 1123) ---------------- */
  var PW = 794, PH = 1123, ML = 86, MR = 72, CW = PW - ML - MR, BOTTOM = PH - 100;
  var RED = '#8B0000', GOLD = '#C9A84C', INK = '#111111';
  function F(w, s) { return w + ' ' + s + 'px "Sarabun", "Thonburi", "Leelawadee UI", sans-serif'; }
  var mctx = document.createElement('canvas').getContext('2d');
  var SEG = (window.Intl && Intl.Segmenter) ? new Intl.Segmenter('th', { granularity: 'word' }) : null;
  function R(t, o) { o = o || {}; o.t = String(t); return o; } // a text run: {t, w (weight), c (colour), nw (no wrap)}
  function splitWords(t) {
    if (SEG) return Array.from(SEG.segment(t), function (x) { return x.segment; });
    return t.split(/(\s+)/);
  }
  function tokens(runs) {
    var out = [];
    runs.forEach(function (r) {
      if (typeof r === 'string') r = R(r);
      var st = { w: r.w || 400, c: r.c || INK };
      r.t.split(/(\n)/).forEach(function (part) {
        if (part === '\n') { out.push({ br: 1 }); return; }
        if (!part) return;
        (r.nw ? [part] : splitWords(part)).forEach(function (t) { if (t) out.push({ t: t, st: st }); });
      });
    });
    return out;
  }
  function measure(t, st, size) { mctx.font = F(st.w, size); return mctx.measureText(t).width; }
  function layout(runs, width, size, indent) {
    var toks = tokens(runs), lines = [], cur = [], cw = 0, first = true;
    function avail() { return width - (first ? (indent || 0) : 0); }
    function push() {
      while (cur.length && /^\s+$/.test(cur[cur.length - 1].t)) { cw -= cur[cur.length - 1].w; cur.pop(); }
      lines.push({ items: cur, width: cw, indent: first ? (indent || 0) : 0 }); cur = []; cw = 0; first = false;
    }
    toks.forEach(function (k) {
      if (k.br) { push(); return; }
      var sp = /^\s+$/.test(k.t);
      if (sp && !cur.length) return;
      var w = measure(k.t, k.st, size);
      if (cw + w > avail() && cur.length) { push(); if (sp) return; }
      if (w > avail()) { // a single very long token: break it by characters
        Array.from(k.t).forEach(function (ch) {
          var cwid = measure(ch, k.st, size);
          if (cw + cwid > avail() && cur.length) push();
          cur.push({ t: ch, st: k.st, w: cwid }); cw += cwid;
        });
        return;
      }
      cur.push({ t: k.t, st: k.st, w: w }); cw += w;
    });
    if (cur.length || !lines.length) push();
    return lines;
  }
  function drawLine(ctx, L, x, y, size, lh) {
    var base = y + lh / 2 + size * 0.36;
    L.items.forEach(function (it) { ctx.font = F(it.st.w, size); ctx.fillStyle = it.st.c; ctx.fillText(it.t, x, base); x += it.w; });
  }

  function Doc(mini) { this.pages = []; this.mini = mini; }
  Doc.prototype.newPage = function (withMini) { this.p = { ops: [] }; this.pages.push(this.p); this.y = 34; if (withMini) this.mini(this); };
  Doc.prototype.op = function (fn) { this.p.ops.push(fn); };
  Doc.prototype.ensure = function (h) { if (this.y + h > BOTTOM) this.newPage(true); };
  Doc.prototype.gap = function (h) { this.y += h; };
  Doc.prototype.flow = function (runs, o) {
    var self = this, lines = layout(runs, o.width || CW, o.size, o.indent), lh = o.lh || o.size * 1.6, x = o.x == null ? ML : o.x, w = o.width || CW;
    lines.forEach(function (L) {
      self.ensure(lh);
      var y = self.y, x0 = x + L.indent;
      if (o.align === 'center') x0 = x + (w - L.width) / 2; else if (o.align === 'right') x0 = x + w - L.width;
      self.op(function (ctx) { drawLine(ctx, L, x0, y, o.size, lh); });
      self.y += lh;
    });
  };
  Doc.prototype.rule = function (x1, x2, color, lw) { var y = this.y; this.op(function (ctx) { ctx.fillStyle = color; ctx.fillRect(x1, y, x2 - x1, lw); }); };
  Doc.prototype.image = function (img, x, y, w, h, rot, alpha) {
    if (!img) return;
    this.op(function (ctx) {
      ctx.save(); if (alpha != null) ctx.globalAlpha = alpha;
      if (rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot * Math.PI / 180); ctx.drawImage(img, -w / 2, -h / 2, w, h); }
      else ctx.drawImage(img, x, y, w, h);
      ctx.restore();
    });
  };
  // rows: [{cells:[runs...], fills:[colour|null], head:bool, span:bool}]
  Doc.prototype.table = function (rows, o) {
    var self = this, widths = o.widths, total = widths.reduce(function (a, b) { return a + b; }, 0);
    rows.forEach(function (r) {
      var ws = r.span ? [total] : widths, size = o.size, lh = o.lh;
      var lays = r.cells.map(function (c, i) { return layout(c, ws[i] - 2 * o.padX, size, 0); });
      var h = Math.max.apply(null, lays.map(function (l) { return l.length; })) * lh + 2 * o.padY;
      self.ensure(h);
      var y = self.y;
      self.op(function (ctx) {
        var x = o.x;
        ws.forEach(function (cw, i) {
          var fill = r.fills && r.fills[i];
          if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, cw, h); }
          if (o.grid) { ctx.strokeStyle = o.grid; ctx.lineWidth = 1; ctx.strokeRect(x + .5, y + .5, cw, h); }
          lays[i].forEach(function (L, k) { drawLine(ctx, L, x + o.padX, y + o.padY + k * lh, size, lh); });
          x += cw;
        });
        if (o.rule && !r.head) { ctx.fillStyle = o.rule; ctx.fillRect(o.x, y + h - 1, total, 1); }
      });
      self.y += h;
    });
  };

  /* ---------------- letter content ---------------- */
  function buildDoc(d, img) {
    var era = d.era, range = fmtRange(d.start, d.end, era), n = d.names.length;
    var who = n > 4 ? 'บุคลากรในหน่วยงานของท่าน รวม ' + n + ' ท่าน (รายชื่อตามเอกสารแนบ)' : n ? joinTh(d.names) + (n > 1 ? ' รวม ' + n + ' ท่าน' : '') : 'บุคลากรในหน่วยงานของท่าน';
    var feeLine = ' อัตราค่าลงทะเบียนท่านละ ' + baht(C.price) + ' บาท (รวมภาษีมูลค่าเพิ่มแล้ว) หรือท่านละ ' + baht(C.promo) + ' บาท สำหรับการลงทะเบียนในช่วงโปรโมชั่น' +
      (n > 1 ? ' (ค่าลงทะเบียนรวม ' + n + ' ท่าน ' + baht(C.price * n) + ' บาท ตามอัตราปกติ)' : '');
    var NW = function (t, o) { o = o || {}; o.nw = true; return R(t, o); };
    function logoSize(maxW) { var L = img.logo; return L ? { w: maxW, h: maxW * L.naturalHeight / L.naturalWidth } : { w: 0, h: 0 }; }

    function mini(doc) {
      var s = logoSize(40), y = doc.y;
      mctx.font = F(700, 16); var w1 = mctx.measureText(CO.th).width;
      var line2 = 'TESR Academy   ' + CO.web + '   โทร ' + CO.tel1; mctx.font = F(400, 12.5); var w2 = mctx.measureText(line2).width;
      var gw = s.w + 12 + Math.max(w1, w2), x0 = (PW - gw) / 2, tx = x0 + s.w + 12;
      doc.image(img.logo, x0, y, s.w, s.h);
      doc.op(function (ctx) {
        ctx.fillStyle = INK; ctx.font = F(700, 16); ctx.fillText(CO.th, tx, y + 18);
        ctx.fillStyle = '#333'; ctx.font = F(400, 12.5); ctx.fillText(line2, tx, y + 36);
      });
      doc.y = y + Math.max(s.h, 42) + 8;
      doc.rule(ML, PW - MR, RED, 2); doc.y += 6; doc.rule(ML, PW - MR, GOLD, 1); doc.y += 14;
    }
    var doc = new Doc(mini);

    // ---- page 1: the letter ----
    doc.newPage(false);
    var s = logoSize(66);
    doc.image(img.logo, (PW - s.w) / 2, doc.y + 4, s.w, s.h); doc.y += s.h + 10;
    doc.flow([R(CO.th, { w: 700 })], { size: 19, lh: 26, align: 'center' });
    doc.flow([CO.en], { size: 12.5, lh: 17, align: 'center' });
    doc.flow([CO.addr], { size: 12.5, lh: 17, align: 'center' });
    doc.flow(['เลขประจำตัวผู้เสียภาษี ' + CO.tax + '   โทร ', NW(CO.tel1 + ', ' + CO.tel2)], { size: 12.5, lh: 17, align: 'center' });
    doc.flow([R('TESR Academy', { w: 600, c: RED }), ' ', NW(CO.web)], { size: 12.5, lh: 17, align: 'center' });
    doc.y += 6; doc.rule(ML, PW - MR, RED, 2); doc.y += 6; doc.rule(ML, PW - MR, GOLD, 1); doc.y += 20;

    var yMeta = doc.y;
    doc.flow(['ที่ ' + d.no], { size: 15, lh: 26 });
    doc.y = yMeta; doc.flow([fmt(d.issue, era)], { size: 15, lh: 26, align: 'right' });
    doc.y += 12;
    [['เรื่อง', 'ขอเรียนเชิญเข้าร่วมอบรมหลักสูตร ' + C.name], ['เรียน', d.to + ' ' + d.org], ['สิ่งที่ส่งมาด้วย', 'รายละเอียดหลักสูตรและกำหนดการอบรม จำนวน 1 ชุด']].forEach(function (kv) {
      var y0 = doc.y;
      doc.flow([R(kv[0], { w: 700 })], { size: 15.5, lh: 26 });
      doc.y = y0; doc.flow([kv[1]], { size: 15.5, lh: 26, x: ML + 100, width: CW - 100 });
    });
    doc.y += 14;
    var P = { size: 15.5, lh: 26.5, indent: 50 };
    doc.flow([C.letterIntro], P); doc.y += 8;
    doc.flow(['ในการนี้ บริษัทฯ เห็นว่าหลักสูตรดังกล่าวจะเป็นประโยชน์ต่อการพัฒนาบุคลากรของ' + d.org + ' จึงขอเรียนเชิญ ' + who +
      ' เข้าร่วมอบรมในวันที่ ' + range + ' เวลา ' + C.time + ' รวม ' + C.days + ' วัน ณ TESR Playground (ด้านหลังร้าน ', NW('7-Eleven'), ') เลขที่ ' + CO.venueAddr + feeLine +
      ' ทั้งนี้ ผู้เข้าอบรมจะได้รับสิทธิ์เรียน Online Course ของหลักสูตรนี้ที่ ', NW(CO.web), ' โดยไม่มีค่าใช้จ่ายเพิ่มเติม รายละเอียดดังเอกสารที่แนบมาพร้อมนี้'], P);
    doc.y += 8;
    doc.flow(['จึงเรียนมาเพื่อโปรดพิจารณา หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อ TESR Academy โทร ', NW(CO.tel1), ' หรือ ', NW(CO.tel2), ' หรือ LINE ', NW(CO.line), ' ขอขอบคุณมา ณ โอกาสนี้'], P);
    // signature block (300px wide, right aligned); the seal sits in the blank space to its left
    doc.ensure(190);
    doc.y += 18;
    var sx = PW - MR - 300;
    doc.flow(['ขอแสดงความนับถือ'], { size: 15.5, lh: 26, x: sx, width: 300, align: 'center' });
    var by = doc.y;
    if (img.sig) { var sw = Math.min(220, 78 * img.sig.naturalWidth / img.sig.naturalHeight), sh = sw * img.sig.naturalHeight / img.sig.naturalWidth; doc.image(img.sig, sx + (300 - sw) / 2, by + 86 - sh, sw, sh); }
    else doc.op(function (ctx) { ctx.fillStyle = '#555'; ctx.font = F(400, 15.5); ctx.textAlign = 'center'; ctx.fillText('..........................................................', sx + 150, by + 78); ctx.textAlign = 'left'; });
    if (img.seal) { var kw = 96, kh = kw * img.seal.naturalHeight / img.seal.naturalWidth; doc.image(img.seal, sx - 150, by - 6, kw, kh, -4, 0.92); }
    doc.y = by + 90;
    doc.flow(['(' + CO.signer + ')'], { size: 15.5, lh: 26, x: sx, width: 300, align: 'center' });
    doc.flow([CO.signerTitle], { size: 15.5, lh: 26, x: sx, width: 300, align: 'center' });

    // ---- page 2: course details ----
    doc.newPage(true);
    doc.op((function (y) { return function (ctx) { ctx.fillStyle = RED; ctx.fillRect(ML, y, 74, 22); ctx.fillStyle = '#fff'; ctx.font = F(400, 12.5); ctx.fillText('เอกสารแนบ', ML + 10, y + 16); }; })(doc.y));
    doc.y += 26;
    doc.flow([R('รายละเอียดหลักสูตร ' + C.name, { w: 700 })], { size: 20, lh: 30 });
    doc.flow([R('จัดอบรมโดย TESR Academy ' + CO.th, { c: '#444' })], { size: 14.5, lh: 24 });
    doc.y += 6;
    var info = [
      ['หลักสูตร', [C.name]],
      ['รูปแบบการอบรม', [C.format]],
      ['วันและเวลา', [range + ' เวลา ' + C.time + ' (' + C.days + ' วัน)']],
      ['สถานที่', [CO.venueName + '\n' + CO.venueAddr + '\nแผนที่ ', NW(CO.map), ' (จอดรถฟรี / MRT สายสีม่วง สถานีสะพานพระนั่งเกล้า ทางออก 1)']],
      ['ค่าลงทะเบียน', [baht(C.price) + ' บาท/ท่าน (รวม VAT) ช่วงโปรโมชั่น ' + baht(C.promo) + ' บาท/ท่าน (รวม VAT)']],
      ['ผู้เข้าอบรมต้องเตรียม', [C.prep.join('\n')]],
      ['สิทธิ์เพิ่มเติม', [String(C.bonus)]]
    ];
    if (n) info.push(['ผู้เข้าอบรม', [d.names.map(function (x, i) { return (i + 1) + '. ' + x; }).join('\n')]]);
    doc.table(info.map(function (r) { return { cells: [[R(r[0], { w: 600 })], r[1]], fills: ['#f7f3ea', null] }; }), { x: ML, widths: [150, CW - 150], size: 14, lh: 21, padX: 10, padY: 6, grid: '#d9d2c2' });
    function h3(t) { doc.ensure(60); doc.y += 14; doc.flow([R(t, { w: 700, c: RED })], { size: 16, lh: 26 }); doc.rule(ML, PW - MR, '#e3d9bf', 1); doc.y += 6; }
    function bullets(list) { list.forEach(function (t) { var y0 = doc.y; doc.ensure(24); y0 = doc.y; doc.op(function (ctx) { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ML + 8, y0 + 12.5, 2.4, 0, Math.PI * 2); ctx.fill(); }); doc.flow([t], { size: 14.5, lh: 24, x: ML + 20, width: CW - 20 }); }); }
    h3('เรียนจบแล้วทำอะไรได้'); bullets(C.outcomes);
    h3('เหมาะกับใคร'); bullets(C.audience);

    // ---- page 3: schedule + payment ----
    doc.newPage(true);
    doc.flow([R('กำหนดการอบรม', { w: 700 })], { size: 20, lh: 32 });
    doc.y += 4;
    readSchedule().forEach(function (day, i) {
      var date = '';
      if (d.start) { var dt = new Date(d.start.y, d.start.m, d.start.d + i); date = ' (' + fmt({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }, era) + ')'; }
      var rows = [{ cells: [[R(day.title + date, { w: 600, c: '#fff' })]], fills: [RED], head: true, span: true }];
      day.rows.forEach(function (r) {
        var brk = /พัก/.test(r[1]), c = brk ? '#777' : INK;
        rows.push({ cells: [[R(r[0].replace(/:/g, '.') + ' น.', { c: brk ? '#777' : '#333' })], [R(r[1], { c: c })]] });
      });
      doc.ensure(80);
      doc.table(rows, { x: ML, widths: [132, CW - 132], size: 14, lh: 20, padX: 10, padY: 3.5, rule: '#e6e0d2' });
      doc.y += 10;
    });
    h3('การลงทะเบียนและชำระค่าอบรม');
    doc.y += 4;
    doc.table([{ cells: [['ลงทะเบียนออนไลน์ที่ ', NW(C.regUrl, { w: 700 }), '\nโอนเงินเข้าบัญชี ธนาคารกสิกรไทย ชื่อบัญชี บจก. ทีอีเอสอาร์ เลขที่บัญชี ', NW('027-3-58302-5'), ' ', NW('สาขาจามจุรี สแควร์'),
      ' หรือสแกน QR พร้อมเพย์บนหน้าลงทะเบียน\nออกใบเสร็จรับเงิน/ใบกำกับภาษีในนาม ' + CO.th + ' เลขประจำตัวผู้เสียภาษี ' + CO.tax]], fills: ['#fbf8f0'] }],
      { x: ML, widths: [CW], size: 14, lh: 22, padX: 14, padY: 10, grid: GOLD });
    return doc;
  }
  function drawFooter(ctx, no, page, total) {
    var y = PH - 26 - 52;
    ctx.fillStyle = GOLD; ctx.fillRect(ML, y, CW, 1);
    var lines = layout([R('TESR Academy', { w: 600, c: RED }), R(' สถานที่อบรม ' + CO.venueName + ' ' + CO.venueAddr, { c: '#444' }),
      R('\nสอบถาม โทร ' + CO.tel1 + ' หรือ ' + CO.tel2 + '   LINE ' + CO.line, { c: '#444' }),
      R('\nตรวจสอบหนังสือ เลขที่ ' + no + ' ได้ที่ช่องทางข้างต้น', { c: '#444' })], CW - 70, 11, 0);
    lines.forEach(function (L, i) { drawLine(ctx, L, ML, y + 6 + i * 16, 11, 16); });
    ctx.fillStyle = '#444'; ctx.font = F(400, 11); ctx.textAlign = 'right'; ctx.fillText('หน้า ' + page + '/' + total, PW - MR, y + 18); ctx.textAlign = 'left';
  }

  /* ---------------- generate ---------------- */
  function say(msg, cls) { status.className = cls || ''; status.textContent = msg; }
  var nextFrame = function () { return new Promise(function (ok) { (window.requestAnimationFrame || setTimeout)(function () { setTimeout(ok, 0); }); }); };
  go.addEventListener('click', async function () {
    var to = $('#invTo').value.trim(), org = $('#invOrg').value.trim();
    var start = parseD(st.value), end = parseD(en.value) || start, issue = parseD(iss.value) || parseD(toInput(new Date()));
    var names = $('#invNames').value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 30);
    var era = (document.querySelector('input[name=invEra]:checked') || {}).value || 'CE';
    if (!to) { say('กรุณากรอกตำแหน่งผู้รับหนังสือ', 'err'); $('#invTo').focus(); return; }
    if (!org) { say('กรุณากรอกชื่อหน่วยงาน / องค์กร', 'err'); $('#invOrg').focus(); return; }
    if (!start) { say('กรุณาเลือกวันที่เริ่มอบรม', 'err'); st.focus(); return; }
    if (new Date(end.y, end.m, end.d) < new Date(start.y, start.m, start.d)) { say('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มอบรม', 'err'); en.focus(); return; }

    go.disabled = true; say('กำลังสร้างหนังสือเชิญ...');
    var t0 = Date.now(), canvas;
    try {
      var no = 'TA-' + C.code + '-' + issue.y + pad(issue.m + 1) + pad(issue.d) + '-' + Math.floor(1000 + Math.random() * 9000);
      var got = await withTimeout(Promise.all([loadImg('assets/tesr-logo-letter.png'), loadImg('assets/signature.png'), loadImg('assets/seal.png'), ensureLibs(), loadFonts()]), 20000, 'โหลดไฟล์ประกอบนานเกินไป กรุณาตรวจสอบอินเทอร์เน็ต');
      var doc = buildDoc({ to: to, org: org, names: names, start: start, end: end, issue: issue, era: era, no: no }, { logo: got[0], sig: got[1], seal: got[2] });
      var S = Math.min(2, Math.max(1.5, window.devicePixelRatio || 2));
      canvas = document.createElement('canvas'); canvas.width = Math.round(PW * S); canvas.height = Math.round(PH * S);
      var ctx = canvas.getContext('2d');
      var pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      var total = doc.pages.length;
      for (var i = 0; i < total; i++) {
        say('กำลังสร้างหน้า ' + (i + 1) + '/' + total + '...');
        await nextFrame();
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(S, 0, 0, S, 0, 0); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
        doc.pages[i].ops.forEach(function (fn) { fn(ctx); });
        drawFooter(ctx, no, i + 1, total);
        if (i) pdf.addPage('a4', 'p');
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.88), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      pdf.setProperties({ title: 'หนังสือเชิญเข้าร่วมอบรม ' + C.name, author: CO.th, subject: no, creator: 'TESR Academy' });
      var fname = 'หนังสือเชิญ_' + C.short + '_' + org.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) + '.pdf';
      var url = URL.createObjectURL(pdf.output('blob'));
      pdf.save(fname);
      status.className = 'ok';
      status.innerHTML = '✓ สร้างหนังสือเชิญเรียบร้อย (เลขที่ ' + esc(no) + ') ใช้เวลา ' + Math.max(1, Math.round((Date.now() - t0) / 1000)) + ' วินาที<br>' +
        'ถ้าไฟล์ไม่ดาวน์โหลดเอง <a href="' + url + '" download="' + esc(fname) + '" target="_blank" rel="noopener" class="inv-open">แตะที่นี่เพื่อเปิดไฟล์ PDF</a>';
    } catch (e) {
      say('สร้างไฟล์ไม่สำเร็จ: ' + (e && e.message ? e.message : e) + ' กรุณาลองอีกครั้ง หรือติดต่อ LINE www.tesrshop.com/line', 'err');
    } finally {
      if (canvas) { canvas.width = canvas.height = 0; }
      go.disabled = false;
    }
  });
})();
