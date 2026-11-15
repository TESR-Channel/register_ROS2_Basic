/* TESR Academy — invitation letter (หนังสือเชิญ) PDF generator.
   Course data comes from window.TESR_COURSE (set in index.html); the schedule is read from the page's .schedule-day tables.
   Signature / company seal: put transparent PNGs at assets/signature.png and assets/seal.png — they are used automatically. */
(function () {
  'use strict';
  var C = window.TESR_COURSE;
  if (!C) return;

  var CO = {
    th: 'บริษัท ทีอีเอสอาร์ จำกัด',
    en: 'TESR Co., Ltd. (Thai Embedded System and Robotics)',
    addr: '112/296 หมู่บ้านเพอร์เฟค มาสเตอร์พีซ หมู่ที่ 2 ตำบลไทรม้า อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
    tax: '0105560083185',
    venueName: 'TESR Playground (ด้านหลังร้าน <span class="nw">7-Eleven</span>)',
    venueAddr: '838 ถนนรัตนาธิเบศร์ ตำบลบางกระสอ อำเภอเมืองนนทบุรี จังหวัดนนทบุรี 11000',
    tel: '<span class="nw">082-983-7768</span> หรือ <span class="nw">090-465-6519</span>',
    telMain: '<span class="nw">082-983-7768</span>',
    line: '<span class="nw">www.tesrshop.com/line</span>',
    map: '<span class="nw">www.tesrshop.com/map_playground</span>',
    web: '<span class="nw">www.tesracademy.com</span>',
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
  want.addEventListener('change', function () { fields.hidden = !want.checked; if (want.checked) { prefillNames(); $('#invTo').focus(); } });
  st.addEventListener('change', function () {
    var p = parseD(st.value); if (!p) return;
    var d = new Date(p.y, p.m, p.d + (C.days - 1)); en.value = toInput(d);
  });
  document.querySelectorAll('a[href="#invite"]').forEach(function (a) {
    a.addEventListener('click', function () { want.checked = true; fields.hidden = false; prefillNames(); setTimeout(function () { $('#invTo').focus({ preventScroll: true }); }, 400); });
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
  function loadImg(src) {
    return new Promise(function (res) { var i = new Image(); i.onload = function () { res(i.naturalWidth ? src : null); }; i.onerror = function () { res(null); }; i.src = src + '?v=' + Date.now(); })
      .then(function (ok) { return ok ? src : null; });
  }
  function loadScript(src) {
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('โหลดไฟล์ไม่สำเร็จ: ' + src)); }; document.head.appendChild(s); });
  }
  var libs;
  function ensureLibs() {
    if (!libs) libs = Promise.all([
      window.html2canvas ? 1 : loadScript('assets/vendor/html2canvas.min.js'),
      (window.jspdf && window.jspdf.jsPDF) ? 1 : loadScript('assets/vendor/jspdf.umd.min.js')
    ]);
    return libs;
  }

  /* ---------------- letter HTML ---------------- */
  function headMini() {
    return '<div class="ivp-head mini"><img src="assets/tesr-logo-letter.png" alt="">' +
      '<div class="ivp-co"><b>' + CO.th + '</b><span>TESR Academy &nbsp; ' + CO.web + ' &nbsp; โทร ' + CO.telMain + '</span></div></div>';
  }
  function head() {
    return '<div class="ivp-head"><img src="assets/tesr-logo-letter.png" alt="">' +
      '<div class="ivp-co"><b>' + CO.th + '</b><span>' + CO.en + '</span>' +
      '<span>' + CO.addr + '</span><span>เลขประจำตัวผู้เสียภาษี ' + CO.tax + ' &nbsp; โทร ' + CO.telMain + ', <span class="nw">090-465-6519</span></span><span><em>TESR Academy</em> ' + CO.web + '</span></div></div>';
  }
  function foot(no, page, total) {
    return '<div class="ivp-foot"><div><b>TESR Academy</b> สถานที่อบรม ' + CO.venueName + ' ' + CO.venueAddr +
      '<br>สอบถาม โทร ' + CO.tel + ' &nbsp; LINE ' + CO.line + '<br>ตรวจสอบหนังสือ <span class="nw">เลขที่ ' + esc(no) + '</span> ได้ที่ช่องทางข้างต้น</div>' +
      '<div style="white-space:nowrap;text-align:right">หน้า ' + page + '/' + total + '</div></div>';
  }
  function buildPages(d) {
    var era = d.era, range = fmtRange(d.start, d.end, era);
    var n = d.names.length;
    var who = n ? joinTh(d.names) + (n > 1 ? ' รวม ' + n + ' ท่าน' : '') : 'บุคลากรในหน่วยงานของท่าน';
    var feeLine = 'อัตราค่าลงทะเบียนท่านละ ' + baht(C.price) + ' บาท (รวมภาษีมูลค่าเพิ่มแล้ว) หรือท่านละ ' + baht(C.promo) + ' บาท สำหรับการลงทะเบียนในช่วงโปรโมชั่น' +
      (n > 1 ? ' (ค่าลงทะเบียนรวม ' + n + ' ท่าน ' + baht(C.price * n) + ' บาท ตามอัตราปกติ)' : '');
    var total = 3;
    var sigImgs = (d.seal ? '<img class="seal" src="' + d.seal + '" alt="">' : '') + (d.sig ? '<img class="sig" src="' + d.sig + '" alt="">' : '');

    var p1 = '<div class="ivp">' + head() +
      '<div class="ivp-meta"><div>ที่ ' + esc(d.no) + '</div><div class="ivp-date">' + fmt(d.issue, era) + '</div></div>' +
      '<div class="ivp-kv"><b>เรื่อง</b><span>ขอเรียนเชิญเข้าร่วมอบรมหลักสูตร ' + esc(C.name) + '</span>' +
      '<b>เรียน</b><span>' + esc(d.to) + ' ' + esc(d.org) + '</span>' +
      '<b>สิ่งที่ส่งมาด้วย</b><span>รายละเอียดหลักสูตรและกำหนดการอบรม จำนวน 1 ชุด</span></div>' +
      '<div class="ivp-body">' +
      '<p>' + C.letterIntro + '</p>' +
      '<p>ในการนี้ บริษัทฯ เห็นว่าหลักสูตรดังกล่าวจะเป็นประโยชน์ต่อการพัฒนาบุคลากรของ' + esc(d.org) + ' จึงขอเรียนเชิญ ' + esc(who) +
      ' เข้าร่วมอบรมในวันที่ ' + range + ' เวลา ' + C.time + ' รวม ' + C.days + ' วัน ณ ' + CO.venueName + ' เลขที่ ' + CO.venueAddr + ' ' + feeLine +
      ' ทั้งนี้ ผู้เข้าอบรมจะได้รับสิทธิ์เรียน Online Course ของหลักสูตรนี้ที่ ' + CO.web + ' โดยไม่มีค่าใช้จ่ายเพิ่มเติม รายละเอียดดังเอกสารที่แนบมาพร้อมนี้</p>' +
      '<p>จึงเรียนมาเพื่อโปรดพิจารณา หากต้องการข้อมูลเพิ่มเติม กรุณาติดต่อ TESR Academy โทร ' + CO.tel + ' หรือ LINE ' + CO.line + ' ขอขอบคุณมา ณ โอกาสนี้</p>' +
      '</div>' +
      '<div class="ivp-sign"><div>ขอแสดงความนับถือ</div><div class="ivp-sigbox">' + (sigImgs || '<span class="ivp-sigline">..........................................................</span>') + '</div>' +
      '<div>(' + CO.signer + ')</div><div>' + CO.signerTitle + '</div></div>' +
      foot(d.no, 1, total) + '</div>';

    var info = [
      ['หลักสูตร', esc(C.name)],
      ['รูปแบบการอบรม', C.format],
      ['วันและเวลา', range + ' เวลา ' + C.time + ' (' + C.days + ' วัน)'],
      ['สถานที่', CO.venueName + '<br>' + CO.venueAddr + '<br>แผนที่ ' + CO.map + ' (จอดรถฟรี / MRT สายสีม่วง สถานีสะพานพระนั่งเกล้า ทางออก 1)'],
      ['ค่าลงทะเบียน', baht(C.price) + ' บาท/ท่าน (รวม VAT) ช่วงโปรโมชั่น ' + baht(C.promo) + ' บาท/ท่าน (รวม VAT)'],
      ['ผู้เข้าอบรมต้องเตรียม', C.prep.join('<br>')],
      ['สิทธิ์เพิ่มเติม', C.bonus]
    ].concat(n ? [['ผู้เข้าอบรม', d.names.map(function (x, i) { return (i + 1) + '. ' + esc(x); }).join('<br>')]] : []);
    var p2 = '<div class="ivp">' + headMini() +
      '<span class="tag" style="margin-top:18px">เอกสารแนบ</span>' +
      '<h2 style="margin-top:2px">รายละเอียดหลักสูตร ' + esc(C.name) + '</h2>' +
      '<p class="sub">จัดอบรมโดย TESR Academy ' + CO.th + '</p>' +
      '<table class="info">' + info.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; }).join('') + '</table>' +
      '<h3>เรียนจบแล้วทำอะไรได้</h3><ul class="dots">' + C.outcomes.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<h3>เหมาะกับใคร</h3><ul class="dots">' + C.audience.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      foot(d.no, 2, total) + '</div>';

    var sch = readSchedule();
    var schHtml = sch.map(function (day, i) {
      var date = '';
      if (d.start) { var dt = new Date(d.start.y, d.start.m, d.start.d + i); date = ' (' + fmt({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate() }, era) + ')'; }
      return '<table class="sch"><tr><th colspan="2">' + esc(day.title) + date + '</th></tr>' +
        day.rows.map(function (r) { var brk = /พัก/.test(r[1]); return '<tr' + (brk ? ' class="brk"' : '') + '><td>' + esc(r[0]).replace(/:/g, '.') + ' น.</td><td>' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>';
    }).join('');
    var p3 = '<div class="ivp">' + headMini() +
      '<h2 style="margin-top:22px">กำหนดการอบรม</h2>' + schHtml +
      '<h3>การลงทะเบียนและชำระค่าอบรม</h3>' +
      '<div class="pay">ลงทะเบียนออนไลน์ที่ <b class="nw">' + esc(C.regUrl) + '</b><br>' +
      'โอนเงินเข้าบัญชี ธนาคารกสิกรไทย ชื่อบัญชี บจก. ทีอีเอสอาร์ เลขที่บัญชี <span class="nw">027-3-58302-5</span> <span class="nw">สาขาจามจุรี สแควร์</span> หรือสแกน QR พร้อมเพย์บนหน้าลงทะเบียน<br>' +
      'ออกใบเสร็จรับเงิน/ใบกำกับภาษีในนาม ' + CO.th + ' เลขประจำตัวผู้เสียภาษี ' + CO.tax + '</div>' +
      foot(d.no, 3, total) + '</div>';
    return [p1, p2, p3];
  }

  /* ---------------- generate ---------------- */
  function say(msg, cls) { status.className = cls || ''; status.textContent = msg; }
  go.addEventListener('click', async function () {
    var to = $('#invTo').value.trim(), org = $('#invOrg').value.trim();
    var start = parseD(st.value), end = parseD(en.value) || start, issue = parseD(iss.value) || parseD(toInput(new Date()));
    var names = $('#invNames').value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean).slice(0, 30);
    var era = (document.querySelector('input[name=invEra]:checked') || {}).value || 'CE';
    if (!to) { say('กรุณากรอกตำแหน่งผู้รับหนังสือ', 'err'); $('#invTo').focus(); return; }
    if (!org) { say('กรุณากรอกชื่อหน่วยงาน / องค์กร', 'err'); $('#invOrg').focus(); return; }
    if (!start) { say('กรุณาเลือกวันที่เริ่มอบรม', 'err'); st.focus(); return; }
    var sd = new Date(start.y, start.m, start.d), ed = new Date(end.y, end.m, end.d);
    if (ed < sd) { say('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มอบรม', 'err'); en.focus(); return; }

    go.disabled = true; say('กำลังสร้างหนังสือเชิญ...');
    var stage;
    try {
      var r = Math.floor(1000 + Math.random() * 9000);
      var no = 'TA-' + C.code + '-' + issue.y + pad(issue.m + 1) + pad(issue.d) + '-' + r;
      var assets = await Promise.all([loadImg('assets/signature.png'), loadImg('assets/seal.png'), ensureLibs()]);
      if (document.fonts) { await Promise.all(['400 16px Sarabun', '600 16px Sarabun', '700 16px Sarabun'].map(function (f) { return document.fonts.load(f, 'ภาษาไทย'); })); }
      stage = document.createElement('div'); stage.id = 'invStage';
      stage.innerHTML = buildPages({ to: to, org: org, names: names, start: start, end: end, issue: issue, era: era, no: no, sig: assets[0], seal: assets[1] }).join('');
      document.body.appendChild(stage);
      await Promise.all(Array.prototype.map.call(stage.querySelectorAll('img'), function (im) { return im.complete ? 1 : new Promise(function (ok) { im.onload = im.onerror = ok; }); }));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      var pdf = new window.jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      var pages = stage.querySelectorAll('.ivp');
      for (var i = 0; i < pages.length; i++) {
        say('กำลังสร้างหน้า ' + (i + 1) + '/' + pages.length + '...');
        var cv = await window.html2canvas(pages[i], { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, windowWidth: 794 });
        if (i) pdf.addPage('a4', 'p');
        pdf.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
      }
      pdf.setProperties({ title: 'หนังสือเชิญเข้าร่วมอบรม ' + C.name, author: CO.th, subject: no, creator: 'TESR Academy' });
      var safeOrg = org.replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60);
      pdf.save('หนังสือเชิญ_' + C.short + '_' + safeOrg + '.pdf');
      say('✓ สร้างหนังสือเชิญเรียบร้อย ไฟล์ถูกดาวน์โหลดแล้ว (เลขที่ ' + no + ')', 'ok');
    } catch (e) {
      say('สร้างไฟล์ไม่สำเร็จ: ' + (e && e.message ? e.message : e) + ' กรุณาลองอีกครั้ง หรือติดต่อ LINE www.tesrshop.com/line', 'err');
    } finally {
      if (stage) stage.remove();
      go.disabled = false;
    }
  });
})();
